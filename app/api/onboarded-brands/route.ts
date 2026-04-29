export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { fetchAllActiveRestaurants, normalizeStatus } from '@/lib/crm-metrics'

type OnboardedRow = {
  brand_name: string
  converted_at: string
  converted_at_label: string
  changed_by: string
  source_sheet: string
}

const FINAL_LIST_SHEET = 'Final List'
const FINAL_LIST_SOURCE = 'Final List: Column A Brand + Column D Date + Column G Converted Yes'
const TOTAL_SOURCE_NAME = 'CRM Converted Restaurants'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey)
}

function getGoogleCredentials() {
  const envJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!envJson) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment')

  try {
    return JSON.parse(envJson)
  } catch {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format')
  }
}

function getDefaultYesterdayIST() {
  const now = new Date()
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  istDate.setDate(istDate.getDate() - 1)
  return istDate.toLocaleDateString('en-CA')
}

function normalizeDate(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const raw = String(value).trim()
  if (!raw) return null

  const cleaned = raw.replace(/\//g, '-').trim()

  const yyyyMmDd = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (yyyyMmDd) {
    const [, yyyy, mm, dd] = yyyyMmDd
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  }

  const ddMmYyyy = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (ddMmYyyy) {
    const [, dd, mm, yyyy] = ddMmYyyy
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  }

  const serial = Number(cleaned)
  if (!Number.isNaN(serial) && serial > 30000 && serial < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + serial)
    return excelEpoch.toISOString().slice(0, 10)
  }

  return null
}

function isYes(value: unknown) {
  const v = String(value || '').trim().toLowerCase()
  return ['yes', 'y', 'true', '1', 'converted'].includes(v)
}

function formatDateLabel(dateStr: string) {
  return new Date(`${dateStr}T12:00:00+05:30`).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTimeIST(value: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function matchesSearch(values: unknown[], search: string) {
  if (!search) return true
  return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(search))
}

async function fetchFinalListRowsForDate(selectedDate: string): Promise<OnboardedRow[]> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  if (!spreadsheetId) throw new Error('Missing GOOGLE_SHEET_ID')

  const credentials = getGoogleCredentials()

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${FINAL_LIST_SHEET}!A:G`,
    valueRenderOption: 'FORMATTED_VALUE',
  })

  const rows = response.data.values || []
  const dataRows = rows.slice(1)
  const onboardedRows: OnboardedRow[] = []

  for (const row of dataRows) {
    // Fixed Google Sheet columns:
    // A = Brand Name, D = Date, E = Executive, G = Converted
    const restaurantName = String(row[0] || '').trim()
    const date = normalizeDate(row[3])
    const executive = String(row[4] || '—').trim() || '—'
    const converted = isYes(row[6])

    if (!restaurantName) continue
    if (date !== selectedDate) continue
    if (!converted) continue

    onboardedRows.push({
      brand_name: restaurantName,
      converted_at: selectedDate,
      converted_at_label: formatDateLabel(selectedDate),
      changed_by: executive,
      source_sheet: FINAL_LIST_SOURCE,
    })
  }

  return onboardedRows
}

async function buildTotalRows(supabase: ReturnType<typeof createClient>, search: string) {
  const rows = await fetchAllActiveRestaurants(
    supabase,
    'id, restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted, is_deactivated'
  )

  return (rows || [])
    .filter((row: any) => normalizeStatus(row.lead_status, row.converted) === 'converted')
    .map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      assigned_to: row.assigned_to_name || 'Unassigned',
      source_sheet: row.source_sheet || TOTAL_SOURCE_NAME,
      last_updated: row.updated_at || row.synced_at || null,
      last_updated_label: formatDateTimeIST(row.updated_at || row.synced_at || null),
    }))
    .filter((row: any) => matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const selectedDate = (searchParams.get('date') || searchParams.get('from') || getDefaultYesterdayIST()).trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const supabase = getSupabaseAdmin()
    const dailyBrands = (await fetchFinalListRowsForDate(selectedDate)).filter((row) =>
      matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search)
    )

    const allBrands = await buildTotalRows(supabase, search)

    return NextResponse.json({
      success: true,
      summary: {
        selectedDate,
        fromDate: selectedDate,
        toDate: selectedDate,
        yesterdayCount: dailyBrands.length,
        totalBrandsTillDate: allBrands.length,
      },
      yesterdayBrands: dailyBrands,
      allBrands,
      source: `${FINAL_LIST_SOURCE}; ${TOTAL_SOURCE_NAME} for total`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

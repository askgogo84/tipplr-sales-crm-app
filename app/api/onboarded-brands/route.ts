export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import { fetchAllActiveRestaurants, normalizeStatus } from '@/lib/crm-metrics'

const ONBOARDED_LOG_SHEET = 'Merchant Logs History'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey)
}

function getGoogleCredentials() {
  const envJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!envJson) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON')

  try {
    return JSON.parse(envJson)
  } catch {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format')
  }
}

async function getGoogleSheetsClient() {
  if (!process.env.GOOGLE_SHEET_ID) throw new Error('Missing GOOGLE_SHEET_ID')

  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  return google.sheets({ version: 'v4', auth })
}

function getISTDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function getDefaultYesterdayIST() {
  const now = new Date()
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  istDate.setDate(istDate.getDate() - 1)
  return getISTDateString(istDate)
}

function excelSerialToDateString(value: number) {
  const utc = Date.UTC(1899, 11, 30) + value * 24 * 60 * 60 * 1000
  return new Date(utc).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
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

function formatDateLabel(dateStr: string) {
  return new Date(`${dateStr}T12:00:00+05:30`).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeSheetDate(value: unknown): string | null {
  if (value === null || value === undefined) return null

  if (typeof value === 'number' && Number.isFinite(value)) {
    return excelSerialToDateString(value)
  }

  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const asNumber = Number(raw)
    if (asNumber > 25000 && asNumber < 80000) return excelSerialToDateString(asNumber)
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  const indianMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/)
  if (indianMatch) {
    const [, d, m, yRaw] = indianMatch
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  }

  return null
}

function matchesSearch(values: unknown[], search: string) {
  if (!search) return true
  return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(search))
}

function uniqueByBrandDateAndExecutive(rows: any[]) {
  const seen = new Set<string>()
  const unique: any[] = []

  for (const row of rows) {
    const key = [
      String(row.brand_name || '').trim().toLowerCase(),
      String(row.converted_at || '').trim().toLowerCase(),
      String(row.changed_by || '').trim().toLowerCase(),
    ].join('::')

    if (seen.has(key)) continue
    seen.add(key)
    unique.push(row)
  }

  return unique
}

async function fetchOnboardedLogRows() {
  const sheets = await getGoogleSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${ONBOARDED_LOG_SHEET}'!A:D`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER',
  })

  const rows = response.data.values || []
  const dataRows = rows.slice(1)

  return dataRows
    .map((row: any[]) => {
      const date = normalizeSheetDate(row[1])
      const brand = String(row[2] || '').trim()
      const executive = String(row[3] || '').trim()

      if (!date || !brand) return null

      return {
        brand_name: brand,
        converted_at: date,
        converted_at_label: formatDateLabel(date),
        changed_by: executive || '—',
        source_sheet: ONBOARDED_LOG_SHEET,
      }
    })
    .filter(Boolean) as any[]
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const requestedDate = (searchParams.get('date') || searchParams.get('from') || '').trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const selectedDate = requestedDate || getDefaultYesterdayIST()

    const [onboardedLogRows, allRestaurantRows] = await Promise.all([
      fetchOnboardedLogRows(),
      fetchAllActiveRestaurants(
        supabase,
        'id, restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted, is_deactivated, go_live_date'
      ),
    ])

    const dailyBrands = uniqueByBrandDateAndExecutive(
      onboardedLogRows
        .filter((row: any) => row.converted_at === selectedDate)
        .filter((row: any) =>
          matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search)
        )
    )

    const convertedRows = (allRestaurantRows || []).filter(
      (row: any) => normalizeStatus(row.lead_status, row.converted) === 'converted'
    )

    const allBrands = convertedRows
      .map((row: any) => ({
        brand_name: row.restaurant_name || '—',
        assigned_to: row.assigned_to_name || 'Unassigned',
        source_sheet: row.source_sheet || '—',
        last_updated: row.updated_at || row.synced_at,
        last_updated_label: formatDateTimeIST(row.updated_at || row.synced_at),
      }))
      .filter((row: any) =>
        matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search)
      )

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
      source: ONBOARDED_LOG_SHEET,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

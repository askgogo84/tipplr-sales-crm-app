export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { fetchAllActiveRestaurants, normalizeStatus } from '@/lib/crm-metrics'

type DailyExportRow = {
  sl_no: number
  restaurant_name: string
  onboarded_date: string
  executive: string
  source: string
}

const FINAL_LIST_SHEET = 'Final List'
const FINAL_LIST_SOURCE = 'Final List Column D + Column G'
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

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
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

async function getFinalListRowsForDate(selectedDate: string): Promise<DailyExportRow[]> {
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
  const output: DailyExportRow[] = []
  const seen = new Set<string>()

  for (const row of dataRows) {
    // Final List fixed columns:
    // A = Brand Name, D = Date, E = Executive, G = Converted
    const restaurantName = String(row[0] || '').trim()
    const rowDate = normalizeDate(row[3])
    const executive = String(row[4] || '—').trim() || '—'
    const converted = isYes(row[6])

    if (!restaurantName) continue
    if (rowDate !== selectedDate) continue
    if (!converted) continue

    const key = `${restaurantName.toLowerCase()}::${rowDate}`
    if (seen.has(key)) continue
    seen.add(key)

    output.push({
      sl_no: output.length + 1,
      restaurant_name: restaurantName,
      onboarded_date: selectedDate,
      executive,
      source: FINAL_LIST_SOURCE,
    })
  }

  return output
}

async function getAllConvertedRows(supabase: any, search: string) {
  const all = await fetchAllActiveRestaurants(
    supabase,
    'id, restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted, is_deactivated'
  )

  return (all || [])
    .filter((row: any) => normalizeStatus(row.lead_status, row.converted) === 'converted')
    .map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      assigned_to: row.assigned_to_name || 'Unassigned',
      source_sheet: row.source_sheet || TOTAL_SOURCE_NAME,
      last_updated: formatDateTimeIST(row.updated_at || row.synced_at || null),
    }))
    .filter((row: any) => matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search))
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') || 'range').trim()
    const selectedDate = (searchParams.get('date') || searchParams.get('from') || getDefaultYesterdayIST()).trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    if (type === 'all') {
      const rows = await getAllConvertedRows(supabase, search)
      const headers = ['Brand Name', 'Assigned To', 'Source Sheet', 'Last Updated']
      const lines = [
        headers.join(','),
        ...rows.map((row: any) => [
          escapeCsv(row.brand_name),
          escapeCsv(row.assigned_to),
          escapeCsv(row.source_sheet),
          escapeCsv(row.last_updated),
        ].join(',')),
      ]

      return new NextResponse('\uFEFF' + lines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="onboarded-brands-all.csv"',
        },
      })
    }

    const rows = await getFinalListRowsForDate(selectedDate)
    const filtered = rows.filter((row) =>
      matchesSearch([row.restaurant_name, row.executive, row.source], search)
    )

    const headers = ['SL No', 'Restaurant Name', 'Onboarded Date', 'Executive', 'Source']
    const lines = [
      headers.join(','),
      ...filtered.map((row, index) => [
        escapeCsv(index + 1),
        escapeCsv(row.restaurant_name),
        escapeCsv(row.onboarded_date),
        escapeCsv(row.executive),
        escapeCsv(row.source),
      ].join(',')),
    ]

    return new NextResponse('\uFEFF' + lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="onboarded-brands-${selectedDate}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const PREFERRED_LOG_SHEET = 'Merchant Logs History'

type OnboardedRow = {
  brand_name: string
  converted_at: string
  converted_at_label: string
  changed_by: string
  source_sheet: string
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

function quoteSheetName(title: string) {
  return `'${title.replace(/'/g, "''")}'!A:Z`
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

function normalizeHeader(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function findHeaderIndex(headers: string[], candidates: string[]) {
  return headers.findIndex((header) =>
    candidates.some((candidate) => header === candidate || header.includes(candidate))
  )
}

function matchesSearch(values: unknown[], search: string) {
  if (!search) return true
  return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(search))
}

function uniqueRows(rows: OnboardedRow[]) {
  const seen = new Set<string>()
  const unique: OnboardedRow[] = []

  for (const row of rows) {
    const key = [
      row.brand_name.trim().toLowerCase(),
      row.converted_at,
      row.changed_by.trim().toLowerCase(),
    ].join('::')

    if (seen.has(key)) continue
    seen.add(key)
    unique.push(row)
  }

  return unique
}

function parseRowsFromSheet(title: string, rows: any[][]): OnboardedRow[] {
  if (!rows.length) return []

  let headerRowIndex = -1
  let dateIdx = -1
  let brandIdx = -1
  let executiveIdx = -1

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const headers = (rows[i] || []).map(normalizeHeader)

    const dIdx = findHeaderIndex(headers, ['date', 'onboarded date', 'go live date'])
    const bIdx = findHeaderIndex(headers, ['restaurant', 'brand', 'brand name', 'restaurant name', 'outlet'])
    const eIdx = findHeaderIndex(headers, ['executives', 'executive', 'assigned to', 'assigned_to', 'called by'])

    if (dIdx >= 0 && bIdx >= 0) {
      headerRowIndex = i
      dateIdx = dIdx
      brandIdx = bIdx
      executiveIdx = eIdx
      break
    }
  }

  // Fallback for the exact uploaded format: SL NO | Date | Restaurant | Executives
  if (headerRowIndex < 0) {
    headerRowIndex = 0
    dateIdx = 1
    brandIdx = 2
    executiveIdx = 3
  }

  const dataRows = rows.slice(headerRowIndex + 1)

  return dataRows
    .map((row: any[]) => {
      const date = normalizeSheetDate(row[dateIdx])
      const brand = String(row[brandIdx] || '').trim()
      const executive = executiveIdx >= 0 ? String(row[executiveIdx] || '').trim() : ''

      if (!date || !brand) return null

      return {
        brand_name: brand,
        converted_at: date,
        converted_at_label: formatDateLabel(date),
        changed_by: executive || '—',
        source_sheet: title,
      }
    })
    .filter(Boolean) as OnboardedRow[]
}

async function fetchOnboardedLogRows() {
  const sheets = await getGoogleSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!

  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const titles = (meta.data.sheets || [])
    .map((sheet) => sheet.properties?.title)
    .filter(Boolean) as string[]

  const preferred = titles.find(
    (title) => title.trim().toLowerCase() === PREFERRED_LOG_SHEET.toLowerCase()
  )

  const candidates = preferred
    ? [preferred]
    : titles.filter((title) => {
        const t = title.toLowerCase()
        return (
          t.includes('merchant') ||
          t.includes('log') ||
          t.includes('onboard') ||
          t.includes('outlet count') ||
          t.includes('history')
        )
      })

  const sheetsToCheck = candidates.length ? candidates : titles
  let parsedRows: OnboardedRow[] = []
  let usedSheet = preferred || sheetsToCheck[0] || PREFERRED_LOG_SHEET
  const errors: string[] = []

  for (const title of sheetsToCheck) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: quoteSheetName(title),
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'SERIAL_NUMBER',
      })

      const rows = response.data.values || []
      const parsed = parseRowsFromSheet(title, rows)

      if (parsed.length > parsedRows.length) {
        parsedRows = parsed
        usedSheet = title
      }

      if (preferred) break
    } catch (error) {
      errors.push(`${title}: ${error instanceof Error ? error.message : 'Failed to read sheet'}`)
    }
  }

  if (!parsedRows.length) {
    throw new Error(
      `No onboarded log rows found. Add a tab with columns: SL NO | Date | Restaurant | Executives. Available tabs: ${titles.join(', ')}${
        errors.length ? `. Read errors: ${errors.join(' | ')}` : ''
      }`
    )
  }

  return {
    source: usedSheet,
    rows: uniqueRows(parsedRows),
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const requestedDate = (searchParams.get('date') || searchParams.get('from') || '').trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const selectedDate = requestedDate || getDefaultYesterdayIST()
    const onboarded = await fetchOnboardedLogRows()

    const allBrands = onboarded.rows
      .map((row) => ({
        brand_name: row.brand_name,
        assigned_to: row.changed_by,
        source_sheet: row.source_sheet,
        last_updated: row.converted_at,
        last_updated_label: row.converted_at_label,
      }))
      .filter((row) => matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search))

    const dailyBrands = onboarded.rows
      .filter((row) => row.converted_at === selectedDate)
      .filter((row) => matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search))

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
      source: onboarded.source,
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

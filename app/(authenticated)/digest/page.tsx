export const dynamic = 'force-dynamic'
export const revalidate = 0

import { google } from 'googleapis'
import DigestClient from './DigestClient'

type DigestRow = {
  restaurant_name: string
  executive: string
  status: string
  source_sheet: string
  changed_at: string
}

const FINAL_LIST_SHEET = 'Final List'

function getGoogleCredentials() {
  const envJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!envJson) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment')

  try {
    return JSON.parse(envJson)
  } catch {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format')
  }
}

function getISTDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
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

function normaliseName(value: unknown) {
  const raw = String(value || '').trim()
  return raw || 'Unassigned'
}

async function fetchFinalListConvertedRows(selectedDate: string): Promise<DigestRow[]> {
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
  const result: DigestRow[] = []
  const seen = new Set<string>()

  for (const row of dataRows) {
    // Final List fixed columns:
    // A = Brand Name, D = Date, E = Executive, G = Converted
    const restaurantName = String(row[0] || '').trim()
    const rowDate = normalizeDate(row[3])
    const executive = normaliseName(row[4])
    const converted = isYes(row[6])

    if (!restaurantName) continue
    if (rowDate !== selectedDate) continue
    if (!converted) continue

    const key = `${restaurantName.toLowerCase()}::${executive.toLowerCase()}::${selectedDate}`
    if (seen.has(key)) continue
    seen.add(key)

    result.push({
      restaurant_name: restaurantName,
      executive,
      status: 'Converted',
      source_sheet: FINAL_LIST_SHEET,
      changed_at: selectedDate,
    })
  }

  return result
}

export default async function DigestPage() {
  try {
    const selectedDate = getISTDateString()
    const convertedRows = await fetchFinalListConvertedRows(selectedDate)

    const repMap = new Map<string, { converted: number; restaurants: string[] }>()

    for (const row of convertedRows) {
      const name = row.executive || 'Unassigned'
      if (!repMap.has(name)) {
        repMap.set(name, { converted: 0, restaurants: [] })
      }

      const stat = repMap.get(name)!
      stat.converted++
      stat.restaurants.push(row.restaurant_name)
    }

    const execStats = Array.from(repMap.entries())
      .map(([name, s]) => ({
        name,
        updated: s.converted,
        agreed: 0,
        converted: s.converted,
        closed: s.converted,
        followup: 0,
        callback: 0,
        notInterested: 0,
        restaurants: Array.from(new Set(s.restaurants)),
      }))
      .sort((a, b) => b.converted - a.converted || a.name.localeCompare(b.name))

    const totalConverted = convertedRows.length
    const totalUpdatedToday = totalConverted
    const totalAgreed = 0
    const totalClosed = totalConverted
    const totalFollowup = 0
    const totalCallback = 0
    const totalNotInterested = 0
    const conversionRate = totalUpdatedToday > 0 ? '100.0' : '0.0'

    const recentActivities = convertedRows.map((row) => ({
      restaurant_name: row.restaurant_name,
      executive: row.executive,
      status: row.status,
      source_sheet: row.source_sheet,
      changed_at: row.changed_at,
    }))

    const dateLabel = new Date(`${selectedDate}T12:00:00+05:30`).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return (
      <DigestClient
        execStats={execStats}
        recentActivities={recentActivities}
        totalUpdatedToday={totalUpdatedToday}
        totalAgreed={totalAgreed}
        totalConverted={totalConverted}
        totalClosed={totalClosed}
        totalFollowup={totalFollowup}
        totalCallback={totalCallback}
        totalNotInterested={totalNotInterested}
        conversionRate={conversionRate}
        dateLabel={dateLabel}
      />
    )
  } catch (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load digest data: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }
}

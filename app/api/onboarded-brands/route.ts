export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAllActiveRestaurants, normalizeStatus } from '@/lib/crm-metrics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getISTDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function getDefaultYesterdayIST() {
  const now = new Date()
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  istDate.setDate(istDate.getDate() - 1)
  return getISTDateString(istDate)
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

  const raw = String(value).trim()
  if (!raw) return null

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
  return values
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(search))
}

function uniqueByBrandAndSheet(rows: any[]) {
  const seen = new Set<string>()
  const unique: any[] = []

  for (const row of rows) {
    const key = `${String(row.brand_name || '').toLowerCase()}::${String(row.source_sheet || '').toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(row)
  }

  return unique
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const requestedDate =
      (searchParams.get('date') || searchParams.get('from') || '').trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const selectedDate = requestedDate || getDefaultYesterdayIST()

    const allRestaurantRows = await fetchAllActiveRestaurants(
      supabase,
      'id, restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted, is_deactivated, go_live_date'
    )

    const convertedRows = (allRestaurantRows || []).filter(
      (row: any) => normalizeStatus(row.lead_status, row.converted) === 'converted'
    )

    // Daily onboarded brands should come from the sheet's actual Go Live Date.
    // We should not use updated_at because manual sync updates old converted rows together.
    const dailyBrands = uniqueByBrandAndSheet(
      convertedRows
        .filter((row: any) => normalizeSheetDate(row.go_live_date) === selectedDate)
        .map((row: any) => ({
          brand_name: row.restaurant_name || '—',
          converted_at: normalizeSheetDate(row.go_live_date) || selectedDate,
          converted_at_label: formatDateLabel(normalizeSheetDate(row.go_live_date) || selectedDate),
          changed_by: row.assigned_to_name || 'Sheet Sync',
          source_sheet: row.source_sheet || '—',
        }))
        .filter((row: any) =>
          matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search)
        )
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

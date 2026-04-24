export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

function startOfISTDayUtc(dateStr: string) {
  return new Date(`${dateStr}T00:00:00+05:30`).toISOString()
}

function endOfISTDayUtc(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999+05:30`).toISOString()
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

function isConverted(row: any) {
  const status = String(row.lead_status || '').trim().toLowerCase()
  return status === 'converted' || row.converted === true
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
    const fromUtc = startOfISTDayUtc(selectedDate)
    const toUtc = endOfISTDayUtc(selectedDate)

    const { data: dailyLogs, error: dailyLogsError } = await supabase
      .from('restaurant_activity_log')
      .select('restaurant_name, source_sheet, changed_by, new_status, created_at')
      .eq('new_status', 'Converted')
      .gte('created_at', fromUtc)
      .lte('created_at', toUtc)
      .order('created_at', { ascending: false })

    if (dailyLogsError) {
      return NextResponse.json(
        { success: false, error: dailyLogsError.message },
        { status: 500 }
      )
    }

    const dailyBrands = uniqueByBrandAndSheet(
      (dailyLogs || [])
        .map((row: any) => ({
          brand_name: row.restaurant_name || '—',
          converted_at: row.created_at,
          converted_at_label: formatDateTimeIST(row.created_at),
          changed_by: row.changed_by || 'System',
          source_sheet: row.source_sheet || '—',
        }))
        .filter((row: any) =>
          matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search)
        )
    )

    const { data: allConvertedRows, error: allConvertedError } = await supabase
      .from('restaurants')
      .select('restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted')
      .or('lead_status.ilike.Converted,converted.eq.true')
      .order('updated_at', { ascending: false })

    if (allConvertedError) {
      return NextResponse.json(
        { success: false, error: allConvertedError.message },
        { status: 500 }
      )
    }

    const allBrands = (allConvertedRows || [])
      .filter(isConverted)
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

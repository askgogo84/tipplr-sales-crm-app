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

function matchesSearch(row: any, values: unknown[], search: string) {
  if (!search) return true
  return values
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(search))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = (searchParams.get('from') || '').trim()
    const to = (searchParams.get('to') || '').trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const defaultYesterday = getDefaultYesterdayIST()
    const fromDate = from || defaultYesterday
    const toDate = to || defaultYesterday

    const fromUtc = startOfISTDayUtc(fromDate)
    const toUtc = endOfISTDayUtc(toDate)

    const { data: rangeRows, error: rangeError } = await supabase
      .from('restaurants')
      .select('restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted')
      .or('lead_status.ilike.Converted,converted.eq.true')
      .gte('updated_at', fromUtc)
      .lte('updated_at', toUtc)
      .order('updated_at', { ascending: false })

    if (rangeError) {
      return NextResponse.json(
        { success: false, error: rangeError.message },
        { status: 500 }
      )
    }

    let selectedRangeBrands = (rangeRows || [])
      .filter(isConverted)
      .map((row: any) => ({
        brand_name: row.restaurant_name || '—',
        converted_at: row.updated_at || row.synced_at,
        converted_at_label: formatDateTimeIST(row.updated_at || row.synced_at),
        changed_by: row.assigned_to_name || 'Sheet Sync',
        source_sheet: row.source_sheet || '—',
      }))
      .filter((row: any) =>
        matchesSearch(row, [row.brand_name, row.changed_by, row.source_sheet], search)
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

    let allBrands = (allConvertedRows || [])
      .filter(isConverted)
      .map((row: any) => ({
        brand_name: row.restaurant_name || '—',
        assigned_to: row.assigned_to_name || 'Unassigned',
        source_sheet: row.source_sheet || '—',
        last_updated: row.updated_at || row.synced_at,
        last_updated_label: formatDateTimeIST(row.updated_at || row.synced_at),
      }))
      .filter((row: any) =>
        matchesSearch(row, [row.brand_name, row.assigned_to, row.source_sheet], search)
      )

    return NextResponse.json({
      success: true,
      summary: {
        fromDate,
        toDate,
        yesterdayCount: selectedRangeBrands.length,
        totalBrandsTillDate: allBrands.length,
      },
      yesterdayBrands: selectedRangeBrands,
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

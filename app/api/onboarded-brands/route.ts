export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatDateOnly(d: Date) {
  return d.toISOString().slice(0, 10)
}

function startOfDay(dateStr: string) {
  return `${dateStr}T00:00:00.000Z`
}

function endOfDay(dateStr: string) {
  return `${dateStr}T23:59:59.999Z`
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = (searchParams.get('from') || '').trim()
    const to = (searchParams.get('to') || '').trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = formatDateOnly(yesterday)

    const fromDate = from || yesterdayStr
    const toDate = to || yesterdayStr

    const { data: convertedLogs, error: convertedLogsError } = await supabase
      .from('restaurant_activity_log')
      .select('restaurant_name, source_sheet, changed_by, new_status, created_at')
      .eq('new_status', 'Converted')
      .gte('created_at', startOfDay(fromDate))
      .lte('created_at', endOfDay(toDate))
      .order('created_at', { ascending: false })

    if (convertedLogsError) {
      return NextResponse.json(
        { success: false, error: convertedLogsError.message },
        { status: 500 }
      )
    }

    let filteredYesterday = (convertedLogs || []).map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      converted_at: row.created_at,
      converted_at_label: formatDateTimeIST(row.created_at),
      changed_by: row.changed_by || 'System',
      source_sheet: row.source_sheet || '—',
    }))

    if (search) {
      filteredYesterday = filteredYesterday.filter((row: any) =>
        [row.brand_name, row.changed_by, row.source_sheet]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search))
      )
    }

    const { data: allConvertedRows, error: allConvertedError } = await supabase
      .from('restaurants')
      .select('restaurant_name, assigned_to_name, source_sheet, updated_at, lead_status, converted')
      .or('lead_status.eq.Converted,converted.eq.true')
      .order('updated_at', { ascending: false })

    if (allConvertedError) {
      return NextResponse.json(
        { success: false, error: allConvertedError.message },
        { status: 500 }
      )
    }

    let allBrands = (allConvertedRows || []).map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      assigned_to: row.assigned_to_name || 'Unassigned',
      source_sheet: row.source_sheet || '—',
      last_updated: row.updated_at,
      last_updated_label: formatDateTimeIST(row.updated_at),
    }))

    if (search) {
      allBrands = allBrands.filter((row: any) =>
        [row.brand_name, row.assigned_to, row.source_sheet]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search))
      )
    }

    return NextResponse.json({
      success: true,
      summary: {
        fromDate,
        toDate,
        yesterdayCount: filteredYesterday.length,
        totalBrandsTillDate: allBrands.length,
      },
      yesterdayBrands: filteredYesterday,
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

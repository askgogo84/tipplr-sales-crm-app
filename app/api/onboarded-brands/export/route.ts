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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') || 'range').trim()
    const from = (searchParams.get('from') || '').trim()
    const to = (searchParams.get('to') || '').trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const defaultYesterday = getDefaultYesterdayIST()
    const fromDate = from || defaultYesterday
    const toDate = to || defaultYesterday

    if (type === 'all') {
      const { data, error } = await supabase
        .from('restaurants')
        .select('restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted')
        .or('lead_status.ilike.Converted,converted.eq.true')
        .order('updated_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      const rows = (data || [])
        .filter(isConverted)
        .map((row: any) => ({
          brand_name: row.restaurant_name || '—',
          assigned_to: row.assigned_to_name || 'Unassigned',
          source_sheet: row.source_sheet || '—',
          last_updated: formatDateTimeIST(row.updated_at || row.synced_at),
        }))
        .filter((row: any) =>
          matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search)
        )

      const headers = ['Brand Name', 'Assigned To', 'Source Sheet', 'Last Updated']
      const lines = [
        headers.join(','),
        ...rows.map((row: any) =>
          [
            escapeCsv(row.brand_name),
            escapeCsv(row.assigned_to),
            escapeCsv(row.source_sheet),
            escapeCsv(row.last_updated),
          ].join(',')
        ),
      ]

      return new NextResponse('\uFEFF' + lines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="onboarded-brands-all.csv"',
        },
      })
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select('restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted')
      .or('lead_status.ilike.Converted,converted.eq.true')
      .gte('updated_at', startOfISTDayUtc(fromDate))
      .lte('updated_at', endOfISTDayUtc(toDate))
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const rows = (data || [])
      .filter(isConverted)
      .map((row: any) => ({
        brand_name: row.restaurant_name || '—',
        converted_at: formatDateTimeIST(row.updated_at || row.synced_at),
        changed_by: row.assigned_to_name || 'Sheet Sync',
        source_sheet: row.source_sheet || '—',
      }))
      .filter((row: any) =>
        matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search)
      )

    const headers = ['Brand Name', 'Converted At', 'Changed By', 'Source Sheet']
    const lines = [
      headers.join(','),
      ...rows.map((row: any) =>
        [
          escapeCsv(row.brand_name),
          escapeCsv(row.converted_at),
          escapeCsv(row.changed_by),
          escapeCsv(row.source_sheet),
        ].join(',')
      ),
    ]

    return new NextResponse('\uFEFF' + lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="onboarded-brands-range.csv"',
      },
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

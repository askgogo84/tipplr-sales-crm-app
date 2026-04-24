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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') || 'range').trim()
    const from = (searchParams.get('from') || '').trim()
    const to = (searchParams.get('to') || '').trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = formatDateOnly(yesterday)

    const fromDate = from || yesterdayStr
    const toDate = to || yesterdayStr

    if (type === 'all') {
      const { data, error } = await supabase
        .from('restaurants')
        .select('restaurant_name, assigned_to_name, source_sheet, updated_at, lead_status, converted')
        .or('lead_status.eq.Converted,converted.eq.true')
        .order('updated_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      let rows = (data || []).map((row: any) => ({
        brand_name: row.restaurant_name || '—',
        assigned_to: row.assigned_to_name || 'Unassigned',
        source_sheet: row.source_sheet || '—',
        last_updated: formatDateTimeIST(row.updated_at),
      }))

      if (search) {
        rows = rows.filter((row: any) =>
          [row.brand_name, row.assigned_to, row.source_sheet]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(search))
        )
      }

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

      const csv = '\uFEFF' + lines.join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="onboarded-brands-all.csv"',
        },
      })
    }

    const { data, error } = await supabase
      .from('restaurant_activity_log')
      .select('restaurant_name, source_sheet, changed_by, new_status, created_at')
      .eq('new_status', 'Converted')
      .gte('created_at', startOfDay(fromDate))
      .lte('created_at', endOfDay(toDate))
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    let rows = (data || []).map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      converted_at: formatDateTimeIST(row.created_at),
      changed_by: row.changed_by || 'System',
      source_sheet: row.source_sheet || '—',
    }))

    if (search) {
      rows = rows.filter((row: any) =>
        [row.brand_name, row.changed_by, row.source_sheet]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search))
      )
    }

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

    const csv = '\uFEFF' + lines.join('\n')

    return new NextResponse(csv, {
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

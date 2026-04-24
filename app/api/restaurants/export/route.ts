export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeStatus } from '@/lib/crm-metrics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function canonicalStatus(status: string | null | undefined, converted?: boolean | null) {
  return String(normalizeStatus(status || null, converted) || '')
    .trim()
    .toLowerCase()
}

async function fetchAllRestaurantsInBatches() {
  const batchSize = 1000
  let from = 0
  let allRows: any[] = []

  while (true) {
    const to = from + batchSize - 1

    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        restaurant_name,
        owner_name,
        phone,
        city,
        area,
        lead_status,
        assigned_to_name,
        follow_up_date,
        remarks,
        updated_at,
        converted,
        source_sheet,
        is_deactivated,
        priority,
        documents_received,
        reason,
        go_live_date
      `)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .range(from, to)

    if (error) {
      throw new Error(error.message)
    }

    const rows = data || []
    allRows = allRows.concat(rows)

    if (rows.length < batchSize) break
    from += batchSize
  }

  return allRows
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const status = (searchParams.get('status') || '').trim()
    const followUp = (searchParams.get('followUp') || '').trim()
    const assignedTo = (searchParams.get('assignedTo') || '').trim()
    const sourceSheet = (searchParams.get('sourceSheet') || '').trim()

    const today = new Date().toISOString().slice(0, 10)

    const rows = await fetchAllRestaurantsInBatches()

    let filtered = (rows || [])
      .filter((row: any) => row.source_sheet !== 'Deactivated Outlets')
      .map((row: any) => {
        const normalizedLeadStatus = normalizeStatus(row.lead_status, row.converted)
        return {
          ...row,
          lead_status: normalizedLeadStatus,
          _statusKey: canonicalStatus(row.lead_status, row.converted),
        }
      })

    if (search) {
      filtered = filtered.filter((row: any) =>
        [
          row.restaurant_name,
          row.owner_name,
          row.phone,
          row.assigned_to_name,
          row.city,
          row.area,
          row.source_sheet,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search))
      )
    }

    if (status) {
      const selectedStatusKey = status.trim().toLowerCase()
      filtered = filtered.filter((row: any) => row._statusKey === selectedStatusKey)
    }

    if (assignedTo) {
      filtered = filtered.filter((row: any) => row.assigned_to_name === assignedTo)
    }

    if (sourceSheet) {
      filtered = filtered.filter((row: any) => row.source_sheet === sourceSheet)
    }

    if (followUp === 'today') {
      filtered = filtered.filter((row: any) => row.follow_up_date === today)
    } else if (followUp === 'overdue') {
      filtered = filtered.filter((row: any) => row.follow_up_date && row.follow_up_date < today)
    } else if (followUp === 'upcoming') {
      filtered = filtered.filter((row: any) => row.follow_up_date && row.follow_up_date > today)
    }

    const headers = [
      'Restaurant Name',
      'Owner',
      'Phone',
      'City',
      'Area',
      'Status',
      'Assignee',
      'Follow Up Date',
      'Source Sheet',
      'Priority',
      'Converted',
      'Documents Received',
      'Go Live Date',
      'Reason',
      'Remarks',
      'Updated At',
    ]

    const lines = [
      headers.join(','),
      ...filtered.map((row: any) =>
        [
          escapeCsv(row.restaurant_name),
          escapeCsv(row.owner_name),
          escapeCsv(row.phone),
          escapeCsv(row.city),
          escapeCsv(row.area),
          escapeCsv(row.lead_status),
          escapeCsv(row.assigned_to_name),
          escapeCsv(row.follow_up_date),
          escapeCsv(row.source_sheet),
          escapeCsv(row.priority),
          escapeCsv(row.converted),
          escapeCsv(row.documents_received),
          escapeCsv(row.go_live_date),
          escapeCsv(row.reason),
          escapeCsv(row.remarks),
          escapeCsv(row.updated_at),
        ].join(',')
      ),
    ]

    const csv = '\uFEFF' + lines.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="restaurants-export.csv"',
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
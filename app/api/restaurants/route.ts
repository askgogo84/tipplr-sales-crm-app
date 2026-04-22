export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  fetchAllActiveRestaurants,
  buildCrmMetrics,
  normalizeStatus,
} from '@/lib/crm-metrics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function clean(value: unknown) {
  const s = String(value ?? '').trim()
  return s || null
}

function normalizeBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined || value === '') return null
  const v = String(value).trim().toLowerCase()
  if (['yes', 'y', 'true', '1'].includes(v)) return true
  if (['no', 'n', 'false', '0'].includes(v)) return false
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const page = Math.max(Number(searchParams.get('page') || '1'), 1)
    const pageSize = Math.max(Number(searchParams.get('pageSize') || '100'), 1)
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const status = (searchParams.get('status') || '').trim()
    const followUp = (searchParams.get('followUp') || '').trim()
    const assignedTo = (searchParams.get('assignedTo') || '').trim()
    const sourceSheet = (searchParams.get('sourceSheet') || '').trim()

    const today = new Date().toISOString().slice(0, 10)

    const allRows = await fetchAllActiveRestaurants(
      supabase,
      'id, restaurant_name, owner_name, phone, city, area, lead_status, assigned_to_name, follow_up_date, follow_up_status, last_follow_up_note, remarks, updated_at, converted, source_sheet, is_deactivated, priority, documents_received, reason, go_live_date'
    )

    const stats = buildCrmMetrics(allRows)

    let filtered = allRows.map((row: any) => ({
      ...row,
      lead_status: normalizeStatus(row.lead_status, row.converted),
    }))

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
      filtered = filtered.filter((row: any) => row.lead_status === status)
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

    filtered.sort((a: any, b: any) => {
      const aa = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const bb = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return bb - aa
    })

    const total = filtered.length
    const from = (page - 1) * pageSize
    const to = from + pageSize
    const paged = filtered.slice(from, to)

    const sourceSheets = Array.from(
      new Set(
        allRows
          .map((row: any) => row.source_sheet)
          .filter(Boolean)
      )
    ).sort()

    return NextResponse.json({
      success: true,
      data: paged,
      stats: {
        total: stats.total,
        convertedTillDate: stats.convertedTillDate,
        agreedTillDate: stats.agreedTillDate,
        closuresTillDate: stats.closuresTillDate,
        unassigned: stats.unassigned,
      },
      filters: {
        sourceSheets,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown server error'

    return NextResponse.json(
      { success: false, error: message, data: [] },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const restaurant_name = clean(body.restaurant_name)
    const owner_name = clean(body.owner_name)
    const phone = clean(body.phone)
    const email = clean(body.email)
    const area = clean(body.area)
    const city = clean(body.city) || 'Bengaluru'
    const address = clean(body.address)
    const category = clean(body.category)
    const lead_status = clean(body.lead_status) || 'Lead'
    const assigned_to_name = clean(body.assigned_to_name)
    const priority = clean(body.priority)
    const follow_up_date = clean(body.follow_up_date)
    const remarks = clean(body.remarks)
    const converted = normalizeBoolean(body.converted)
    const documents_received = normalizeBoolean(body.documents_received)

    if (!restaurant_name) {
      return NextResponse.json(
        { success: false, error: 'Restaurant name is required' },
        { status: 400 }
      )
    }

    const payload = {
      restaurant_name,
      owner_name,
      phone,
      email,
      area,
      city,
      address,
      category,
      lead_status,
      assigned_to_name,
      priority,
      follow_up_date,
      remarks,
      converted,
      documents_received,
    }

    const { data, error } = await supabase
      .from('restaurants')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const search = (searchParams.get('search') || '').trim()
    const status = (searchParams.get('status') || '').trim()
    const assignedTo = (searchParams.get('assignedTo') || '').trim()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('restaurants')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(
        [
          `restaurant_name.ilike.%${search}%`,
          `owner_name.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
          `assigned_to_name.ilike.%${search}%`,
          `city.ilike.%${search}%`,
          `area.ilike.%${search}%`,
        ].join(',')
      )
    }

    if (status) {
      query = query.eq('lead_status', status)
    }

    if (assignedTo) {
      query = query.eq('assigned_to_name', assignedTo)
    }

    query = query
      .order('source_row_number', { ascending: true, nullsFirst: false })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .range(from, to)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, data: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.max(Math.ceil((count || 0) / pageSize), 1),
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
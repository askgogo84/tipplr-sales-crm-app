import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const page = Math.max(Number(searchParams.get('page') || '1'), 1)
    const pageSize = Math.max(Number(searchParams.get('pageSize') || '30'), 1)
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
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(from, to)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
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
      { success: false, error: message },
      { status: 500 }
    )
  }
}
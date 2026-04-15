import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const assignedTo = url.searchParams.get('assignedTo') || ''

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('restaurants')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`restaurant_name.ilike.%${search}%,owner_name.ilike.%${search}%,phone.ilike.%${search}%,assigned_to_name.ilike.%${search}%`)
    }
    if (status) query = query.eq('lead_status', status)
    if (assignedTo) query = query.ilike('assigned_to_name', `%${assignedTo}%`)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (error: any) {
    console.error('Restaurants API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
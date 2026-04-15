import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const page = Math.max(Number(searchParams.get('page') || '1'), 1)
    const pageSize = Math.max(Number(searchParams.get('pageSize') || '30'), 1)
    const search = (searchParams.get('search') || '').trim()
    const status = (searchParams.get('status') || '').trim()
    const assignedTo = (searchParams.get('assignedTo') || '').trim()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let query = supabase
      .from('restaurants')
      .select(
        `
        id,
        restaurant_name,
        brand_name,
        owner_name,
        phone,
        alternate_phone,
        email,
        area,
        zone,
        city,
        address,
        restaurant_type,
        category,
        source,
        lead_status,
        assigned_to,
        assigned_to_name,
        follow_up_date,
        last_contacted_at,
        onboarded_date,
        commission_percent,
        discount_offer,
        fssai_number,
        menu_status,
        contract_status,
        kyc_status,
        listing_status,
        priority,
        remarks,
        created_at,
        updated_at,
        converted,
        documents_received,
        go_live_date,
        menu_pricing,
        reason,
        source_row_number
      `,
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false, nullsFirst: false })

    if (status) {
      query = query.eq('lead_status', status)
    }

    if (assignedTo) {
      query = query.eq('assigned_to_name', assignedTo)
    }

    if (search) {
      query = query.or(
        [
          `restaurant_name.ilike.%${search}%`,
          `owner_name.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `area.ilike.%${search}%`,
          `city.ilike.%${search}%`,
          `assigned_to_name.ilike.%${search}%`,
        ].join(',')
      )
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    const total = count || 0
    const totalPages = Math.max(Math.ceil(total / pageSize), 1)

    return Response.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected server error',
      },
      { status: 500 }
    )
  }
}
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeStatus } from '@/lib/crm-metrics'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

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

function canonicalStatus(status: string | null | undefined, converted?: boolean | null) {
  return String(normalizeStatus(status || null, converted) || '')
    .trim()
    .toLowerCase()
}

async function fetchAllRestaurantsInBatches(supabase: any) {
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
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)

    const page = Math.max(Number(searchParams.get('page') || '1'), 1)
    const pageSize = Math.max(Number(searchParams.get('pageSize') || '100'), 1)
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const status = (searchParams.get('status') || '').trim()
    const followUp = (searchParams.get('followUp') || '').trim()
    const assignedTo = (searchParams.get('assignedTo') || '').trim()
    const sourceSheet = (searchParams.get('sourceSheet') || '').trim()

    const today = new Date().toISOString().slice(0, 10)

    const rows = await fetchAllRestaurantsInBatches(supabase)

    const allRows = (rows || [])
      .filter((row: any) => row.source_sheet !== 'Deactivated Outlets')
      .map((row: any) => {
        const normalizedLeadStatus = normalizeStatus(row.lead_status, row.converted)
        return {
          ...row,
          lead_status: normalizedLeadStatus,
          _statusKey: canonicalStatus(row.lead_status, row.converted),
        }
      })

    const sourceSheets = Array.from(
      new Set(
        allRows
          .map((row: any) => row.source_sheet)
          .filter(Boolean)
      )
    ).sort()

    let filtered = [...allRows]

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

    const statsBase = filtered

    const stats = {
      total: statsBase.length,
      convertedTillDate: statsBase.filter((row: any) => row._statusKey === 'converted').length,
      agreedTillDate: statsBase.filter((row: any) => row._statusKey === 'agreed').length,
      closuresTillDate: statsBase.filter((row: any) =>
        ['agreed', 'converted'].includes(row._statusKey)
      ).length,
      unassigned: statsBase.filter((row: any) => !row.assigned_to_name).length,
    }

    const total = filtered.length
    const from = (page - 1) * pageSize
    const to = from + pageSize
    const paged = filtered.slice(from, to).map(({ _statusKey, ...row }: any) => row)

    return NextResponse.json({
      success: true,
      data: paged,
      stats,
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
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { success: false, error: message, data: [] },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const full_name = String(body.full_name || '').trim()
    const email = body.email ? String(body.email).trim() : null
    const role = body.role ? String(body.role).trim() : 'Sales'

    if (!full_name) {
      return NextResponse.json(
        { success: false, error: 'Full name is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('team_members')
      .insert({
        full_name,
        email,
        role,
      })
      .select('id, full_name, email, role')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member: data,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to add team member' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('team_members')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, members: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      members: data || [],
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team members', members: [] },
      { status: 500 }
    )
  }
}
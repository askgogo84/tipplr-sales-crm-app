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
      .select('id, full_name')
      .order('full_name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message, executives: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({
      executives: data || [],
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch executives', executives: [] },
      { status: 500 }
    )
  }
}
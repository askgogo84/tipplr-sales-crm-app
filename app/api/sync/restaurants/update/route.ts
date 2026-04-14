import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, lead_status, assigned_to_name } = body as {
      id: number | string
      lead_status?: string
      assigned_to_name?: string
    }

    if (!id) {
      return Response.json({ success: false, error: 'Missing restaurant id' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updatePayload: Record<string, string> = {}

    if (typeof lead_status === 'string') {
      updatePayload.lead_status = lead_status
    }

    if (typeof assigned_to_name === 'string') {
      updatePayload.assigned_to_name = assigned_to_name
    }

    const { error } = await supabase
      .from('restaurants')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
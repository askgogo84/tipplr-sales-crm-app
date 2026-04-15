import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    const updatePayload = {
      restaurant_name: body.restaurant_name ?? existing.restaurant_name,
      owner_name: body.owner_name ?? null,
      phone: body.phone ?? null,
      city: body.city ?? null,
      area: body.area ?? null,
      lead_status: body.lead_status ?? null,
      assigned_to_name: body.assigned_to_name ?? null,
      remarks: body.remarks ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error: updateError } = await supabase
      .from('restaurants')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    const fieldsToTrack = [
      'restaurant_name',
      'owner_name',
      'phone',
      'city',
      'area',
      'lead_status',
      'assigned_to_name',
      'remarks',
    ]

    const activityRows = fieldsToTrack
      .filter((field) => (existing[field] ?? null) !== (updated[field] ?? null))
      .map((field) => ({
        restaurant_id: id,
        action_type: 'updated',
        field_name: field,
        old_value: existing[field] ? String(existing[field]) : null,
        new_value: updated[field] ? String(updated[field]) : null,
        actor_name: 'System',
        created_at: new Date().toISOString(),
      }))

    if (activityRows.length > 0) {
      await supabase.from('restaurant_activity').insert(activityRows)
    }

    return NextResponse.json({
      success: true,
      restaurant: updated,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    )
  }
}
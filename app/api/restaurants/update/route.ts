export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizeStatus(status: string | null, converted?: boolean | null): string {
  const s = (status || "").trim().toLowerCase()

  if (converted === true) return "Converted"
  if (["converted", "already live", "live"].includes(s)) return "Converted"
  if (["agreed", "agreement done"].includes(s)) return "Agreed"
  if (["followup", "follow up"].includes(s)) return "Followup"
  if (["call back", "callback", "called back"].includes(s)) return "Call Back"
  if (["couldn't connect", "couldnt connect", "not reachable"].includes(s)) return "Couldn't Connect"
  if (["not interested", "not live", "rejected"].includes(s)) return "Not Interested"
  if (["wrong number", "incorrect number", "invalid number"].includes(s)) return "Wrong Number"
  if (["lead", "new"].includes(s)) return "Lead"
  if (["visit", "visited"].includes(s)) return "Visit"
  return status || "Lead"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body || {}

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing restaurant id" },
        { status: 400 }
      )
    }

    const { data: current, error: currentError } = await supabase
      .from("restaurants")
      .select("id, restaurant_name, source_sheet, lead_status, assigned_to_name, converted")
      .eq("id", id)
      .single()

    if (currentError || !current) {
      return NextResponse.json(
        { success: false, error: currentError?.message || "Restaurant not found" },
        { status: 404 }
      )
    }

    const oldStatus = normalizeStatus(current.lead_status, current.converted)

    const nextLeadStatus =
      updates.lead_status !== undefined ? updates.lead_status : current.lead_status

    const nextConverted =
      updates.converted !== undefined ? updates.converted : current.converted

    const newStatus = normalizeStatus(nextLeadStatus, nextConverted)

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data: saved, error: saveError } = await supabase
      .from("restaurants")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single()

    if (saveError) {
      return NextResponse.json(
        { success: false, error: saveError.message },
        { status: 500 }
      )
    }

    const assigneeChanged =
      updates.assigned_to_name !== undefined &&
      updates.assigned_to_name !== current.assigned_to_name

    const statusChanged = oldStatus !== newStatus

    if (statusChanged || assigneeChanged) {
      await supabase.from("restaurant_activity_log").insert({
        restaurant_id: current.id,
        restaurant_name: current.restaurant_name,
        source_sheet: current.source_sheet,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by:
          updates.assigned_to_name ||
          current.assigned_to_name ||
          "System",
        note: statusChanged
          ? `Status changed from ${oldStatus} to ${newStatus}`
          : "Assignment updated",
      })
    }

    return NextResponse.json({
      success: true,
      data: saved,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

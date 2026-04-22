export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function normalizeBrandName(name: string | null | undefined) {
  return (name || "").trim().replace(/\s+/g, " ")
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const yesterdayStart = new Date()
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    yesterdayStart.setHours(0, 0, 0, 0)

    const yesterdayEnd = new Date(yesterdayStart)
    yesterdayEnd.setHours(23, 59, 59, 999)

    const yesterdayStartIso = yesterdayStart.toISOString()
    const yesterdayEndIso = yesterdayEnd.toISOString()

    const { data: yesterdayActivity, error: yesterdayError } = await supabase
      .from("restaurant_activity_log")
      .select("restaurant_name, changed_at, changed_by, source_sheet, new_status")
      .gte("changed_at", yesterdayStartIso)
      .lte("changed_at", yesterdayEndIso)
      .eq("new_status", "Converted")
      .order("changed_at", { ascending: false })

    if (yesterdayError) {
      return NextResponse.json({ success: false, error: yesterdayError.message }, { status: 500 })
    }

    const { data: convertedRows, error: convertedError } = await supabase
      .from("restaurants")
      .select("restaurant_name, source_sheet, assigned_to_name, updated_at, lead_status, converted")
      .not("source_sheet", "is", null)
      .neq("source_sheet", "Deactivated Outlets")
      .or("lead_status.eq.Converted,converted.eq.true")
      .order("restaurant_name", { ascending: true })

    if (convertedError) {
      return NextResponse.json({ success: false, error: convertedError.message }, { status: 500 })
    }

    const yesterdayMap = new Map<string, any>()
    for (const row of yesterdayActivity || []) {
      const brand = normalizeBrandName(row.restaurant_name)
      if (!brand) continue
      if (!yesterdayMap.has(brand)) {
        yesterdayMap.set(brand, {
          brand_name: brand,
          converted_at: row.changed_at,
          changed_by: row.changed_by || "—",
          source_sheet: row.source_sheet || "—",
        })
      }
    }

    const allMap = new Map<string, any>()
    for (const row of convertedRows || []) {
      const brand = normalizeBrandName(row.restaurant_name)
      if (!brand) continue
      if (!allMap.has(brand)) {
        allMap.set(brand, {
          brand_name: brand,
          source_sheet: row.source_sheet || "—",
          assigned_to_name: row.assigned_to_name || "—",
          updated_at: row.updated_at || null,
        })
      }
    }

    return NextResponse.json({
      success: true,
      yesterdayCount: yesterdayMap.size,
      totalConvertedBrands: allMap.size,
      yesterdayBrands: Array.from(yesterdayMap.values()),
      allBrands: Array.from(allMap.values()),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message, rows: [] }, { status: 500 })
  }
}

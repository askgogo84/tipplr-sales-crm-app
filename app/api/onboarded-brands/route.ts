export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { manualYesterdayBrands } from "@/lib/manual-yesterday-brands"

function normalizeBrandName(name: string | null | undefined) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase()
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: convertedRows, error: convertedError } = await supabase
      .from("restaurants")
      .select("restaurant_name, source_sheet, assigned_to_name, updated_at, lead_status, converted")
      .not("source_sheet", "is", null)
      .neq("source_sheet", "Deactivated Outlets")
      .or("lead_status.eq.Converted,converted.eq.true")
      .order("restaurant_name", { ascending: true })

    if (convertedError) {
      return NextResponse.json(
        { success: false, error: convertedError.message },
        { status: 500 }
      )
    }

    const convertedMap = new Map<string, any>()
    for (const row of convertedRows || []) {
      const normalized = normalizeBrandName(row.restaurant_name)
      if (!normalized) continue

      if (!convertedMap.has(normalized)) {
        convertedMap.set(normalized, {
          brand_name: row.restaurant_name || "-",
          source_sheet: row.source_sheet || "-",
          assigned_to_name: row.assigned_to_name || "-",
          updated_at: row.updated_at || null,
        })
      }
    }

    const yesterdayBrands = manualYesterdayBrands.map((brand) => {
      const match = convertedMap.get(normalizeBrandName(brand))
      return {
        brand_name: brand,
        converted_at: match?.updated_at || null,
        changed_by: match?.assigned_to_name || "-",
        source_sheet: match?.source_sheet || "-",
      }
    })

    const allBrands = Array.from(convertedMap.values())

    return NextResponse.json({
      success: true,
      yesterdayCount: yesterdayBrands.length,
      totalConvertedBrands: allBrands.length,
      yesterdayBrands,
      allBrands,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message, rows: [] },
      { status: 500 }
    )
  }
}

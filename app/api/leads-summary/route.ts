export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAllActiveRestaurants } from '@/lib/crm-metrics'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const rows = await fetchAllActiveRestaurants(supabase)

    const map = new Map<string, any>()

    for (const row of rows) {
      const key = row.source_sheet || 'Unknown'
      if (!map.has(key)) {
        map.set(key, {
          source_sheet: key,
          total: 0,
          converted: 0,
          agreed: 0,
          lead: 0,
          followup: 0,
          callback: 0,
          notInterested: 0,
          couldntConnect: 0,
          unassigned: 0,
        })
      }

      const item = map.get(key)
      item.total++

      if (!row.assigned_to_name || !row.assigned_to_name.trim()) item.unassigned++

      switch ((row as any).normalized_status) {
        case 'converted':
          item.converted++
          break
        case 'agreed':
          item.agreed++
          break
        case 'lead':
          item.lead++
          break
        case 'followup':
          item.followup++
          break
        case 'call back':
          item.callback++
          break
        case 'not interested':
          item.notInterested++
          break
        case "couldn't connect":
          item.couldntConnect++
          break
      }
    }

    return NextResponse.json({
      success: true,
      rows: Array.from(map.values()),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message, rows: [] }, { status: 500 })
  }
}
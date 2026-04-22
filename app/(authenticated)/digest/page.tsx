export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import DigestClient from './DigestClient'

export default async function DigestPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()

  const { data: activities, error } = await supabase
    .from('restaurant_activity_log')
    .select('restaurant_id, restaurant_name, source_sheet, old_status, new_status, changed_by, changed_at')
    .gte('changed_at', todayStartIso)
    .order('changed_at', { ascending: false })

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load digest data.
      </div>
    )
  }

  const rows = activities || []

  const repMap = new Map<string, { updated: number; closed: number }>()
  for (const row of rows) {
    const name = (row.changed_by || 'Unassigned').trim()
    if (!repMap.has(name)) repMap.set(name, { updated: 0, closed: 0 })
    const item = repMap.get(name)!
    item.updated++
    if (['Agreed', 'Converted'].includes(row.new_status || '')) {
      item.closed++
    }
  }

  const execStats = Array.from(repMap.entries())
    .map(([name, s]) => ({
      name,
      total: s.updated,
      updated: s.updated,
      closed: s.closed,
      followupToday: 0,
      overdue: 0,
    }))
    .sort((a, b) => b.updated - a.updated)

  const totalUpdatedToday = rows.length
  const totalClosed = rows.filter((x) =>
    ['Agreed', 'Converted'].includes(x.new_status || '')
  ).length

  const totalLeads = rows.length
  const conversionRate =
    totalUpdatedToday > 0 ? ((totalClosed / totalUpdatedToday) * 100).toFixed(1) : '0'

  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <DigestClient
      execStats={execStats}
      totalUpdatedToday={totalUpdatedToday}
      totalClosed={totalClosed}
      totalFollowupToday={0}
      totalOverdue={0}
      totalLeads={totalLeads}
      conversionRate={conversionRate}
      dateLabel={dateLabel}
    />
  )
}
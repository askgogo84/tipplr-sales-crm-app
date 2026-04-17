import { createClient } from '@supabase/supabase-js'
import DigestClient from './DigestClient'

export default async function DigestPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()
  const today = now.toISOString().slice(0, 10)

  const { data: leads } = await supabase
    .from('restaurants')
    .select('id, lead_status, assigned_to_name, updated_at, follow_up_date, converted')
    .range(0, 9999)

  const all = leads || []

  // Per exec stats
  const execMap = new Map<string, {
    total: number; updated: number; closed: number
    followupToday: number; overdue: number
  }>()

  all.forEach(x => {
    if (!x.assigned_to_name) return
    const name = x.assigned_to_name
    if (!execMap.has(name)) {
      execMap.set(name, { total: 0, updated: 0, closed: 0, followupToday: 0, overdue: 0 })
    }
    const s = execMap.get(name)!
    s.total++

    const status = (x.lead_status || '').toLowerCase()
    if (status === 'agreed' || status === 'converted' || x.converted) s.closed++
    if (x.updated_at && x.updated_at >= todayStartIso) s.updated++
    if (x.follow_up_date === today) s.followupToday++
    if (x.follow_up_date && x.follow_up_date < today) s.overdue++
  })

  const execStats = Array.from(execMap.entries())
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.updated - a.updated)

  // Overall stats
  const totalUpdatedToday = all.filter(x => x.updated_at && x.updated_at >= todayStartIso).length
  const totalClosed = all.filter(x => {
    const s = (x.lead_status || '').toLowerCase()
    return s === 'agreed' || s === 'converted' || x.converted
  }).length
  const totalFollowupToday = all.filter(x => x.follow_up_date === today).length
  const totalOverdue = all.filter(x => x.follow_up_date && x.follow_up_date < today).length
  const totalLeads = all.length

  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const conversionRate = totalLeads > 0
    ? ((totalClosed / totalLeads) * 100).toFixed(1)
    : '0'

  return (
    <DigestClient
      execStats={execStats}
      totalUpdatedToday={totalUpdatedToday}
      totalClosed={totalClosed}
      totalFollowupToday={totalFollowupToday}
      totalOverdue={totalOverdue}
      totalLeads={totalLeads}
      conversionRate={conversionRate}
      dateLabel={dateLabel}
    />
  )
}

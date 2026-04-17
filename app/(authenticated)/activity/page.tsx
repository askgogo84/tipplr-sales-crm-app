import { createClient } from '@supabase/supabase-js'
import ReportsClient from './ReportsClient'

type LeadRow = {
  id: string
  restaurant_name: string | null
  lead_status: string | null
  assigned_to_name: string | null
  updated_at: string | null
  follow_up_date: string | null
  converted: boolean | null
}

export default async function ReportsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  const weekStartIso = weekStart.toISOString()

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const activeStatuses = ['lead', 'followup', 'call back', 'visit', "couldn't connect"]

  // Fetch all leads
  const { data: allLeads } = await supabase
    .from('restaurants')
    .select('id, restaurant_name, lead_status, assigned_to_name, updated_at, follow_up_date, converted')
    .range(0, 9999)

  const leads = (allLeads || []) as LeadRow[]

  // ─── TODAY'S SUMMARY ───
  const execTodayMap = new Map<string, { updated: number; closed: number; followupsSet: number }>()

  leads.forEach((x) => {
    if (!x.assigned_to_name) return
    const name = x.assigned_to_name
    if (!execTodayMap.has(name)) {
      execTodayMap.set(name, { updated: 0, closed: 0, followupsSet: 0 })
    }
    const stats = execTodayMap.get(name)!

    if (x.updated_at && x.updated_at >= todayStartIso) {
      stats.updated++
      const s = (x.lead_status || '').toLowerCase()
      if (s === 'agreed' || s === 'converted' || x.converted) stats.closed++
    }

    if (x.follow_up_date === now.toISOString().slice(0, 10)) {
      stats.followupsSet++
    }
  })

  const todaySummary = Array.from(execTodayMap.entries())
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.updated - a.updated)

  // ─── THIS WEEK PER EXEC ───
  const execWeekMap = new Map<string, { total: number; closed: number; updated: number }>()

  leads.forEach((x) => {
    if (!x.assigned_to_name) return
    const name = x.assigned_to_name
    if (!execWeekMap.has(name)) {
      execWeekMap.set(name, { total: 0, closed: 0, updated: 0 })
    }
    const stats = execWeekMap.get(name)!
    stats.total++

    const s = (x.lead_status || '').toLowerCase()
    if (s === 'agreed' || s === 'converted' || x.converted) stats.closed++
    if (x.updated_at && x.updated_at >= weekStartIso) stats.updated++
  })

  const weekStats = Array.from(execWeekMap.entries())
    .map(([name, s]) => ({
      name,
      total: s.total,
      closed: s.closed,
      updated: s.updated,
      rate: s.total > 0 ? ((s.closed / s.total) * 100).toFixed(1) : '0',
    }))
    .filter(e => e.total > 0)
    .sort((a, b) => b.closed - a.closed)

  // ─── CONVERSION FUNNEL ───
  const total = leads.length
  const statusCounts = {
    lead: leads.filter(x => (x.lead_status || '').toLowerCase() === 'lead').length,
    followup: leads.filter(x => (x.lead_status || '').toLowerCase() === 'followup').length,
    callBack: leads.filter(x => (x.lead_status || '').toLowerCase() === 'call back').length,
    agreed: leads.filter(x => (x.lead_status || '').toLowerCase() === 'agreed').length,
    converted: leads.filter(x => (x.lead_status || '').toLowerCase() === 'converted').length,
    notInterested: leads.filter(x => (x.lead_status || '').toLowerCase() === 'not interested').length,
    couldntConnect: leads.filter(x => (x.lead_status || '').toLowerCase() === "couldn't connect").length,
    incorrectNumber: leads.filter(x =>
      ['incorrect number', 'wrong number', 'invalid number'].includes((x.lead_status || '').toLowerCase())
    ).length,
  }

  // ─── STALE LEADS ───
  const staleLeads = leads
    .filter(x => {
      const s = (x.lead_status || '').toLowerCase()
      if (!activeStatuses.includes(s)) return false
      if (!x.updated_at) return true
      return x.updated_at < sevenDaysAgo
    })
    .sort((a, b) => {
      if (!a.updated_at) return -1
      if (!b.updated_at) return 1
      return a.updated_at.localeCompare(b.updated_at)
    })
    .slice(0, 50)
    .map(x => ({
      id: x.id,
      restaurant_name: x.restaurant_name,
      lead_status: x.lead_status,
      assigned_to_name: x.assigned_to_name,
      updated_at: x.updated_at,
      daysSince: x.updated_at
        ? Math.floor((now.getTime() - new Date(x.updated_at).getTime()) / 86400000)
        : 999,
    }))

  const dateLabel = now.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <ReportsClient
      todaySummary={todaySummary}
      weekStats={weekStats}
      statusCounts={statusCounts}
      total={total}
      staleLeads={staleLeads}
      dateLabel={dateLabel}
    />
  )
}

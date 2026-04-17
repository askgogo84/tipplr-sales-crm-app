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
  const weekStartIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const activeStatuses = ['lead', 'followup', 'call back', 'visit', "couldn't connect"]

  const [{ data: allLeads }, { data: execData }] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id, restaurant_name, lead_status, assigned_to_name, updated_at, follow_up_date, converted')
      .range(0, 9999),
    supabase
      .from('executives')
      .select('id, full_name')
      .order('full_name', { ascending: true }),
  ])

  const leads = (allLeads || []) as LeadRow[]
  const executives = (execData || []) as { id: string; full_name: string }[]

  // ─── TODAY'S SUMMARY ───
  const execTodayMap = new Map<string, { updated: number; closed: number; followupsSet: number }>()
  const today = now.toISOString().slice(0, 10)

  leads.forEach((x) => {
    if (!x.assigned_to_name) return
    const name = x.assigned_to_name
    if (!execTodayMap.has(name)) execTodayMap.set(name, { updated: 0, closed: 0, followupsSet: 0 })
    const stats = execTodayMap.get(name)!
    if (x.updated_at && x.updated_at >= todayStartIso) {
      stats.updated++
      const s = (x.lead_status || '').toLowerCase()
      if (s === 'agreed' || s === 'converted' || x.converted) stats.closed++
    }
    if (x.follow_up_date === today) stats.followupsSet++
  })

  const todaySummary = Array.from(execTodayMap.entries())
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.updated - a.updated)

  // ─── WEEK STATS ───
  const execWeekMap = new Map<string, { total: number; closed: number; updated: number }>()
  leads.forEach((x) => {
    if (!x.assigned_to_name) return
    const name = x.assigned_to_name
    if (!execWeekMap.has(name)) execWeekMap.set(name, { total: 0, closed: 0, updated: 0 })
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

  // ─── STATUS COUNTS ───
  const count = (fn: (s: string) => boolean) =>
    leads.filter(x => fn((x.lead_status || '').toLowerCase())).length

  const statusCounts = {
    lead: count(s => s === 'lead'),
    followup: count(s => s === 'followup'),
    callBack: count(s => s === 'call back'),
    agreed: count(s => s === 'agreed'),
    converted: count(s => s === 'converted'),
    notInterested: count(s => s === 'not interested'),
    couldntConnect: count(s => s === "couldn't connect"),
    incorrectNumber: count(s => ['incorrect number', 'wrong number', 'invalid number'].includes(s)),
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
      total={leads.length}
      staleLeads={staleLeads}
      dateLabel={dateLabel}
      executives={executives}
    />
  )
}

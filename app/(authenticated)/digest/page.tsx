export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import DigestClient from './DigestClient'

function normalizeStatus(status: string | null, converted: boolean | null): string {
  const s = (status || '').trim().toLowerCase()

  if (converted === true) return 'converted'
  if (['converted', 'already live', 'live'].includes(s)) return 'converted'
  if (['agreed', 'agreement done'].includes(s)) return 'agreed'
  if (['followup', 'follow up'].includes(s)) return 'followup'
  if (['call back', 'callback', 'called back'].includes(s)) return 'call back'
  if (["couldn't connect", 'couldnt connect', 'not reachable'].includes(s)) return "couldn't connect"
  if (['not interested', 'not live', 'rejected'].includes(s)) return 'not interested'
  if (['lead', 'new'].includes(s)) return 'lead'
  if (['visit', 'visited'].includes(s)) return 'visit'
  return s || 'lead'
}

type LeadRow = {
  id: string
  lead_status: string | null
  assigned_to_name: string | null
  updated_at: string | null
  follow_up_date: string | null
  converted: boolean | null
  source_sheet: string | null
  is_deactivated: boolean | null
}

export default async function DigestPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()
  const today = now.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'id, lead_status, assigned_to_name, updated_at, follow_up_date, converted, source_sheet, is_deactivated'
    )
    .not('source_sheet', 'is', null)
    .neq('source_sheet', 'Deactivated Outlets')
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load digest data.
      </div>
    )
  }

  const all = ((data || []) as LeadRow[]).map((x) => ({
    ...x,
    normalized_status: normalizeStatus(x.lead_status, x.converted),
  }))

  const execMap = new Map<
    string,
    {
      total: number
      updated: number
      closed: number
      followupToday: number
      overdue: number
    }
  >()

  all.forEach((x) => {
    if (!x.assigned_to_name) return
    const name = x.assigned_to_name.trim()
    if (!name) return

    if (!execMap.has(name)) {
      execMap.set(name, {
        total: 0,
        updated: 0,
        closed: 0,
        followupToday: 0,
        overdue: 0,
      })
    }

    const s = execMap.get(name)!
    s.total++

    if (['agreed', 'converted'].includes(x.normalized_status)) s.closed++
    if (x.updated_at && x.updated_at >= todayStartIso) s.updated++
    if (x.follow_up_date === today) s.followupToday++
    if (x.follow_up_date && x.follow_up_date < today) s.overdue++
  })

  const execStats = Array.from(execMap.entries())
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.updated - a.updated)

  const totalUpdatedToday = all.filter(
    (x) => x.updated_at && x.updated_at >= todayStartIso
  ).length

  const totalClosed = all.filter((x) =>
    ['agreed', 'converted'].includes(x.normalized_status)
  ).length

  const totalFollowupToday = all.filter((x) => x.follow_up_date === today).length
  const totalOverdue = all.filter(
    (x) => x.follow_up_date && x.follow_up_date < today
  ).length
  const totalLeads = all.length

  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const conversionRate =
    totalLeads > 0 ? ((totalClosed / totalLeads) * 100).toFixed(1) : '0'

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
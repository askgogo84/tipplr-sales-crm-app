import type { SupabaseClient } from '@supabase/supabase-js'

export type CrmRow = {
  id?: string
  restaurant_name?: string | null
  owner_name?: string | null
  phone?: string | null
  city?: string | null
  area?: string | null
  lead_status: string | null
  assigned_to_name: string | null
  updated_at: string | null
  synced_at?: string | null
  follow_up_date: string | null
  converted: boolean | null
  source_sheet: string | null
  is_deactivated: boolean | null
}

export function normalizeStatus(
  status: string | null,
  converted: boolean | null
): string {
  const s = (status || '').trim().toLowerCase()

  if (converted === true) return 'converted'
  if (['converted', 'already live', 'live'].includes(s)) return 'converted'
  if (['agreed', 'agreement done'].includes(s)) return 'agreed'
  if (['followup', 'follow up'].includes(s)) return 'followup'
  if (['call back', 'callback', 'called back'].includes(s)) return 'call back'
  if (["couldn't connect", 'couldnt connect', 'not reachable'].includes(s)) return "couldn't connect"
  if (['not interested', 'not live', 'rejected'].includes(s)) return 'not interested'
  if (['wrong number', 'incorrect number', 'invalid number'].includes(s)) return 'wrong number'
  if (['lead', 'new'].includes(s)) return 'lead'
  if (['visit', 'visited'].includes(s)) return 'visit'

  return s || 'lead'
}

export async function fetchAllActiveRestaurants(
  supabase: SupabaseClient,
  fields = 'id, restaurant_name, owner_name, phone, city, area, lead_status, assigned_to_name, updated_at, synced_at, follow_up_date, converted, source_sheet, is_deactivated'
) {
  const pageSize = 1000
  let from = 0
  const all: CrmRow[] = []

  while (true) {
    const to = from + pageSize - 1

    const { data, error } = await supabase
      .from('restaurants')
      .select(fields)
      .not('source_sheet', 'is', null)
      .neq('source_sheet', 'Deactivated Outlets')
      .range(from, to)

    if (error) throw error

    const batch = (data || []) as CrmRow[]
    all.push(...batch)

    if (batch.length < pageSize) break
    from += pageSize
  }

  return all
    .filter((x) => x.source_sheet !== 'Deactivated Outlets' && x.is_deactivated !== true)
    .map((x) => ({
      ...x,
      normalized_status: normalizeStatus(x.lead_status, x.converted),
    }))
}

export function buildCrmMetrics(
  rows: Array<CrmRow & { normalized_status: string }>
) {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const total = rows.length
  const convertedTillDate = rows.filter((x) => x.normalized_status === 'converted').length
  const agreedTillDate = rows.filter((x) => x.normalized_status === 'agreed').length
  const closuresTillDate = rows.filter((x) =>
    ['agreed', 'converted'].includes(x.normalized_status)
  ).length
  const dueToday = rows.filter((x) => x.follow_up_date === today).length
  const overdue = rows.filter((x) => x.follow_up_date && x.follow_up_date < today).length
  const unassigned = rows.filter((x) => !x.assigned_to_name || !x.assigned_to_name.trim()).length

  const activeStatuses = ['lead', 'followup', 'call back', 'visit', "couldn't connect"]
  const stale = rows.filter((x) => {
    if (!activeStatuses.includes(x.normalized_status)) return false
    if (!x.updated_at) return false
    return x.updated_at < sevenDaysAgo
  }).length

  const pipeline = {
    lead: rows.filter((x) => x.normalized_status === 'lead').length,
    followup: rows.filter((x) => x.normalized_status === 'followup').length,
    callBack: rows.filter((x) => x.normalized_status === 'call back').length,
    agreed: rows.filter((x) => x.normalized_status === 'agreed').length,
    converted: rows.filter((x) => x.normalized_status === 'converted').length,
    notInterested: rows.filter((x) => x.normalized_status === 'not interested').length,
    couldntConnect: rows.filter((x) => x.normalized_status === "couldn't connect").length,
    wrongNumber: rows.filter((x) => x.normalized_status === 'wrong number').length,
    visit: rows.filter((x) => x.normalized_status === 'visit').length,
  }

  const teamMap = new Map<string, { total: number; closed: number }>()
  rows.forEach((x) => {
    const name = x.assigned_to_name?.trim()
    if (!name) return

    if (!teamMap.has(name)) teamMap.set(name, { total: 0, closed: 0 })
    const item = teamMap.get(name)!
    item.total++

    if (['agreed', 'converted'].includes(x.normalized_status)) {
      item.closed++
    }
  })

  const leaderboard = Array.from(teamMap.entries())
    .map(([name, s]) => ({
      name,
      total: s.total,
      closed: s.closed,
      rate: s.total > 0 ? ((s.closed / s.total) * 100).toFixed(0) : '0',
    }))
    .sort((a, b) => b.closed - a.closed)

  const conversionRate =
    total > 0 ? ((closuresTillDate / total) * 100).toFixed(1) : '0'

  return {
    total,
    convertedTillDate,
    agreedTillDate,
    closuresTillDate,
    dueToday,
    overdue,
    unassigned,
    stale,
    pipeline,
    leaderboard,
    conversionRate,
  }
}
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import DigestClient from './DigestClient'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey)
}

function getISTDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function startOfISTDayUtc(dateStr: string) {
  return new Date(`${dateStr}T00:00:00+05:30`).toISOString()
}

function endOfISTDayUtc(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999+05:30`).toISOString()
}

function normaliseName(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return 'Unassigned'

  const lower = raw.toLowerCase()
  if (['sheet sync', 'system', 'unknown', '—', '-'].includes(lower)) return 'Unassigned'

  return raw
}

function normaliseStatus(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function displayStatus(value: unknown) {
  const s = normaliseStatus(value)
  if (s === 'converted') return 'Converted'
  if (s === 'agreed') return 'Agreed'
  if (s === 'followup' || s === 'follow up') return 'Followup'
  if (s === 'call back' || s === 'callback') return 'Call Back'
  if (s === 'not interested') return 'Not Interested'
  if (s === 'lead') return 'Lead'
  return String(value || 'Updated')
}

export default async function DigestPage() {
  try {
    const supabase = getSupabaseAdmin()
    const selectedDate = getISTDateString()
    const todayStartIso = startOfISTDayUtc(selectedDate)
    const todayEndIso = endOfISTDayUtc(selectedDate)

    const { data: activities, error } = await supabase
      .from('restaurant_activity_log')
      .select('restaurant_id, restaurant_name, source_sheet, old_status, new_status, changed_by, changed_at, created_at')
      .or(`changed_at.gte.${todayStartIso},created_at.gte.${todayStartIso}`)
      .order('changed_at', { ascending: false })
      .limit(5000)

    if (error) throw new Error(error.message)

    const rawRows = (activities || []).filter((row: any) => {
      const timestamp = row.changed_at || row.created_at
      if (!timestamp) return false
      return timestamp >= todayStartIso && timestamp <= todayEndIso
    })

    const restaurantIds = Array.from(
      new Set(rawRows.map((row: any) => row.restaurant_id).filter(Boolean))
    )

    let restaurants: any[] = []
    if (restaurantIds.length > 0) {
      const { data } = await supabase
        .from('restaurants')
        .select('id, assigned_to_name, restaurant_name, source_sheet, follow_up_date, lead_status, converted')
        .in('id', restaurantIds)
      restaurants = data || []
    }

    const restaurantMap = new Map(restaurants.map((row: any) => [row.id, row]))

    const cleanedRows = rawRows.map((row: any) => {
      const restaurant = restaurantMap.get(row.restaurant_id)
      const changedBy = normaliseName(row.changed_by)
      const executive = changedBy === 'Unassigned'
        ? normaliseName(restaurant?.assigned_to_name)
        : changedBy

      return {
        ...row,
        executive,
        restaurant_name: row.restaurant_name || restaurant?.restaurant_name || 'Unnamed Restaurant',
        source_sheet: row.source_sheet || restaurant?.source_sheet || 'CRM',
        status: displayStatus(row.new_status),
        statusKey: normaliseStatus(row.new_status),
      }
    })

    const repMap = new Map<string, {
      updated: number
      agreed: number
      converted: number
      followup: number
      callback: number
      notInterested: number
      restaurants: string[]
    }>()

    for (const row of cleanedRows) {
      const name = row.executive || 'Unassigned'
      if (!repMap.has(name)) {
        repMap.set(name, {
          updated: 0,
          agreed: 0,
          converted: 0,
          followup: 0,
          callback: 0,
          notInterested: 0,
          restaurants: [],
        })
      }

      const stat = repMap.get(name)!
      stat.updated++
      stat.restaurants.push(row.restaurant_name)

      if (row.statusKey === 'agreed') stat.agreed++
      if (row.statusKey === 'converted') stat.converted++
      if (row.statusKey === 'followup' || row.statusKey === 'follow up') stat.followup++
      if (row.statusKey === 'call back' || row.statusKey === 'callback') stat.callback++
      if (row.statusKey === 'not interested') stat.notInterested++
    }

    const execStats = Array.from(repMap.entries())
      .map(([name, s]) => ({
        name,
        updated: s.updated,
        agreed: s.agreed,
        converted: s.converted,
        closed: s.agreed + s.converted,
        followup: s.followup,
        callback: s.callback,
        notInterested: s.notInterested,
        restaurants: Array.from(new Set(s.restaurants)).slice(0, 8),
      }))
      .sort((a, b) => b.closed - a.closed || b.updated - a.updated)

    const totalUpdatedToday = cleanedRows.length
    const totalAgreed = cleanedRows.filter((x: any) => x.statusKey === 'agreed').length
    const totalConverted = cleanedRows.filter((x: any) => x.statusKey === 'converted').length
    const totalClosed = totalAgreed + totalConverted
    const totalFollowup = cleanedRows.filter((x: any) => ['followup', 'follow up'].includes(x.statusKey)).length
    const totalCallback = cleanedRows.filter((x: any) => ['call back', 'callback'].includes(x.statusKey)).length
    const totalNotInterested = cleanedRows.filter((x: any) => x.statusKey === 'not interested').length
    const conversionRate = totalUpdatedToday > 0 ? ((totalClosed / totalUpdatedToday) * 100).toFixed(1) : '0.0'

    const recentActivities = cleanedRows.slice(0, 30).map((row: any) => ({
      restaurant_name: row.restaurant_name,
      executive: row.executive,
      status: row.status,
      source_sheet: row.source_sheet,
      changed_at: row.changed_at || row.created_at,
    }))

    const dateLabel = new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return (
      <DigestClient
        execStats={execStats}
        recentActivities={recentActivities}
        totalUpdatedToday={totalUpdatedToday}
        totalAgreed={totalAgreed}
        totalConverted={totalConverted}
        totalClosed={totalClosed}
        totalFollowup={totalFollowup}
        totalCallback={totalCallback}
        totalNotInterested={totalNotInterested}
        conversionRate={conversionRate}
        dateLabel={dateLabel}
      />
    )
  } catch (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load digest data: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }
}

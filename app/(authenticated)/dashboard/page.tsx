import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import SyncButton from './SyncButton'
import StatusPill from '@/components/StatusPill'
import StaleBadge from '@/components/StaleBadge'

type LeadRow = {
  lead_status: string | null
  follow_up_date: string | null
  assigned_to_name: string | null
  updated_at: string | null
  converted: boolean | null
}

type RecentRestaurant = {
  id: string
  restaurant_name: string | null
  owner_name: string | null
  lead_status: string | null
  assigned_to_name: string | null
  updated_at: string | null
  follow_up_date: string | null
}

function timeAgo(d: string | null): string {
  if (!d) return '—'
  const now = new Date()
  const diff = now.getTime() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(d).toLocaleDateString()
}

function FocusCard({
  title,
  value,
  subtitle,
  accent,
  urgent,
  href,
}: {
  title: string
  value: number
  subtitle?: string
  accent: string
  urgent?: boolean
  href?: string
}) {
  const content = (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        urgent && value > 0
          ? 'border-rose-300 ring-2 ring-rose-100'
          : 'border-slate-200'
      } ${href ? 'hover:shadow-md active:scale-[0.99]' : ''}`}
    >
      <div className={`h-1 w-full ${accent}`} />
      <div className="p-3 sm:p-5">
        <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </div>
        <div className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
        {subtitle && (
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function MetricPill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-3 shadow-sm">
      <div className={`text-xl sm:text-2xl font-semibold ${color}`}>{value}</div>
      <div className="mt-1 text-[10px] sm:text-xs text-slate-500 text-center leading-tight">
        {label}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()

  const [
    { count: totalCount },
    { data: statusRows },
    { data: recentRestaurants },
  ] = await Promise.all([
    supabase.from('restaurants').select('*', { count: 'exact', head: true }),
    supabase
      .from('restaurants')
      .select('lead_status, follow_up_date, assigned_to_name, updated_at, converted')
      .range(0, 9999),
    supabase
      .from('restaurants')
      .select('id, restaurant_name, owner_name, lead_status, assigned_to_name, updated_at, follow_up_date')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(10),
  ])

  const leads = (statusRows || []) as LeadRow[]
  const restaurants = (recentRestaurants || []) as RecentRestaurant[]

  // ===== FOCUS METRICS =====
  const dueTodayCount = leads.filter((x) => x.follow_up_date === today).length
  const overdueCount = leads.filter(
    (x) => x.follow_up_date && x.follow_up_date < today
  ).length

  const todaysClosuresCount = leads.filter((x) => {
    if (!x.updated_at) return false
    const s = (x.lead_status || '').toLowerCase()
    const isClosed = s === 'agreed' || s === 'converted' || x.converted === true
    return isClosed && x.updated_at >= todayStartIso
  }).length

  const activeStatuses = ['lead', 'followup', 'call back', 'visit', "couldn't connect"]
  const staleCount = leads.filter((x) => {
    const s = (x.lead_status || '').toLowerCase()
    if (!activeStatuses.includes(s)) return false
    if (!x.updated_at) return false
    return x.updated_at < sevenDaysAgo
  }).length

  // ===== PIPELINE METRICS =====
  const leadCount = leads.filter((x) => (x.lead_status || '').toLowerCase() === 'lead').length
  const followupCount = leads.filter((x) => (x.lead_status || '').toLowerCase() === 'followup').length
  const agreedCount = leads.filter((x) => (x.lead_status || '').toLowerCase() === 'agreed').length
  const convertedCount = leads.filter((x) => (x.lead_status || '').toLowerCase() === 'converted').length
  const notInterestedCount = leads.filter(
    (x) => (x.lead_status || '').toLowerCase() === 'not interested'
  ).length
  const callBackCount = leads.filter((x) => (x.lead_status || '').toLowerCase() === 'call back').length

  const totalClosedOrAgreed = agreedCount + convertedCount
  const conversionRate =
    (totalCount || 0) > 0
      ? ((totalClosedOrAgreed / (totalCount || 1)) * 100).toFixed(1)
      : '0'

  // ===== LEADERBOARD =====
  const repStats = new Map<string, { total: number; closed: number }>()
  leads.forEach((x) => {
    if (!x.assigned_to_name) return
    const name = x.assigned_to_name
    if (!repStats.has(name)) repStats.set(name, { total: 0, closed: 0 })
    const stats = repStats.get(name)!
    stats.total++
    const s = (x.lead_status || '').toLowerCase()
    if (s === 'agreed' || s === 'converted' || x.converted === true) {
      stats.closed++
    }
  })

  const leaderboard = Array.from(repStats.entries())
    .map(([name, stats]) => ({
      name,
      total: stats.total,
      closed: stats.closed,
      rate: stats.total > 0 ? ((stats.closed / stats.total) * 100).toFixed(0) : '0',
    }))
    .sort((a, b) => b.closed - a.closed)
    .slice(0, 5)

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {now.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <SyncButton />
      </div>

      {/* TODAY'S FOCUS */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3 px-1">
          Today's Focus
        </h2>
        <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
          <FocusCard
            title="Due Today"
            value={dueTodayCount}
            subtitle="Follow-ups"
            accent="bg-amber-500"
          />
          <FocusCard
            title="Overdue"
            value={overdueCount}
            subtitle="Missed follow-ups"
            accent="bg-rose-500"
            urgent
          />
          <FocusCard
            title="Closed Today"
            value={todaysClosuresCount}
            subtitle="Agreed / Converted"
            accent="bg-emerald-500"
          />
          <FocusCard
            title="Stale Leads"
            value={staleCount}
            subtitle="7+ days idle"
            accent="bg-orange-500"
          />
        </div>
      </div>

      {/* PIPELINE OVERVIEW */}
      <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base sm:text-xl font-semibold text-slate-900">
            Pipeline Overview
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {totalCount || 0} total leads · {conversionRate}% conversion rate
          </p>
        </div>

        <div className="grid gap-2 grid-cols-3 sm:grid-cols-6">
          <MetricPill label="Lead" value={leadCount} color="text-slate-700" />
          <MetricPill label="Followup" value={followupCount} color="text-blue-600" />
          <MetricPill label="Call Back" value={callBackCount} color="text-indigo-600" />
          <MetricPill label="Agreed" value={agreedCount} color="text-emerald-600" />
          <MetricPill label="Converted" value={convertedCount} color="text-green-600" />
          <MetricPill label="Not Interested" value={notInterestedCount} color="text-rose-600" />
        </div>
      </div>

      {/* TEAM LEADERBOARD */}
      {leaderboard.length > 0 && (
        <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-xl font-semibold text-slate-900">
              Team Performance
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Top performers by closures
            </p>
          </div>

          <div className="space-y-2">
            {leaderboard.map((rep, idx) => (
              <div
                key={rep.name}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    idx === 0
                      ? 'bg-amber-100 text-amber-700'
                      : idx === 1
                      ? 'bg-slate-200 text-slate-700'
                      : idx === 2
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate text-sm sm:text-base">
                    {rep.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {rep.closed} closed · {rep.total} leads
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-base sm:text-lg font-semibold text-emerald-600">
                    {rep.rate}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENTLY UPDATED */}
      <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-semibold text-slate-900">
              Recently Updated
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 truncate">
              Last 10 restaurants modified
            </p>
          </div>
          <Link
            href="/restaurants"
            className="flex-shrink-0 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap"
          >
            View all →
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Restaurant</div>
            <div>Owner</div>
            <div>Status</div>
            <div>Assigned To</div>
            <div>Follow-up</div>
            <div>Updated</div>
          </div>
          {restaurants.length > 0 ? (
            restaurants.map((r) => (
              <Link
                key={r.id}
                href="/restaurants"
                className="grid grid-cols-6 border-b border-slate-100 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="font-medium text-slate-900 truncate pr-2">
                  {r.restaurant_name || '—'}
                </div>
                <div className="truncate pr-2">{r.owner_name || '—'}</div>
                <div>
                  <StatusPill status={r.lead_status} size="sm" />
                </div>
                <div className="truncate pr-2">{r.assigned_to_name || '—'}</div>
                <div>{r.follow_up_date || '—'}</div>
                <div className="text-slate-500">{timeAgo(r.updated_at)}</div>
              </Link>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No restaurant data found
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {restaurants.length > 0 ? (
            restaurants.map((r) => (
              <Link
                key={r.id}
                href="/restaurants"
                className="block rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate text-sm">
                      {r.restaurant_name || '—'}
                    </div>
                    {r.owner_name && (
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {r.owner_name}
                      </div>
                    )}
                  </div>
                  <StaleBadge updatedAt={r.updated_at} status={r.lead_status} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <StatusPill status={r.lead_status} size="sm" />
                  <span className="text-[10px] text-slate-500">
                    {timeAgo(r.updated_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="truncate">
                    {r.assigned_to_name ? `👤 ${r.assigned_to_name}` : 'Unassigned'}
                  </span>
                  {r.follow_up_date && <span>📅 {r.follow_up_date}</span>}
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
              No restaurant data found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
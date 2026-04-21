export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import SyncButton from './SyncButton'
import StatusPill from '@/components/StatusPill'
import StaleBadge from '@/components/StaleBadge'
import { fetchAllActiveRestaurants, buildCrmMetrics } from '@/lib/crm-metrics'

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
  return new Date(d).toLocaleDateString('en-IN')
}

function BigMetricCard({
  title,
  value,
  subtitle,
  accent,
  href,
}: {
  title: string
  value: number
  subtitle?: string
  accent: string
  href?: string
}) {
  const content = (
    <div className="overflow-hidden rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white shadow-sm hover:shadow-md transition active:scale-[0.99]">
      <div className={`h-1.5 w-full ${accent}`} />
      <div className="px-5 py-4 sm:px-8 sm:py-6">
        <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-slate-500">
          {title}
        </div>
        <div className="mt-1 text-4xl sm:text-6xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs sm:text-sm text-slate-500">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function FocusCard({
  title,
  value,
  subtitle,
  accent,
  urgent,
}: {
  title: string
  value: number
  subtitle?: string
  accent: string
  urgent?: boolean
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        urgent && value > 0
          ? 'border-rose-300 ring-2 ring-rose-100'
          : 'border-slate-200'
      }`}
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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const rows = await fetchAllActiveRestaurants(supabase)
  const metrics = buildCrmMetrics(rows)

  const recentRestaurants = rows
    .slice()
    .sort((a, b) => {
      const aa = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const bb = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return bb - aa
    })
    .slice(0, 10)

  const now = new Date()

  return (
    <div className="space-y-5 sm:space-y-6">
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

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <BigMetricCard
          title="Total Restaurants"
          value={metrics.total}
          subtitle={`${metrics.conversionRate}% overall conversion rate`}
          accent="bg-slate-800"
          href="/restaurants"
        />
        <BigMetricCard
          title="Converted Till Date"
          value={metrics.convertedTillDate}
          subtitle="Across all synced tabs"
          accent="bg-emerald-500"
          href="/restaurants?status=Converted"
        />
        <BigMetricCard
          title="Agreed Till Date"
          value={metrics.agreedTillDate}
          subtitle="Ready to close"
          accent="bg-teal-500"
          href="/restaurants?status=Agreed"
        />
        <BigMetricCard
          title="Unassigned"
          value={metrics.unassigned}
          subtitle="Need owner / rep mapping"
          accent="bg-amber-500"
          href="/restaurants"
        />
      </div>

      <div>
        <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3 px-1">
          Today's Focus
        </h2>
        <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
          <FocusCard title="Due Today" value={metrics.dueToday} subtitle="Follow-ups" accent="bg-amber-500" />
          <FocusCard title="Overdue" value={metrics.overdue} subtitle="Missed follow-ups" accent="bg-rose-500" urgent />
          <FocusCard title="Stale Leads" value={metrics.stale} subtitle="7+ days idle" accent="bg-orange-500" />
          <FocusCard title="Agreed + Converted" value={metrics.closuresTillDate} subtitle="Total closures till date" accent="bg-emerald-500" />
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base sm:text-xl font-semibold text-slate-900">
            Pipeline Overview
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Status breakdown across all {metrics.total} active restaurants
          </p>
        </div>

        <div className="grid gap-2 grid-cols-3 sm:grid-cols-6">
          <MetricPill label="Lead" value={metrics.pipeline.lead} color="text-slate-700" />
          <MetricPill label="Followup" value={metrics.pipeline.followup} color="text-blue-600" />
          <MetricPill label="Call Back" value={metrics.pipeline.callBack} color="text-indigo-600" />
          <MetricPill label="Agreed" value={metrics.pipeline.agreed} color="text-emerald-600" />
          <MetricPill label="Converted" value={metrics.pipeline.converted} color="text-green-600" />
          <MetricPill label="Not Interested" value={metrics.pipeline.notInterested} color="text-rose-600" />
        </div>
      </div>

      {metrics.leaderboard.length > 0 && (
        <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-xl font-semibold text-slate-900">
              Team Performance
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Top performers by closures across all synced tabs
            </p>
          </div>

          <div className="space-y-2">
            {metrics.leaderboard.slice(0, 5).map((rep, idx) => (
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

        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Restaurant</div>
            <div>Owner</div>
            <div>Status</div>
            <div>Assigned To</div>
            <div>Follow-up</div>
            <div>Updated</div>
          </div>
          {recentRestaurants.length > 0 ? (
            recentRestaurants.map((r) => (
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

        <div className="md:hidden space-y-2">
          {recentRestaurants.length > 0 ? (
            recentRestaurants.map((r) => (
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
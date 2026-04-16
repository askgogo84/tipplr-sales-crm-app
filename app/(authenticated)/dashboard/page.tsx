import { createClient } from '@supabase/supabase-js'
import SyncButton from './SyncButton'
import StatusPill from '@/app/components/StatusPill'
import StaleBadge from '@/app/components/StaleBadge'

type LeadRow = {
  lead_status: string | null
  follow_up_date: string | null
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

function MetricCard({
  title,
  value,
  accent,
}: {
  title: string
  value: number
  accent: string
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className={`h-1.5 w-full ${accent}`} />
      <div className="p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </div>
        <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ count: totalCount }, { data: statusRows }, { data: recentRestaurants }] =
    await Promise.all([
      supabase.from('restaurants').select('*', { count: 'exact', head: true }),
      supabase.from('restaurants').select('lead_status, follow_up_date').range(0, 9999),
      supabase
        .from('restaurants')
        .select('id, restaurant_name, owner_name, lead_status, assigned_to_name, updated_at, follow_up_date')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(10),
    ])

  const leads = (statusRows || []) as LeadRow[]
  const restaurants = (recentRestaurants || []) as RecentRestaurant[]
  const today = new Date().toISOString().slice(0, 10)

  const agreedCount = leads.filter((x) => (x.lead_status || '').toLowerCase() === 'agreed').length
  const followupCount = leads.filter((x) => (x.lead_status || '').toLowerCase() === 'followup').length
  const convertedCount = leads.filter((x) => (x.lead_status || '').toLowerCase() === 'converted').length
  const dueTodayCount = leads.filter((x) => x.follow_up_date === today).length
  const overdueCount = leads.filter((x) => x.follow_up_date && x.follow_up_date < today).length
  const upcomingCount = leads.filter((x) => x.follow_up_date && x.follow_up_date > today).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sales pipeline overview and follow-up snapshot
          </p>
        </div>

        <SyncButton />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Total Leads" value={totalCount || 0} accent="bg-slate-900" />
        <MetricCard title="Agreed" value={agreedCount} accent="bg-emerald-500" />
        <MetricCard title="Followup" value={followupCount} accent="bg-blue-500" />
        <MetricCard title="Converted" value={convertedCount} accent="bg-green-500" />
        <MetricCard title="Due Today" value={dueTodayCount} accent="bg-amber-500" />
        <MetricCard title="Overdue" value={overdueCount} accent="bg-rose-500" />
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Follow-up Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">
              Quick visibility into next action buckets
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due Today
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{dueTodayCount}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overdue
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{overdueCount}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Upcoming
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{upcomingCount}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Recently Updated</h2>
            <p className="mt-1 text-sm text-slate-500">
              Last 10 restaurants modified
            </p>
          </div>

          
            href="/restaurants"
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            View all →
          </a>
        </div>

        {/* Desktop view - table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Restaurant</div>
            <div>Owner</div>
            <div>Status</div>
            <div>Assigned To</div>
            <div>Follow-up</div>
            <div>Updated</div>
          </div>

          {restaurants.length > 0 ? (
            restaurants.map((r) => (
              
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="grid grid-cols-6 border-b border-slate-100 px-5 py-4 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
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
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{timeAgo(r.updated_at)}</span>
                  <StaleBadge updatedAt={r.updated_at} status={r.lead_status} />
                </div>
              </a>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No restaurant data found
            </div>
          )}
        </div>

        {/* Mobile view - cards */}
        <div className="md:hidden space-y-3">
          {restaurants.length > 0 ? (
            restaurants.map((r) => (
              
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
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
                  <span className="text-xs text-slate-500">
                    {timeAgo(r.updated_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="truncate">
                    {r.assigned_to_name ? `👤 ${r.assigned_to_name}` : 'Unassigned'}
                  </span>
                  {r.follow_up_date && (
                    <span>📅 {r.follow_up_date}</span>
                  )}
                </div>
              </a>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
              No restaurant data found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import { createClient } from '@supabase/supabase-js'

type LeadRow = {
  lead_status: string | null
}

type RecentRestaurant = {
  id: string
  restaurant_name: string | null
  owner_name: string | null
  lead_status: string | null
  assigned_to_name: string | null
  updated_at: string | null
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

  const [
    { count: totalCount },
    { data: statusRows },
    { data: recentRestaurants },
  ] = await Promise.all([
    supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('restaurants')
      .select('lead_status')
      .range(0, 9999),

    supabase
      .from('restaurants')
      .select('id, restaurant_name, owner_name, lead_status, assigned_to_name, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(10),
  ])

  const leads = (statusRows || []) as LeadRow[]
  const restaurants = (recentRestaurants || []) as RecentRestaurant[]

  const countByStatus = (status: string) =>
    leads.filter((x) => (x.lead_status || '').toLowerCase() === status.toLowerCase()).length

  const negotiationCount = leads.filter((x) =>
    ['qualified', 'proposal sent', 'negotiation'].includes(
      (x.lead_status || '').toLowerCase()
    )
  ).length

  const wonCount = leads.filter((x) =>
    ['won', 'converted'].includes((x.lead_status || '').toLowerCase())
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sales pipeline overview and CRM activity snapshot
          </p>
        </div>

        <form action="/api/sync" method="GET">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Sync Sheets
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Leads" value={totalCount || 0} accent="bg-slate-900" />
        <MetricCard title="Contacted" value={countByStatus('Contacted')} accent="bg-blue-500" />
        <MetricCard title="Negotiation" value={negotiationCount} accent="bg-violet-500" />
        <MetricCard title="Won" value={wonCount} accent="bg-emerald-500" />
        <MetricCard title="Lost" value={countByStatus('Lost')} accent="bg-rose-500" />
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Recently Updated</h2>
            <p className="mt-1 text-sm text-slate-500">
              Last 10 restaurants modified
            </p>
          </div>

          <a
            href="/restaurants"
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            View all →
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Restaurant</div>
            <div>Owner</div>
            <div>Status</div>
            <div>Assigned To</div>
            <div>Updated</div>
          </div>

          {restaurants.length > 0 ? (
            restaurants.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-5 border-b border-slate-100 px-5 py-4 text-sm text-slate-700"
              >
                <div className="font-medium text-slate-900">{r.restaurant_name || '—'}</div>
                <div>{r.owner_name || '—'}</div>
                <div>{r.lead_status || '—'}</div>
                <div>{r.assigned_to_name || '—'}</div>
                <div>{timeAgo(r.updated_at)}</div>
              </div>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No restaurant data found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
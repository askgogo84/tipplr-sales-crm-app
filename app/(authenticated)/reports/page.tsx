export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import { fetchAllActiveRestaurants, buildCrmMetrics } from '@/lib/crm-metrics'

function PipelineRow({
  label,
  value,
  total,
}: {
  label: string
  value: number
  total: number
}) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(0) : '0'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
        <span>{label}</span>
        <span className="font-medium">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-slate-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default async function ReportsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const rows = await fetchAllActiveRestaurants(supabase)
  const metrics = buildCrmMetrics(rows)
  const now = new Date()

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {now.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })} · Team performance & pipeline health
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-xl font-semibold text-slate-900">Pipeline Summary</h2>
        <p className="mt-1 text-sm text-slate-500">
          Total synced active restaurants: {metrics.total}
        </p>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Converted</div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">{metrics.convertedTillDate}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agreed</div>
            <div className="mt-2 text-3xl font-bold text-teal-600">{metrics.agreedTillDate}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unassigned</div>
            <div className="mt-2 text-3xl font-bold text-amber-600">{metrics.unassigned}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stale Leads</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">{metrics.stale}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-xl font-semibold text-slate-900">Team Performance</h2>
        <p className="mt-1 text-sm text-slate-500">All-time closures across synced tabs</p>

        <div className="mt-4 space-y-3">
          {metrics.leaderboard.length === 0 ? (
            <div className="text-sm text-slate-500">No team data found.</div>
          ) : (
            metrics.leaderboard.slice(0, 10).map((member, idx) => (
              <div key={member.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{member.name}</div>
                    <div className="text-xs text-slate-500">
                      {member.closed} closed · {member.total} leads
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-emerald-600">{member.rate}%</div>
                  <div className="text-[10px] text-slate-500">conversion</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-xl font-semibold text-slate-900">Conversion Funnel</h2>
        <p className="mt-1 text-sm text-slate-500">
          Complete pipeline from all synced tabs
        </p>

        <div className="mt-5 space-y-4">
          <PipelineRow label="Lead" value={metrics.pipeline.lead} total={metrics.total} />
          <PipelineRow label="Followup" value={metrics.pipeline.followup} total={metrics.total} />
          <PipelineRow label="Call Back" value={metrics.pipeline.callBack} total={metrics.total} />
          <PipelineRow label="Agreed" value={metrics.pipeline.agreed} total={metrics.total} />
          <PipelineRow label="Converted" value={metrics.pipeline.converted} total={metrics.total} />
          <PipelineRow label="Not Interested" value={metrics.pipeline.notInterested} total={metrics.total} />
          <PipelineRow label="Couldn't Connect" value={metrics.pipeline.couldntConnect} total={metrics.total} />
          <PipelineRow label="Wrong / Incorrect Number" value={metrics.pipeline.wrongNumber} total={metrics.total} />
        </div>
      </div>
    </div>
  )
}
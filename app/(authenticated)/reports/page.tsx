export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'

function normalizeStatus(status: string | null, converted: boolean | null): string {
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

type Row = {
  lead_status: string | null
  assigned_to_name: string | null
  updated_at: string | null
  follow_up_date: string | null
  converted: boolean | null
  source_sheet: string | null
  is_deactivated: boolean | null
}

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

  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'lead_status, assigned_to_name, updated_at, follow_up_date, converted, source_sheet, is_deactivated'
    )
    .not('source_sheet', 'is', null)
    .neq('source_sheet', 'Deactivated Outlets')

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load reports data.
      </div>
    )
  }

  const all = ((data || []) as Row[])
    .filter((x) => x.source_sheet !== 'Deactivated Outlets' && x.is_deactivated !== true)
    .map((x) => ({
      ...x,
      normalized_status: normalizeStatus(x.lead_status, x.converted),
    }))

  const total = all.length
  const todayUpdated = all.filter((x) => x.updated_at && x.updated_at >= todayStartIso).length
  const stale = all.filter((x) => {
    const activeStatuses = ['lead', 'followup', 'call back', 'visit', "couldn't connect"]
    if (!activeStatuses.includes(x.normalized_status)) return false
    if (!x.updated_at) return false
    return x.updated_at < sevenDaysAgo
  }).length

  const lead = all.filter((x) => x.normalized_status === 'lead').length
  const followup = all.filter((x) => x.normalized_status === 'followup').length
  const callback = all.filter((x) => x.normalized_status === 'call back').length
  const agreed = all.filter((x) => x.normalized_status === 'agreed').length
  const converted = all.filter((x) => x.normalized_status === 'converted').length
  const notInterested = all.filter((x) => x.normalized_status === 'not interested').length
  const couldntConnect = all.filter((x) => x.normalized_status === "couldn't connect").length
  const wrongNumber = all.filter((x) => x.normalized_status === 'wrong number').length

  const execMap = new Map<string, { total: number; closed: number; updated: number }>()
  all.forEach((x) => {
    if (!x.assigned_to_name) return
    const name = x.assigned_to_name.trim()
    if (!name) return
    if (!execMap.has(name)) execMap.set(name, { total: 0, closed: 0, updated: 0 })
    const item = execMap.get(name)!
    item.total++
    if (['agreed', 'converted'].includes(x.normalized_status)) item.closed++
    if (x.updated_at && x.updated_at >= todayStartIso) item.updated++
  })

  const team = Array.from(execMap.entries())
    .map(([name, s]) => ({
      name,
      ...s,
      rate: s.total > 0 ? ((s.closed / s.total) * 100).toFixed(0) : '0',
    }))
    .sort((a, b) => b.closed - a.closed)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex items-center justify-between gap-3">
        <div>
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
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-xl font-semibold text-slate-900">Today's Summary</h2>
        <p className="mt-1 text-sm text-slate-500">Activity since midnight</p>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated Today</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{todayUpdated}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Converted</div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">{converted}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agreed</div>
            <div className="mt-2 text-3xl font-bold text-teal-600">{agreed}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stale Leads</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">{stale}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-xl font-semibold text-slate-900">Team Performance</h2>
        <p className="mt-1 text-sm text-slate-500">All-time closures and activity</p>

        <div className="mt-4 space-y-3">
          {team.length === 0 ? (
            <div className="text-sm text-slate-500">No team data found.</div>
          ) : (
            team.slice(0, 10).map((member, idx) => (
              <div key={member.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{member.name}</div>
                    <div className="text-xs text-slate-500">
                      {member.closed} closed · {member.total} leads · {member.updated} updated today
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
          {total} total restaurants · complete pipeline from all synced tabs
        </p>

        <div className="mt-5 space-y-4">
          <PipelineRow label="Lead" value={lead} total={total} />
          <PipelineRow label="Followup" value={followup} total={total} />
          <PipelineRow label="Call Back" value={callback} total={total} />
          <PipelineRow label="Agreed" value={agreed} total={total} />
          <PipelineRow label="Converted" value={converted} total={total} />
          <PipelineRow label="Not Interested" value={notInterested} total={total} />
          <PipelineRow label="Couldn't Connect" value={couldntConnect} total={total} />
          <PipelineRow label="Wrong / Incorrect Number" value={wrongNumber} total={total} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
            ✓ {agreed + converted} Agreed + Converted
          </span>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
            ↻ {lead + followup + callback + couldntConnect} In Progress
          </span>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700">
            ✕ {notInterested} Not Interested
          </span>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-xl font-semibold text-slate-900">Stale Leads Alert</h2>
        <p className="mt-1 text-sm text-slate-500">
          {stale} active leads not touched in 7+ days
        </p>
      </div>
    </div>
  )
}
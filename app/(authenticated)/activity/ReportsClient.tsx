'use client'

import { useState } from 'react'

type TodayStat = { name: string; updated: number; closed: number; followupsSet: number }
type WeekStat = { name: string; total: number; closed: number; updated: number; rate: string }
type StatusCounts = {
  lead: number; followup: number; callBack: number
  agreed: number; converted: number; notInterested: number
  couldntConnect: number; incorrectNumber: number
}
type StaleLead = {
  id: string; restaurant_name: string | null; lead_status: string | null
  assigned_to_name: string | null; updated_at: string | null; daysSince: number
}

function timeAgo(d: string | null): string {
  if (!d) return 'Never touched'
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function FunnelBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">
          {value} <span className="text-slate-400 font-normal text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ReportsClient({
  todaySummary,
  weekStats,
  statusCounts,
  total,
  staleLeads,
  dateLabel,
  executives,
}: {
  todaySummary: TodayStat[]
  weekStats: WeekStat[]
  statusCounts: StatusCounts
  total: number
  staleLeads: StaleLead[]
  dateLabel: string
  executives: { id: string; full_name: string }[]
}) {
  const [copied, setCopied] = useState(false)
  const [reassignExec, setReassignExec] = useState('')
  const [reassigningIds, setReassigningIds] = useState<Set<string>>(new Set())
  const [reassignedIds, setReassignedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const maxUpdated = Math.max(...weekStats.map(s => s.updated), 1)

  function copyWhatsApp() {
    const lines = [
      `📊 *Tipplr Sales Report — ${dateLabel}*`,
      '',
      "*Today's Activity:*",
      ...(todaySummary.length > 0
        ? todaySummary.map(e => `• ${e.name}: ${e.updated} updates, ${e.closed} closed`)
        : ['• No activity yet today']),
      '',
      '*Overall Performance:*',
      ...weekStats.slice(0, 5).map(e =>
        `• ${e.name}: ${e.closed} closed / ${e.total} leads (${e.rate}%)`
      ),
      '',
      `*Pipeline:* ${statusCounts.agreed} Agreed · ${statusCounts.converted} Converted · ${statusCounts.followup} Followup`,
      `*Stale Leads:* ${staleLeads.length} leads untouched 7+ days`,
    ].join('\n')

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  async function reassignSingle(leadId: string, execName: string) {
    setReassigningIds(prev => new Set(prev).add(leadId))
    try {
      await fetch('/api/restaurants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, assigned_to_name: execName }),
      })
      setReassignedIds(prev => new Set(prev).add(leadId))
    } catch {}
    setReassigningIds(prev => { const s = new Set(prev); s.delete(leadId); return s })
  }

  async function reassignAll() {
    if (!reassignExec) return
    setBulkLoading(true)
    const unassigned = staleLeads.filter(l => !reassignedIds.has(l.id))
    await Promise.all(unassigned.map(l => reassignSingle(l.id, reassignExec)))
    setBulkLoading(false)
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
            Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {dateLabel} · Team performance & pipeline health
          </p>
        </div>
        <button
          onClick={copyWhatsApp}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 active:scale-95'
          }`}
        >
          {copied ? '✓ Copied!' : '📋 Copy for WhatsApp'}
        </button>
      </div>

      {/* SECTION 1: TODAY'S SUMMARY */}
      <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base sm:text-xl font-semibold text-slate-900">Today's Summary</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">Activity since midnight</p>
        </div>
        {todaySummary.length === 0 ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-8 text-center text-sm text-slate-500">
            No activity recorded today yet
          </div>
        ) : (
          <div className="space-y-3">
            {todaySummary.map((exec) => (
              <div key={exec.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                  {exec.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{exec.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{exec.updated} updates today</div>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-emerald-600">{exec.closed}</div>
                    <div className="text-[10px] text-slate-500">closed</div>
                  </div>
                  <div className="text-center hidden sm:block">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">{exec.followupsSet}</div>
                    <div className="text-[10px] text-slate-500">due today</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: TEAM PERFORMANCE */}
      <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base sm:text-xl font-semibold text-slate-900">Team Performance</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">All-time closures and activity</p>
        </div>
        <div className="space-y-4">
          {weekStats.map((exec, idx) => (
            <div key={exec.name} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700'
                    : idx === 1 ? 'bg-slate-200 text-slate-700'
                    : idx === 2 ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-500'
                  }`}>{idx + 1}</div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 text-sm truncate block">{exec.name}</span>
                    <span className="text-xs text-slate-500">{exec.total} leads · {exec.updated} updated this week</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-base font-bold text-emerald-600">{exec.closed} closed</div>
                  <div className="text-xs text-slate-500">{exec.rate}% rate</div>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                  style={{ width: `${maxUpdated > 0 ? Math.round((exec.updated / maxUpdated) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: CONVERSION FUNNEL */}
      <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base sm:text-xl font-semibold text-slate-900">Conversion Funnel</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {total} total restaurants · where leads are in the pipeline
          </p>
        </div>
        <div className="space-y-4">
          <FunnelBar label="Lead (uncontacted)" value={statusCounts.lead} total={total} color="bg-slate-400" />
          <FunnelBar label="Followup" value={statusCounts.followup} total={total} color="bg-blue-400" />
          <FunnelBar label="Call Back" value={statusCounts.callBack} total={total} color="bg-indigo-400" />
          <FunnelBar label="Agreed" value={statusCounts.agreed} total={total} color="bg-emerald-400" />
          <FunnelBar label="Converted" value={statusCounts.converted} total={total} color="bg-green-500" />
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <FunnelBar label="Not Interested" value={statusCounts.notInterested} total={total} color="bg-rose-300" />
            <FunnelBar label="Couldn't Connect" value={statusCounts.couldntConnect} total={total} color="bg-amber-300" />
            <FunnelBar label="Wrong / Incorrect Number" value={statusCounts.incorrectNumber} total={total} color="bg-red-300" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            ✓ {statusCounts.agreed + statusCounts.converted} Agreed + Converted ({total > 0 ? (((statusCounts.agreed + statusCounts.converted) / total) * 100).toFixed(1) : 0}%)
          </span>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700">
            ⟳ {statusCounts.followup + statusCounts.callBack} In Progress
          </span>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
            ✗ {statusCounts.notInterested} Not Interested
          </span>
        </div>
      </div>

      {/* SECTION 4: STALE LEADS ALERT */}
      <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-slate-900">Stale Leads Alert</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {staleLeads.length} active leads not touched in 7+ days
            </p>
          </div>
          {staleLeads.length > 0 && (
            <span className="flex-shrink-0 rounded-full bg-rose-100 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
              ⚠ {staleLeads.length} stale
            </span>
          )}
        </div>

        {staleLeads.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
            <div className="text-2xl mb-2">✓</div>
            <div className="text-sm font-semibold text-emerald-700">No stale leads!</div>
            <div className="text-xs text-emerald-600 mt-1">All active leads touched in the last 7 days</div>
          </div>
        ) : (
          <>
            {/* Bulk reassign bar */}
            {executives.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-amber-800">Bulk Reassign</div>
                  <div className="text-xs text-amber-700 mt-0.5">Assign all {staleLeads.length - reassignedIds.size} remaining stale leads to one exec</div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={reassignExec}
                    onChange={e => setReassignExec(e.target.value)}
                    className="flex-1 sm:w-40 h-10 rounded-xl border border-amber-300 bg-white px-3 text-sm text-slate-900 outline-none"
                  >
                    <option value="">Pick exec</option>
                    {executives.map(ex => (
                      <option key={ex.id} value={ex.full_name}>{ex.full_name}</option>
                    ))}
                  </select>
                  <button
                    onClick={reassignAll}
                    disabled={!reassignExec || bulkLoading}
                    className="h-10 px-4 rounded-xl bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 transition hover:bg-amber-700 whitespace-nowrap"
                  >
                    {bulkLoading ? 'Reassigning...' : 'Reassign All'}
                  </button>
                </div>
              </div>
            )}

            {/* Grouped by exec */}
            {(() => {
              const byExec = new Map<string, StaleLead[]>()
              staleLeads.forEach(l => {
                const key = l.assigned_to_name || 'Unassigned'
                if (!byExec.has(key)) byExec.set(key, [])
                byExec.get(key)!.push(l)
              })

              return Array.from(byExec.entries()).map(([exec, leads]) => (
                <div key={exec} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-2">
                      {exec} ({leads.length})
                    </span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    {leads.map(l => (
                      <div
                        key={l.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                          reassignedIds.has(l.id)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {reassignedIds.has(l.id) ? '✓ ' : ''}{l.restaurant_name || '—'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              (l.lead_status || '').toLowerCase() === 'followup' ? 'bg-blue-100 text-blue-700'
                              : (l.lead_status || '').toLowerCase() === 'call back' ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-200 text-slate-600'
                            }`}>{l.lead_status || '—'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className={`text-sm font-bold ${
                              l.daysSince > 14 ? 'text-red-600'
                              : l.daysSince > 10 ? 'text-orange-500'
                              : 'text-amber-500'
                            }`}>{l.daysSince}d</div>
                            <div className="text-[10px] text-slate-400">{timeAgo(l.updated_at)}</div>
                          </div>
                          {/* Single reassign */}
                          {executives.length > 0 && !reassignedIds.has(l.id) && reassignExec && (
                            <button
                              onClick={() => reassignSingle(l.id, reassignExec)}
                              disabled={reassigningIds.has(l.id)}
                              className="h-8 px-3 rounded-lg bg-slate-900 text-white text-[11px] font-semibold disabled:opacity-50 transition"
                            >
                              {reassigningIds.has(l.id) ? '...' : '→ Assign'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            })()}
          </>
        )}
      </div>
    </div>
  )
}

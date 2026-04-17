'use client'

import { useState } from 'react'

type ExecStat = {
  name: string
  total: number
  updated: number
  closed: number
  followupToday: number
  overdue: number
}

export default function DigestClient({
  execStats,
  totalUpdatedToday,
  totalClosed,
  totalFollowupToday,
  totalOverdue,
  totalLeads,
  conversionRate,
  dateLabel,
}: {
  execStats: ExecStat[]
  totalUpdatedToday: number
  totalClosed: number
  totalFollowupToday: number
  totalOverdue: number
  totalLeads: number
  conversionRate: string
  dateLabel: string
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const [customNote, setCustomNote] = useState('')

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2500)
    })
  }

  // Format 1: Morning briefing
  const morningBriefing = [
    `🌅 *Good Morning Team!*`,
    `📅 ${dateLabel}`,
    ``,
    `*Today's Targets:*`,
    ...execStats.map(e =>
      `👤 *${e.name}:* ${e.followupToday} follow-ups due${e.overdue > 0 ? `, ⚠️ ${e.overdue} overdue` : ''}`
    ),
    ``,
    `📊 *Overall Pipeline:*`,
    `• Total Leads: ${totalLeads}`,
    `• Follow-ups Today: ${totalFollowupToday}`,
    `• Overdue: ${totalOverdue}`,
    `• Conversion Rate: ${conversionRate}%`,
    ``,
    `Let's have a great day! 💪`,
  ].join('\n')

  // Format 2: Evening summary
  const eveningSummary = [
    `📊 *Tipplr Sales Update — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}*`,
    ``,
    `*Today's Activity:*`,
    ...execStats.map(e => {
      const parts = []
      if (e.updated > 0) parts.push(`${e.updated} updates`)
      if (e.closed > 0) parts.push(`✅ ${e.closed} closed`)
      if (e.overdue > 0) parts.push(`⚠️ ${e.overdue} overdue`)
      return `• *${e.name}:* ${parts.length ? parts.join(', ') : 'No activity'}`
    }),
    ``,
    `*Summary:*`,
    `📞 Total calls/updates today: ${totalUpdatedToday}`,
    `✅ Total agreed+converted: ${totalClosed}`,
    `📈 Conversion rate: ${conversionRate}%`,
    customNote ? `\n📝 Note: ${customNote}` : '',
  ].filter(Boolean).join('\n')

  // Format 3: Weekly leaderboard
  const leaderboard = [
    `🏆 *Tipplr Sales Leaderboard*`,
    ``,
    ...execStats
      .sort((a, b) => b.closed - a.closed)
      .slice(0, 5)
      .map((e, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
        const rate = e.total > 0 ? ((e.closed / e.total) * 100).toFixed(0) : '0'
        return `${medal} *${e.name}* — ${e.closed} closed / ${e.total} leads (${rate}%)`
      }),
    ``,
    `📊 Overall: ${totalLeads} leads · ${conversionRate}% conversion`,
  ].join('\n')

  // Format 4: Quick status
  const quickStatus = [
    `📍 *Tipplr Quick Update*`,
    `${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
    ``,
    `Today: ${totalUpdatedToday} updates | ${totalClosed} closed | ${totalOverdue} overdue`,
    ``,
    ...execStats.slice(0, 3).map(e =>
      `${e.name}: ${e.updated} updates${e.closed > 0 ? ` ✅${e.closed}` : ''}`
    ),
  ].join('\n')

  const formats = [
    {
      key: 'morning',
      label: '🌅 Morning Briefing',
      desc: 'Send at 9am — shows each exec\'s targets for the day',
      text: morningBriefing,
      color: 'bg-amber-50 border-amber-200',
      btnColor: 'bg-amber-600 hover:bg-amber-700',
    },
    {
      key: 'evening',
      label: '🌆 Evening Summary',
      desc: 'Send at 7pm — shows what the team achieved today',
      text: eveningSummary,
      color: 'bg-blue-50 border-blue-200',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      key: 'leaderboard',
      label: '🏆 Leaderboard',
      desc: 'Share anytime — motivates the team with rankings',
      text: leaderboard,
      color: 'bg-purple-50 border-purple-200',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      key: 'quick',
      label: '⚡ Quick Status',
      desc: 'One-line summary for quick check-ins',
      text: quickStatus,
      color: 'bg-slate-50 border-slate-200',
      btnColor: 'bg-slate-700 hover:bg-slate-800',
    },
  ]

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          WhatsApp Digest
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          One-tap copy for your team WhatsApp group · {dateLabel}
        </p>

        {/* Live stats bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Updated Today', value: totalUpdatedToday, color: 'text-slate-900' },
            { label: 'Follow-ups Due', value: totalFollowupToday, color: 'text-amber-600' },
            { label: 'Overdue', value: totalOverdue, color: 'text-red-600' },
            { label: 'Total Closed', value: totalClosed, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional custom note */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Add a custom note (optional)
        </label>
        <input
          type="text"
          value={customNote}
          onChange={e => setCustomNote(e.target.value)}
          placeholder="e.g. Tomorrow is a holiday, all follow-ups moved to Monday"
          className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
        />
        <p className="mt-1.5 text-xs text-slate-400">This note appears in the Evening Summary format</p>
      </div>

      {/* Format cards */}
      <div className="grid gap-4 sm:gap-5">
        {formats.map(fmt => (
          <div key={fmt.key} className={`rounded-[28px] border p-4 sm:p-6 ${fmt.color}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-base sm:text-lg font-semibold text-slate-900">{fmt.label}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{fmt.desc}</div>
              </div>
              <button
                onClick={() => copy(fmt.text, fmt.key)}
                className={`flex-shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 ${
                  copied === fmt.key ? 'bg-green-600' : fmt.btnColor
                }`}
              >
                <span>{copied === fmt.key ? '✓' : '📋'}</span>
                <span className="hidden sm:inline">{copied === fmt.key ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Preview */}
            <div className="rounded-2xl bg-white border border-white/80 p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono text-xs sm:text-sm max-h-[280px] overflow-y-auto">
              {fmt.key === 'evening' ? eveningSummary : fmt.text}
            </div>
          </div>
        ))}
      </div>

      {/* Per-exec breakdown */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-xl font-semibold text-slate-900 mb-4">Today's Breakdown</h2>
        <div className="space-y-3">
          {execStats.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-6">No activity recorded today</div>
          ) : execStats.map(e => (
            <div key={e.name} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                {e.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">{e.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{e.total} leads assigned</div>
              </div>
              <div className="flex gap-4 flex-shrink-0 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-700">{e.updated}</div>
                  <div className="text-[10px] text-slate-400">today</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-600">{e.closed}</div>
                  <div className="text-[10px] text-slate-400">closed</div>
                </div>
                {e.overdue > 0 && (
                  <div>
                    <div className="text-lg font-bold text-red-500">{e.overdue}</div>
                    <div className="text-[10px] text-slate-400">overdue</div>
                  </div>
                )}
                {e.followupToday > 0 && (
                  <div>
                    <div className="text-lg font-bold text-amber-600">{e.followupToday}</div>
                    <div className="text-[10px] text-slate-400">due today</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

type ExecStat = {
  name: string
  updated: number
  agreed: number
  converted: number
  closed: number
  followup: number
  callback: number
  notInterested: number
  restaurants: string[]
}

type RecentActivity = {
  restaurant_name: string
  executive: string
  status: string
  source_sheet: string
  changed_at: string
}

export default function DigestClient({
  execStats,
  recentActivities,
  totalUpdatedToday,
  totalAgreed,
  totalConverted,
  totalClosed,
  totalFollowup,
  totalCallback,
  totalNotInterested,
  conversionRate,
  dateLabel,
}: {
  execStats: ExecStat[]
  recentActivities: RecentActivity[]
  totalUpdatedToday: number
  totalAgreed: number
  totalConverted: number
  totalClosed: number
  totalFollowup: number
  totalCallback: number
  totalNotInterested: number
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

  const executiveLines = execStats.length
    ? execStats.map((e) => {
        const parts = [`${e.updated} updates`]
        if (e.agreed) parts.push(`${e.agreed} agreed`)
        if (e.converted) parts.push(`${e.converted} converted`)
        if (e.followup) parts.push(`${e.followup} follow-up`)
        if (e.callback) parts.push(`${e.callback} callback`)
        return `• *${e.name}:* ${parts.join(' | ')}`
      })
    : ['• No executive activity recorded today']

  const topClosers = [...execStats]
    .sort((a, b) => b.closed - a.closed || b.updated - a.updated)
    .slice(0, 5)

  const eveningSummary = [
    `📊 *Tipplr Sales CRM Update — ${dateLabel}*`,
    ``,
    `*Team Activity Today:*`,
    ...executiveLines,
    ``,
    `*Status Summary:*`,
    `📝 Total updates: ${totalUpdatedToday}`,
    `🤝 Agreed: ${totalAgreed}`,
    `✅ Converted / onboarded: ${totalConverted}`,
    `📌 Follow-ups: ${totalFollowup}`,
    `📞 Callbacks: ${totalCallback}`,
    `❌ Not interested: ${totalNotInterested}`,
    `📈 Agreed + Converted rate: ${conversionRate}%`,
    customNote ? `\n📝 Note: ${customNote}` : '',
  ].filter(Boolean).join('\n')

  const leaderboard = [
    `🏆 *Tipplr Sales Leaderboard — ${dateLabel}*`,
    ``,
    ...(topClosers.length
      ? topClosers.map((e, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
          return `${medal} *${e.name}* — ${e.closed} agreed+converted / ${e.updated} updates`
        })
      : ['No activity recorded today']),
    ``,
    `Overall: ${totalUpdatedToday} updates | ${totalAgreed} agreed | ${totalConverted} converted`,
  ].join('\n')

  const quickStatus = [
    `⚡ *Tipplr Quick Status*`,
    `${dateLabel}`,
    ``,
    `Today: ${totalUpdatedToday} updates | ${totalAgreed} agreed | ${totalConverted} converted`,
    `Follow-up: ${totalFollowup} | Callback: ${totalCallback} | Not interested: ${totalNotInterested}`,
    ``,
    ...execStats.slice(0, 5).map((e) => `${e.name}: ${e.updated} updates, ${e.closed} closures`),
  ].join('\n')

  const formats = [
    {
      key: 'evening',
      label: '🌆 Daily Team Summary',
      desc: 'Best for WhatsApp group — executive-wise updates, agreed and converted count',
      text: eveningSummary,
      color: 'bg-blue-50 border-blue-200',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      key: 'leaderboard',
      label: '🏆 Leaderboard',
      desc: 'Motivates team with ranking by agreed + converted closures',
      text: leaderboard,
      color: 'bg-purple-50 border-purple-200',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      key: 'quick',
      label: '⚡ Quick Status',
      desc: 'Short format for quick management check-ins',
      text: quickStatus,
      color: 'bg-slate-50 border-slate-200',
      btnColor: 'bg-slate-700 hover:bg-slate-800',
    },
  ]

  return (
    <div className="space-y-5 pb-8">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">WhatsApp Digest</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Daily executive-wise sales activity summary for your WhatsApp group · {dateLabel}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            { label: 'Updates', value: totalUpdatedToday, color: 'text-slate-900' },
            { label: 'Agreed', value: totalAgreed, color: 'text-amber-600' },
            { label: 'Converted', value: totalConverted, color: 'text-emerald-600' },
            { label: 'Follow-up', value: totalFollowup, color: 'text-blue-600' },
            { label: 'Callback', value: totalCallback, color: 'text-purple-600' },
            { label: 'Not Interested', value: totalNotInterested, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Add a custom note before copying</label>
        <input
          type="text"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="e.g. Push pending documents tomorrow before 12 PM"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
        />
      </div>

      <div className="grid gap-4 sm:gap-5">
        {formats.map((fmt) => (
          <div key={fmt.key} className={`rounded-[28px] border p-4 sm:p-6 ${fmt.color}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-900 sm:text-lg">{fmt.label}</div>
                <div className="mt-1 text-xs text-slate-500 sm:text-sm">{fmt.desc}</div>
              </div>
              <button
                onClick={() => copy(fmt.text, fmt.key)}
                className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 ${copied === fmt.key ? 'bg-green-600' : fmt.btnColor}`}
              >
                {copied === fmt.key ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <div className="max-h-[320px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/80 bg-white p-4 font-mono text-xs leading-relaxed text-slate-700 sm:text-sm">
              {fmt.text}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900 sm:text-xl">Executive Breakdown</h2>
        <div className="space-y-3">
          {execStats.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">No activity recorded today</div>
          ) : execStats.map((e) => (
            <div key={e.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                  {e.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{e.updated} total updates today</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                <Metric label="Updates" value={e.updated} />
                <Metric label="Agreed" value={e.agreed} />
                <Metric label="Converted" value={e.converted} />
                <Metric label="Follow-up" value={e.followup} />
                <Metric label="Callback" value={e.callback} />
                <Metric label="Not Interested" value={e.notInterested} />
              </div>
              {e.restaurants.length > 0 && (
                <div className="mt-3 text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-600">Recent:</span> {e.restaurants.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900 sm:text-xl">Recent Updates</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <div>Restaurant</div><div>Executive</div><div>Status</div><div>Source</div>
          </div>
          {recentActivities.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">No updates found today.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivities.map((a, idx) => (
                <div key={`${a.restaurant_name}-${idx}`} className="grid gap-2 px-4 py-4 text-sm sm:grid-cols-4 sm:gap-4">
                  <div className="font-medium text-slate-900">{a.restaurant_name}</div>
                  <div className="text-slate-600">{a.executive}</div>
                  <div className="font-medium text-emerald-700">{a.status}</div>
                  <div className="text-slate-500">{a.source_sheet}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-2 text-center">
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="mt-0.5 text-[10px] font-medium text-slate-400">{label}</div>
    </div>
  )
}

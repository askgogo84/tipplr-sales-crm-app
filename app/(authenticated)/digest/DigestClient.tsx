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
  totalConverted,
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
    ? execStats.map((e) => `• *${e.name}:* ${e.converted} converted`)
    : ['• No restaurants converted today']

  // Keep this list in the exact same order as the Onboarded Brands page.
  const restaurantLines = recentActivities.map(
    (row, index) => `${index + 1}. ${row.restaurant_name}${row.executive ? ` — ${row.executive}` : ''}`
  )

  const whatsappSummary = [
    `📊 *Tipplr Onboarded Restaurants — ${dateLabel}*`,
    ``,
    `*Executive Summary:*`,
    ...executiveLines,
    ``,
    `*Total Converted:* ${totalConverted}`,
    restaurantLines.length ? `` : null,
    restaurantLines.length ? `*Restaurant List:*` : null,
    ...restaurantLines,
    customNote ? `\n📝 Note: ${customNote}` : null,
  ].filter(Boolean).join('\n')

  const shortSummary = [
    `⚡ *Tipplr Quick Update*`,
    `${dateLabel}`,
    ``,
    ...executiveLines,
    ``,
    `Total: ${totalConverted} converted`,
  ].join('\n')

  const leaderboard = [
    `🏆 *Tipplr Conversion Leaderboard — ${dateLabel}*`,
    ``,
    ...(execStats.length
      ? execStats.map((e, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
          return `${medal} *${e.name}* — ${e.converted} converted`
        })
      : ['No restaurants converted today']),
    ``,
    `Grand Total: ${totalConverted} converted`,
  ].join('\n')

  const formats = [
    {
      key: 'summary',
      label: '📲 WhatsApp Summary',
      desc: 'Best format to send in the team WhatsApp group',
      text: whatsappSummary,
      color: 'bg-blue-50 border-blue-200',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      key: 'leaderboard',
      label: '🏆 Leaderboard',
      desc: 'Executive-wise converted count with total',
      text: leaderboard,
      color: 'bg-purple-50 border-purple-200',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      key: 'quick',
      label: '⚡ Quick Status',
      desc: 'Short version for quick check-ins',
      text: shortSummary,
      color: 'bg-slate-50 border-slate-200',
      btnColor: 'bg-slate-700 hover:bg-slate-800',
    },
  ]

  return (
    <div className="space-y-5 pb-8">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">WhatsApp Digest</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Executive-wise converted restaurant count from Final List · {dateLabel}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{totalConverted}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Converted</div>
          </div>
          {execStats.slice(0, 3).map((e) => (
            <div key={e.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">{e.converted}</div>
              <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{e.name}</div>
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
            <div className="max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/80 bg-white p-4 font-mono text-xs leading-relaxed text-slate-700 sm:text-sm">
              {fmt.text}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900 sm:text-xl">Executive Breakdown</h2>
        <div className="space-y-3">
          {execStats.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">No restaurants converted today</div>
          ) : execStats.map((e) => (
            <div key={e.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{e.converted} converted</div>
                </div>
                <div className="rounded-full bg-emerald-100 px-4 py-1.5 text-lg font-bold text-emerald-700">
                  {e.converted}
                </div>
              </div>
              {e.restaurants.length > 0 && (
                <div className="mt-3 text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-600">Restaurants:</span> {e.restaurants.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900 sm:text-xl">Converted Restaurants</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-3 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <div>Restaurant</div><div>Executive</div><div>Source</div>
          </div>
          {recentActivities.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">No converted restaurants found for today.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivities.map((a, idx) => (
                <div key={`${a.restaurant_name}-${idx}`} className="grid gap-2 px-4 py-4 text-sm sm:grid-cols-3 sm:gap-4">
                  <div className="font-medium text-slate-900">{a.restaurant_name}</div>
                  <div className="text-slate-600">{a.executive}</div>
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

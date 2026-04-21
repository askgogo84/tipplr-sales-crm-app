'use client'

import { useEffect, useMemo, useState } from 'react'

type SheetMetric = {
  source_sheet: string
  total: number
  converted: number
  agreed: number
  lead: number
  followup: number
  callback: number
  notInterested: number
  couldntConnect: number
  unassigned: number
}

const TAB_ORDER = [
  'Final List',
  'ONDC Priority Sheet',
  'Tipplr - Waayu',
  'Priority List',
  'Magic Pindata',
  'Deactivated Outlets',
]

export default function LeadsPage() {
  const [rows, setRows] = useState<SheetMetric[]>([])
  const [activeTab, setActiveTab] = useState('Final List')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/leads-summary', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          setRows(data.rows || [])
          if (data.rows?.length && !data.rows.find((x: SheetMetric) => x.source_sheet === activeTab)) {
            setActiveTab(data.rows[0].source_sheet)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const orderedRows = useMemo(() => {
    const byName = new Map(rows.map((r) => [r.source_sheet, r]))
    const ordered = TAB_ORDER.map((name) => byName.get(name)).filter(Boolean) as SheetMetric[]
    const extra = rows.filter((r) => !TAB_ORDER.includes(r.source_sheet))
    return [...ordered, ...extra]
  }, [rows])

  const current = orderedRows.find((r) => r.source_sheet === activeTab) || orderedRows[0]

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          Leads
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tab-wise pipeline view across all synced sheets
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {orderedRows.map((row) => (
            <button
              key={row.source_sheet}
              onClick={() => setActiveTab(row.source_sheet)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                current?.source_sheet === row.source_sheet
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {row.source_sheet}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-sm text-slate-500">
          Loading leads summary...
        </div>
      ) : !current ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-sm text-slate-500">
          No lead data found.
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{current.total}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Converted</div>
              <div className="mt-2 text-3xl font-bold text-emerald-600">{current.converted}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agreed</div>
              <div className="mt-2 text-3xl font-bold text-teal-600">{current.agreed}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unassigned</div>
              <div className="mt-2 text-3xl font-bold text-amber-600">{current.unassigned}</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-xl font-semibold text-slate-900">
              {current.source_sheet} Pipeline
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Status breakdown for this tab
            </p>

            <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Lead</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{current.lead}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Followup</div>
                <div className="mt-2 text-2xl font-bold text-blue-600">{current.followup}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Call Back</div>
                <div className="mt-2 text-2xl font-bold text-indigo-600">{current.callback}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Agreed</div>
                <div className="mt-2 text-2xl font-bold text-teal-600">{current.agreed}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Converted</div>
                <div className="mt-2 text-2xl font-bold text-emerald-600">{current.converted}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Not Interested</div>
                <div className="mt-2 text-2xl font-bold text-rose-600">{current.notInterested}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Couldn't Connect</div>
                <div className="mt-2 text-2xl font-bold text-sky-600">{current.couldntConnect}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
'use client'

import { useEffect, useState, useMemo } from 'react'

type Restaurant = {
  id: string
  restaurant_name: string | null
  owner_name: string | null
  phone: string | null
  city: string | null
  area: string | null
  lead_status: string | null
  assigned_to_name: string | null
  follow_up_date: string | null
  remarks: string | null
  updated_at: string | null
}

type Executive = {
  id: string
  full_name: string
}

const STATUSES = [
  'Agreed', 'Not Interested', 'Visit', 'Incorrect Number', 'Followup',
  "Couldn't Connect", 'Call Back', 'Wrong Number', 'Invalid Number',
  'Permanently Closed', 'Temporarily Closed', 'Converted',
]

// Statuses that need follow-up → auto-suggest tomorrow
const NEEDS_FOLLOWUP = ['followup', 'call back', 'visit', "couldn't connect"]

function getStatusClasses(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'agreed': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'not interested': return 'bg-slate-100 text-slate-600 border-slate-200'
    case 'visit': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'incorrect number': case 'wrong number': case 'invalid number':
      return 'bg-rose-100 text-rose-700 border-rose-200'
    case "couldn't connect": case 'call back': case 'followup':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'converted': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function MyDayPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [executives, setExecutives] = useState<Executive[]>([])
  const [selectedExec, setSelectedExec] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [quickUpdateId, setQuickUpdateId] = useState<string | null>(null)
  const [quickStatus, setQuickStatus] = useState('')
  const [quickNote, setQuickNote] = useState('')
  const [quickFollowUp, setQuickFollowUp] = useState('')
  const [completedToday, setCompletedToday] = useState(0)
  const [viewMode, setViewMode] = useState<'list' | 'area'>('list')

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/executives', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) setExecutives(data.executives || [])
      } catch {}
    }
    load()
  }, [])

  useEffect(() => {
    loadRestaurants()
  }, [selectedExec])

  async function loadRestaurants() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '500' })
      if (selectedExec) params.set('assignedTo', selectedExec)
      const res = await fetch(`/api/restaurants?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setRestaurants(data.data || [])
    } catch {}
    setLoading(false)
  }

  // Categorize
  const dueToday = useMemo(() =>
    restaurants.filter(r => r.follow_up_date === today)
      .sort((a, b) => (a.area || '').localeCompare(b.area || '')),
    [restaurants, today]
  )

  const overdue = useMemo(() =>
    restaurants.filter(r => r.follow_up_date && r.follow_up_date < today)
      .sort((a, b) => (a.follow_up_date || '').localeCompare(b.follow_up_date || '')),
    [restaurants, today]
  )

  const upcoming = useMemo(() =>
    restaurants.filter(r => r.follow_up_date && r.follow_up_date > today)
      .sort((a, b) => (a.follow_up_date || '').localeCompare(b.follow_up_date || ''))
      .slice(0, 30),
    [restaurants, today]
  )

  const noFollowUp = useMemo(() =>
    restaurants.filter(r =>
      !r.follow_up_date &&
      r.lead_status !== 'Converted' &&
      r.lead_status !== 'Not Interested' &&
      r.lead_status !== 'Permanently Closed' &&
      r.lead_status !== 'Agreed'
    ).slice(0, 15),
    [restaurants]
  )

  // Area grouping of dueToday
  const byArea = useMemo(() => {
    const map = new Map<string, Restaurant[]>()
    dueToday.forEach(r => {
      const area = r.area || r.city || 'Other'
      if (!map.has(area)) map.set(area, [])
      map.get(area)!.push(r)
    })
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [dueToday])

  // Auto-suggest follow-up date based on status
  function handleStatusChange(status: string) {
    setQuickStatus(status)
    const s = status.toLowerCase()
    if (NEEDS_FOLLOWUP.includes(s) && !quickFollowUp) {
      setQuickFollowUp(getTomorrow())
    }
  }

  async function submitQuickUpdate(restaurantId: string) {
    if (!quickStatus) return
    setUpdatingId(restaurantId)
    try {
      const body: any = { id: restaurantId, lead_status: quickStatus }
      if (quickNote.trim()) body.remarks = quickNote.trim()
      if (quickFollowUp) body.follow_up_date = quickFollowUp

      await fetch('/api/restaurants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setCompletedToday(prev => prev + 1)
      setQuickUpdateId(null)
      setQuickStatus('')
      setQuickNote('')
      setQuickFollowUp('')
      await loadRestaurants()
    } catch {}
    setUpdatingId(null)
  }

  function RestaurantCard({ r, showDate }: { r: Restaurant; showDate?: boolean }) {
    const isUpdating = quickUpdateId === r.id
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-slate-900 leading-tight">
                {r.restaurant_name || '—'}
              </div>
              <div className="mt-1 text-[13px] text-slate-500">
                {r.owner_name || 'No owner'}{r.area ? ` · ${r.area}` : ''}{r.city ? `, ${r.city}` : ''}
              </div>
            </div>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex-shrink-0 ${getStatusClasses(r.lead_status)}`}>
              {r.lead_status || '—'}
            </span>
          </div>

          {showDate && r.follow_up_date && (
            <div className="mt-1.5 text-[12px] text-red-500 font-medium">
              Due: {formatDate(r.follow_up_date)}
            </div>
          )}

          {r.remarks && (
            <div className="mt-2 text-[12px] text-slate-400 leading-snug line-clamp-1">
              {r.remarks}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            {r.phone && (
              <>
                <a
                  href={`https://wa.me/91${r.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 text-[13px] font-semibold border border-green-200 active:bg-green-100 transition"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`tel:${r.phone}`}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-[13px] font-semibold border border-blue-200 active:bg-blue-100 transition"
                >
                  📞 Call
                </a>
              </>
            )}
            <button
              onClick={() => {
                if (isUpdating) {
                  setQuickUpdateId(null)
                } else {
                  setQuickUpdateId(r.id)
                  setQuickStatus(r.lead_status || '')
                  setQuickNote('')
                  setQuickFollowUp('')
                }
              }}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold border transition ${
                isUpdating
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'
              }`}
            >
              ✎ Update
            </button>
          </div>
        </div>

        {/* Quick update form */}
        {isUpdating && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                New Status
              </label>
              <select
                value={quickStatus}
                onChange={e => handleStatusChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                <option value="">Select status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Quick Note
              </label>
              <input
                type="text"
                value={quickNote}
                onChange={e => setQuickNote(e.target.value)}
                placeholder="e.g. Owner will call back Monday"
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Next Follow-up
                {quickFollowUp === getTomorrow() && (
                  <span className="ml-2 text-blue-600 normal-case font-normal">✓ Auto-set to tomorrow</span>
                )}
              </label>
              <input
                type="date"
                value={quickFollowUp}
                onChange={e => setQuickFollowUp(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setQuickUpdateId(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => submitQuickUpdate(r.id)}
                disabled={!quickStatus || updatingId === r.id}
                className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50 transition"
              >
                {updatingId === r.id ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function Section({ title, count, color, children, emptyText }: {
    title: string; count: number; color: string
    children: React.ReactNode; emptyText: string
  }) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <span className="text-sm text-slate-500">({count})</span>
        </div>
        {count > 0 ? (
          <div className="space-y-3">{children}</div>
        ) : (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        )}
      </div>
    )
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const dayName = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              {greeting}! 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">{dayName}</p>
          </div>
          <select
            value={selectedExec}
            onChange={e => setSelectedExec(e.target.value)}
            className="h-11 w-full sm:w-auto sm:min-w-[200px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
          >
            <option value="">All team members</option>
            {executives.map(ex => (
              <option key={ex.id} value={ex.full_name}>{ex.full_name}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-amber-700">{dueToday.length}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 mt-1">Due Today</div>
          </div>
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{overdue.length}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-red-500 mt-1">Overdue</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{completedToday}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 mt-1">Done Today</div>
          </div>
        </div>

        {/* View toggle for Due Today */}
        {dueToday.length > 0 && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 h-9 rounded-xl text-sm font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={`flex-1 h-9 rounded-xl text-sm font-semibold transition ${
                viewMode === 'area'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
              }`}
            >
              📍 By Area
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading your tasks...
        </div>
      ) : (
        <div className="space-y-8">

          {/* Overdue — most urgent */}
          {overdue.length > 0 && (
            <Section title="Overdue" count={overdue.length} color="bg-red-500" emptyText="">
              {overdue.map(r => <RestaurantCard key={r.id} r={r} showDate />)}
            </Section>
          )}

          {/* Due Today */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">Due Today</h2>
              <span className="text-sm text-slate-500">({dueToday.length})</span>
            </div>

            {dueToday.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center text-sm text-slate-500">
                No follow-ups scheduled for today
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {dueToday.map(r => <RestaurantCard key={r.id} r={r} />)}
              </div>
            ) : (
              /* Area view */
              <div className="space-y-6">
                {byArea.map(([area, areaRestaurants]) => (
                  <div key={area}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-semibold text-slate-700">📍 {area}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {areaRestaurants.length} restaurants
                      </span>
                    </div>
                    <div className="space-y-3">
                      {areaRestaurants.map(r => <RestaurantCard key={r.id} r={r} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <Section title="Upcoming" count={upcoming.length} color="bg-blue-500" emptyText="">
              {upcoming.map(r => <RestaurantCard key={r.id} r={r} showDate />)}
            </Section>
          )}

          {/* No follow-up set */}
          {noFollowUp.length > 0 && (
            <Section title="No Follow-up Set" count={noFollowUp.length} color="bg-slate-400" emptyText="">
              {noFollowUp.map(r => <RestaurantCard key={r.id} r={r} />)}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

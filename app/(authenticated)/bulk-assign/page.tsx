'use client'

import { useEffect, useState, useMemo } from 'react'

type Restaurant = {
  id: string
  restaurant_name: string | null
  area: string | null
  city: string | null
  lead_status: string | null
  assigned_to_name: string | null
  phone: string | null
}

type Executive = {
  id: string
  full_name: string
}

function getStatusClasses(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'agreed': return 'bg-emerald-100 text-emerald-700'
    case 'not interested': return 'bg-slate-100 text-slate-600'
    case 'visit': return 'bg-amber-100 text-amber-700'
    case 'incorrect number': case 'wrong number': case 'invalid number':
      return 'bg-rose-100 text-rose-700'
    case "couldn't connect": case 'call back': case 'followup':
      return 'bg-blue-100 text-blue-700'
    case 'converted': return 'bg-green-100 text-green-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}

export default function BulkAssignPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [executives, setExecutives] = useState<Executive[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [targetExec, setTargetExec] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('unassigned')
  const [filterArea, setFilterArea] = useState('')
  const [search, setSearch] = useState('')
  const [successCount, setSuccessCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [restRes, execRes] = await Promise.all([
        fetch('/api/restaurants?page=1&pageSize=500', { cache: 'no-store' }),
        fetch('/api/executives', { cache: 'no-store' }),
      ])
      const restData = await restRes.json()
      const execData = await execRes.json()
      if (restRes.ok) setRestaurants(restData.data || [])
      if (execRes.ok) setExecutives(execData.executives || [])
    } catch {}
    setLoading(false)
  }

  // Unique areas
  const areas = useMemo(() => {
    const set = new Set<string>()
    restaurants.forEach(r => { if (r.area) set.add(r.area) })
    return Array.from(set).sort()
  }, [restaurants])

  // Filtered list
  const filtered = useMemo(() => {
    return restaurants.filter(r => {
      if (filterAssignee === 'unassigned' && r.assigned_to_name) return false
      if (filterAssignee && filterAssignee !== 'unassigned' && r.assigned_to_name !== filterAssignee) return false
      if (filterStatus && (r.lead_status || '').toLowerCase() !== filterStatus.toLowerCase()) return false
      if (filterArea && r.area !== filterArea) return false
      if (search) {
        const q = search.toLowerCase()
        return (r.restaurant_name || '').toLowerCase().includes(q) ||
          (r.area || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [restaurants, filterAssignee, filterStatus, filterArea, search])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map(r => r.id)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  async function handleBulkAssign() {
    if (!targetExec || selected.size === 0) return
    setAssigning(true)
    setSuccessCount(0)

    const ids = Array.from(selected)
    let done = 0

    // Batch in groups of 10 to avoid overwhelming the API
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10)
      await Promise.all(
        batch.map(id =>
          fetch('/api/restaurants/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, assigned_to_name: targetExec }),
          })
        )
      )
      done += batch.length
      setSuccessCount(done)
    }

    setSelected(new Set())
    setAssigning(false)
    await loadData()
  }

  const unassignedCount = restaurants.filter(r => !r.assigned_to_name).length

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Bulk Assign
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Select restaurants and assign to an exec in one click
            </p>
          </div>
          {unassignedCount > 0 && (
            <div className="flex-shrink-0 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-center">
              <div className="text-2xl font-bold text-amber-700">{unassignedCount}</div>
              <div className="text-xs font-semibold text-amber-600">Unassigned</div>
            </div>
          )}
        </div>

        {/* Assign bar */}
        {selected.size > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl bg-slate-900 p-4">
            <div className="text-white font-semibold text-sm flex-shrink-0">
              {selected.size} selected
            </div>
            <select
              value={targetExec}
              onChange={e => setTargetExec(e.target.value)}
              className="flex-1 h-10 rounded-xl border border-slate-600 bg-slate-800 px-3 text-sm text-white outline-none min-w-[160px]"
            >
              <option value="">Pick executive</option>
              {executives.map(ex => (
                <option key={ex.id} value={ex.full_name}>{ex.full_name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleBulkAssign}
                disabled={!targetExec || assigning}
                className="h-10 px-5 rounded-xl bg-white text-slate-900 text-sm font-bold disabled:opacity-50 transition hover:bg-slate-100"
              >
                {assigning ? `Assigning... ${successCount}/${selected.size}` : `Assign ${selected.size} leads →`}
              </button>
              <button
                onClick={clearAll}
                className="h-10 px-4 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search restaurant or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 flex-1 min-w-[200px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
          />

          <select
            value={filterAssignee}
            onChange={e => { setFilterAssignee(e.target.value); clearAll() }}
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none min-w-[160px]"
          >
            <option value="unassigned">Unassigned only</option>
            <option value="">All assignees</option>
            {executives.map(ex => (
              <option key={ex.id} value={ex.full_name}>{ex.full_name}</option>
            ))}
          </select>

          <select
            value={filterArea}
            onChange={e => { setFilterArea(e.target.value); clearAll() }}
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none min-w-[160px]"
          >
            <option value="">All areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); clearAll() }}
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none min-w-[140px]"
          >
            <option value="">All statuses</option>
            {['Lead', 'Followup', 'Call Back', 'Agreed', 'Converted', 'Not Interested'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Select all / count */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {filtered.length} restaurants shown
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              Select all {filtered.length}
            </button>
            {selected.size > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition"
              >
                Clear {selected.size}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant list */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading restaurants...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No restaurants match your filters</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(r => {
              const isSelected = selected.has(r.id)
              return (
                <div
                  key={r.id}
                  onClick={() => toggleSelect(r.id)}
                  className={`flex items-center gap-4 px-4 sm:px-6 py-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-900' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-white border-white'
                      : 'border-slate-300 bg-white hover:border-slate-500'
                  }`}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#1A1814" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {r.restaurant_name || '—'}
                    </div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {[r.area, r.city].filter(Boolean).join(', ') || 'No location'}
                      {r.phone && ` · ${r.phone}`}
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    isSelected ? 'bg-slate-700 text-slate-200' : getStatusClasses(r.lead_status)
                  }`}>
                    {r.lead_status || '—'}
                  </span>

                  {/* Assignee */}
                  <div className={`flex-shrink-0 text-xs hidden sm:block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {r.assigned_to_name || <span className="text-amber-500 font-semibold">Unassigned</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

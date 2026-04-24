'use client'

import { useEffect, useState } from 'react'
import RestaurantDetailPanel from '@/components/restaurant-detail'

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
  follow_up_status: string | null
  last_follow_up_note: string | null
  remarks: string | null
  source_sheet?: string | null
  priority?: string | null
  converted?: boolean | null
  documents_received?: boolean | null
  reason?: string | null
  go_live_date?: string | null
}

type Executive = {
  id: string
  full_name: string
}

type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

type Stats = {
  total: number
  convertedTillDate: number
  agreedTillDate: number
  closuresTillDate: number
  unassigned: number
}

const SHEET_STATUSES = [
  'Agreed',
  'Converted',
  'Lead',
  'Followup',
  'Call Back',
  "Couldn't Connect",
  'Visit',
  'Not Interested',
  'Wrong Number',
]

function getStatusClasses(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'agreed':
      return 'bg-emerald-100 text-emerald-700'
    case 'converted':
      return 'bg-green-100 text-green-700'
    case 'not interested':
      return 'bg-slate-100 text-slate-700'
    case 'visit':
      return 'bg-amber-100 text-amber-700'
    case 'wrong number':
      return 'bg-rose-100 text-rose-700'
    case "couldn't connect":
    case 'call back':
    case 'followup':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function formatFollowUpDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [executives, setExecutives] = useState<Executive[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceSheetOptions, setSourceSheetOptions] = useState<string[]>([])

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [followUpFilter, setFollowUpFilter] = useState('')
  const [sourceSheetFilter, setSourceSheetFilter] = useState('')
  const [page, setPage] = useState(1)

  const [stats, setStats] = useState<Stats>({
    total: 0,
    convertedTillDate: 0,
    agreedTillDate: 0,
    closuresTillDate: 0,
    unassigned: 0,
  })

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 100,
    total: 0,
    totalPages: 1,
  })

  async function loadRestaurants(
    currentPage = page,
    currentSearch = search,
    currentStatus = statusFilter,
    currentFollowUp = followUpFilter,
    currentSourceSheet = sourceSheetFilter
  ) {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: '100',
      })

      if (currentSearch.trim()) params.set('search', currentSearch.trim())
      if (currentStatus.trim()) params.set('status', currentStatus.trim())
      if (currentFollowUp.trim()) params.set('followUp', currentFollowUp.trim())
      if (currentSourceSheet.trim()) params.set('sourceSheet', currentSourceSheet.trim())

      const res = await fetch(`/api/restaurants?${params.toString()}`, {
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Restaurants API error:', data)
        setRestaurants([])
        return
      }

      setRestaurants(data.data || [])
      setStats(
        data.stats || {
          total: 0,
          convertedTillDate: 0,
          agreedTillDate: 0,
          closuresTillDate: 0,
          unassigned: 0,
        }
      )
      setSourceSheetOptions(data.filters?.sourceSheets || [])
      setPagination(
        data.pagination || {
          page: currentPage,
          pageSize: 100,
          total: 0,
          totalPages: 1,
        }
      )
    } catch (error) {
      console.error('Failed to load restaurants', error)
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  async function loadExecutives() {
    try {
      const res = await fetch('/api/executives', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) {
        console.error('Executives API error:', data)
        setExecutives([])
        return
      }

      setExecutives(data.executives || [])
    } catch (error) {
      console.error('Failed to load executives', error)
      setExecutives([])
    }
  }

  useEffect(() => {
    loadExecutives()
  }, [])

  useEffect(() => {
    loadRestaurants(page, search, statusFilter, followUpFilter, sourceSheetFilter)
  }, [page, search, statusFilter, followUpFilter, sourceSheetFilter])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function openRestaurant(restaurant: Restaurant) {
    setSelectedRestaurant(restaurant)
    setPanelOpen(true)
  }

  function handleDownloadCsv() {
    const params = new URLSearchParams()

    if (search.trim()) params.set('search', search.trim())
    if (statusFilter.trim()) params.set('status', statusFilter.trim())
    if (followUpFilter.trim()) params.set('followUp', followUpFilter.trim())
    if (sourceSheetFilter.trim()) params.set('sourceSheet', sourceSheetFilter.trim())

    window.open(`/api/restaurants/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Restaurants
            </h1>
            <p className="mt-1 sm:mt-2 text-sm text-slate-500">
              Track restaurants, owners, assignments, and follow-ups
            </p>
          </div>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Download CSV
          </button>
        </div>

        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Restaurants
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">
              {stats.total}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Converted Till Date
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-emerald-600">
              {stats.convertedTillDate}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
              Agreed Till Date
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-teal-600">
              {stats.agreedTillDate}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
              Unassigned
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-amber-600">
              {stats.unassigned}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 grid gap-3 xl:grid-cols-[minmax(0,360px)_1fr]">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <input
              type="text"
              placeholder="Search restaurant, owner, city..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 sm:h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </form>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
              className="h-11 sm:h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3 sm:px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="">All statuses</option>
              {SHEET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={followUpFilter}
              onChange={(e) => {
                setPage(1)
                setFollowUpFilter(e.target.value)
              }}
              className="h-11 sm:h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3 sm:px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="">All follow-ups</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </select>

            <select
              value={sourceSheetFilter}
              onChange={(e) => {
                setPage(1)
                setSourceSheetFilter(e.target.value)
              }}
              className="h-11 sm:h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3 sm:px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="">All source sheets</option>
              {sourceSheetOptions.map((sheet) => (
                <option key={sheet} value={sheet}>
                  {sheet}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="hidden lg:grid grid-cols-15 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="col-span-3">Restaurant</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-2">Follow-up</div>
          <div className="col-span-2">Phone</div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-sm text-slate-500">Loading restaurants...</div>
        ) : restaurants.length === 0 ? (
          <div className="px-6 py-12 text-sm text-slate-500">No restaurants found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                type="button"
                onClick={() => openRestaurant(restaurant)}
                className="w-full text-left transition hover:bg-slate-50 active:bg-slate-100"
              >
                <div className="hidden lg:grid grid-cols-15 items-center px-6 py-4">
                  <div className="col-span-3 pr-4">
                    <div className="text-[15px] font-semibold text-slate-900">
                      {restaurant.restaurant_name || '—'}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {[restaurant.area, restaurant.city].filter(Boolean).join(', ') || 'No location'}
                    </div>
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {restaurant.owner_name || '—'}
                  </div>

                  <div className="col-span-2 pr-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {restaurant.source_sheet || '—'}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                        restaurant.lead_status
                      )}`}
                    >
                      {restaurant.lead_status || 'Unknown'}
                    </span>
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {restaurant.assigned_to_name || 'Unassigned'}
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {formatFollowUpDate(restaurant.follow_up_date)}
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {restaurant.phone || '—'}
                  </div>
                </div>

                <div className="lg:hidden px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-slate-900 leading-tight">
                        {restaurant.restaurant_name || '—'}
                      </div>
                      <div className="mt-1 text-[13px] text-slate-500 leading-snug">
                        {restaurant.owner_name || 'No owner'}
                        {' · '}
                        {[restaurant.area, restaurant.city].filter(Boolean).join(', ') || 'No location'}
                      </div>
                      {restaurant.source_sheet && (
                        <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                          {restaurant.source_sheet}
                        </div>
                      )}
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex-shrink-0 mt-0.5 ${getStatusClasses(
                        restaurant.lead_status
                      )}`}
                    >
                      {restaurant.lead_status || '—'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                    {restaurant.assigned_to_name && <span>{restaurant.assigned_to_name}</span>}
                    {restaurant.phone && <span>{restaurant.phone}</span>}
                    {restaurant.follow_up_date && <span>{formatFollowUpDate(restaurant.follow_up_date)}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="text-xs sm:text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} filtered
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="rounded-xl border border-slate-200 px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-xl border border-slate-200 px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedRestaurant && (
        <RestaurantDetailPanel
          open={panelOpen}
          restaurant={selectedRestaurant}
          onClose={() => setPanelOpen(false)}
          executives={executives}
          onSaved={() =>
            loadRestaurants(page, search, statusFilter, followUpFilter, sourceSheetFilter)
          }
        />
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
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

const SHEET_STATUSES = [
  'Agreed',
  'Not Interested',
  'Visit',
  'Incorrect Number',
  'Followup',
  "Couldn't Connect",
  'Call Back',
  'Wrong Number',
  'Invalid Number',
  'Permanently Closed',
  'Temporarily Closed',
  'Converted',
]

function getStatusClasses(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'agreed':
      return 'bg-emerald-100 text-emerald-700'
    case 'not interested':
      return 'bg-slate-100 text-slate-700'
    case 'visit':
      return 'bg-amber-100 text-amber-700'
    case 'incorrect number':
    case 'wrong number':
    case 'invalid number':
      return 'bg-rose-100 text-rose-700'
    case "couldn't connect":
    case 'call back':
    case 'followup':
      return 'bg-blue-100 text-blue-700'
    case 'temporarily closed':
    case 'permanently closed':
      return 'bg-gray-200 text-gray-700'
    case 'converted':
      return 'bg-green-100 text-green-700'
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

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [followUpFilter, setFollowUpFilter] = useState('')
  const [page, setPage] = useState(1)

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
    currentFollowUp = followUpFilter
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
    loadRestaurants(page, search, statusFilter, followUpFilter)
  }, [page, search, statusFilter, followUpFilter])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function openRestaurant(restaurant: Restaurant) {
    setSelectedRestaurant(restaurant)
    setPanelOpen(true)
  }

  const todayCount = useMemo(
    () => restaurants.filter((r) => r.follow_up_date === new Date().toISOString().slice(0, 10)).length,
    [restaurants]
  )

  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return restaurants.filter((r) => r.follow_up_date && r.follow_up_date < today).length
  }, [restaurants])

  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return restaurants.filter((r) => r.follow_up_date && r.follow_up_date > today).length
  }, [restaurants])

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Restaurants
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track restaurants, owners, assignments, and follow-ups
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <form onSubmit={handleSearchSubmit} className="min-w-[320px]">
              <input
                type="text"
                placeholder="Search restaurant, owner, city, assignee..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </form>

            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
              className="h-12 min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
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
              className="h-12 min-w-[200px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="">All follow-ups</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Restaurants
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {pagination.total}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due Today
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {todayCount}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overdue
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {overdueCount}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Upcoming
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {upcomingCount}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-14 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="col-span-4">Restaurant</div>
          <div className="col-span-2">Owner</div>
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
                className="grid w-full grid-cols-14 items-center px-6 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="col-span-4 pr-4">
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
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <div className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} • Showing up to {pagination.pageSize} rows
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
    onSaved={() => loadRestaurants(page, search, statusFilter, followUpFilter)}
  />
)}
</div>
  )
}
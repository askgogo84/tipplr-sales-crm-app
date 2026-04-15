'use client'

import { useEffect, useMemo, useState } from 'react'
import RestaurantDetailPanel from '@/components/restaurant-detail'

type Restaurant = {
  id: string
  restaurant_name: string
  owner_name: string | null
  phone: string | null
  city: string | null
  area: string | null
  lead_status: string | null
  assigned_to_name: string | null
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

function getStatusClasses(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'lead':
      return 'bg-slate-100 text-slate-700'
    case 'contacted':
      return 'bg-blue-100 text-blue-700'
    case 'qualified':
      return 'bg-violet-100 text-violet-700'
    case 'proposal sent':
      return 'bg-amber-100 text-amber-700'
    case 'won':
    case 'converted':
      return 'bg-emerald-100 text-emerald-700'
    case 'lost':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
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
  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 100,
    total: 0,
    totalPages: 1,
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newRestaurantName, setNewRestaurantName] = useState('')
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCity, setNewCity] = useState('Bengaluru')
  const [newArea, setNewArea] = useState('')
  const [newStatus, setNewStatus] = useState('Lead')
  const [newAssignedTo, setNewAssignedTo] = useState('')
  const [newRemarks, setNewRemarks] = useState('')

  async function loadRestaurants(currentPage = page, currentSearch = search, currentStatus = statusFilter) {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: '100',
      })

      if (currentSearch.trim()) {
        params.set('search', currentSearch.trim())
      }

      if (currentStatus.trim()) {
        params.set('status', currentStatus.trim())
      }

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
    loadRestaurants(page, search, statusFilter)
  }, [page, search, statusFilter])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function handleStatusChange(value: string) {
    setPage(1)
    setStatusFilter(value)
  }

  function openRestaurant(restaurant: Restaurant) {
    setSelectedRestaurant(restaurant)
    setPanelOpen(true)
  }

  async function handleCreateRestaurant(e: React.FormEvent) {
    e.preventDefault()

    if (!newRestaurantName.trim()) {
      alert('Restaurant name is required')
      return
    }

    try {
      setCreating(true)

      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_name: newRestaurantName.trim(),
          owner_name: newOwnerName.trim() || null,
          phone: newPhone.trim() || null,
          city: newCity.trim() || 'Bengaluru',
          area: newArea.trim() || null,
          lead_status: newStatus,
          assigned_to_name: newAssignedTo || null,
          remarks: newRemarks.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to add restaurant')
        return
      }

      setShowAddModal(false)
      setNewRestaurantName('')
      setNewOwnerName('')
      setNewPhone('')
      setNewCity('Bengaluru')
      setNewArea('')
      setNewStatus('Lead')
      setNewAssignedTo('')
      setNewRemarks('')
      await loadRestaurants(page, search, statusFilter)
      alert('Restaurant added successfully')
    } catch (error) {
      console.error('Failed to create restaurant', error)
      alert('Something went wrong while adding restaurant')
    } finally {
      setCreating(false)
    }
  }

  const assignedCount = useMemo(
    () => restaurants.filter((r) => r.assigned_to_name && r.assigned_to_name.trim()).length,
    [restaurants]
  )

  const contactedCount = useMemo(
    () => restaurants.filter((r) => (r.lead_status || '').toLowerCase() === 'contacted').length,
    [restaurants]
  )

  const convertedCount = useMemo(
    () =>
      restaurants.filter((r) =>
        ['won', 'converted'].includes((r.lead_status || '').toLowerCase())
      ).length,
    [restaurants]
  )

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                Restaurants
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Track restaurants, owners, assignments, and status movement
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

              <div className="min-w-[220px]">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="">All statuses</option>
                  <option value="Lead">Lead</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Won">Won</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="h-12 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Add Restaurant
              </button>
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
                Assigned
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {assignedCount}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contacted
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {contactedCount}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Converted
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {convertedCount}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div className="col-span-4">Restaurant</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Assignee</div>
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
                  className="grid w-full grid-cols-12 items-center px-6 py-4 text-left transition hover:bg-slate-50"
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

        <RestaurantDetailPanel
          open={panelOpen}
          restaurant={selectedRestaurant}
          onClose={() => setPanelOpen(false)}
          executives={executives}
          onSaved={() => loadRestaurants(page, search, statusFilter)}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Add Restaurant</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a restaurant manually without affecting sync
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Restaurant Name
                </label>
                <input
                  value={newRestaurantName}
                  onChange={(e) => setNewRestaurantName(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Owner Name
                  </label>
                  <input
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    City
                  </label>
                  <input
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Area
                  </label>
                  <input
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Won">Won</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Assignee
                  </label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {executives.map((exec) => (
                      <option key={exec.id} value={exec.full_name}>
                        {exec.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Remarks
                </label>
                <textarea
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
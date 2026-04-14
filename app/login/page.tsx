'use client'

import { useEffect, useMemo, useState } from 'react'

type Restaurant = {
  id: string
  restaurant_name: string | null
  owner_name: string | null
  phone: string | null
  city: string | null
  lead_status: string | null
  assigned_to_name: string | null
  remarks: string | null
  created_at: string | null
  updated_at: string | null
}

type ApiResponse = {
  success: boolean
  data: Restaurant[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  error?: string
}

const PAGE_SIZE = 50

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    async function fetchRestaurants() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        })

        if (search) params.set('search', search)
        if (status) params.set('status', status)
        if (assignedTo) params.set('assignedTo', assignedTo)

        const res = await fetch(`/api/restaurants?${params.toString()}`, {
          cache: 'no-store',
        })

        const json: ApiResponse = await res.json()

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch restaurants')
        }

        setRestaurants(json.data || [])
        setTotal(json.pagination?.total || 0)
        setTotalPages(json.pagination?.totalPages || 1)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
        setRestaurants([])
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [page, search, status, assignedTo])

  const showingFrom = useMemo(() => {
    if (total === 0) return 0
    return (page - 1) * PAGE_SIZE + 1
  }, [page, total])

  const showingTo = useMemo(() => {
    return Math.min(page * PAGE_SIZE, total)
  }, [page, total])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Restaurants</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage your restaurant pipeline with fast search, filters, and pagination.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              type="text"
              placeholder="Search restaurant / owner / phone / assignee"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500"
            />

            <select
              value={status}
              onChange={(e) => {
                setPage(1)
                setStatus(e.target.value)
              }}
              className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Lead">Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Not Interested">Not Interested</option>
            </select>

            <input
              type="text"
              placeholder="Filter by assignee name"
              value={assignedTo}
              onChange={(e) => {
                setPage(1)
                setAssignedTo(e.target.value)
              }}
              className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500"
            />

            <button
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setStatus('')
                setAssignedTo('')
                setPage(1)
              }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium transition hover:bg-zinc-800"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
            <div>
              Showing <span className="text-white">{showingFrom}</span> to{' '}
              <span className="text-white">{showingTo}</span> of{' '}
              <span className="text-white">{total}</span> restaurants
            </div>

            <div>
              Page <span className="text-white">{page}</span> of{' '}
              <span className="text-white">{totalPages}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Restaurant
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Owner
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Phone
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Assigned To
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    City
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                      Loading restaurants...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                      No restaurants found.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((restaurant) => (
                    <tr key={restaurant.id} className="hover:bg-zinc-900/40 transition">
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {restaurant.restaurant_name || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-300">
                        {restaurant.owner_name || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-300">
                        {restaurant.phone || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200">
                          {restaurant.lead_status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-300">
                        {restaurant.assigned_to_name || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-300">
                        {restaurant.city || '-'}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-4 text-sm text-zinc-400">
                        {restaurant.remarks || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-zinc-400">
              Showing {showingFrom}–{showingTo} of {total}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1 || loading}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-2 text-sm text-zinc-300">
                {page} / {totalPages}
              </div>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useMemo, useState } from 'react'
import RestaurantDetail from './restaurant-detail'

type Restaurant = {
  id: string
  restaurant_name: string | null
  brand_name: string | null
  owner_name: string | null
  phone: string | null
  alternate_phone: string | null
  email: string | null
  area: string | null
  zone: string | null
  city: string | null
  address: string | null
  restaurant_type: string | null
  category: string | null
  source: string | null
  lead_status: string | null
  assigned_to: string | null
  assigned_to_name: string | null
  follow_up_date: string | null
  last_contacted_at: string | null
  onboarded_date: string | null
  commission_percent: number | null
  discount_offer: string | null
  fssai_number: string | null
  menu_status: string | null
  contract_status: string | null
  kyc_status: string | null
  listing_status: string | null
  priority: string | null
  remarks: string | null
  created_at: string | null
  updated_at: string | null
  converted: boolean | null
  documents_received: boolean | null
  go_live_on_digilist: boolean | null
  go_live_date: string | null
  menu_pricing: string | null
  reason: string | null
  source_row_number: number | null
}

const PAGE_SIZE = 30

function statusPill(status: string | null) {
  const s = (status || '').toLowerCase()
  const map: Record<string, { bg: string; color: string }> = {
    lead: { bg: '#E8E4DE', color: '#6B6560' },
    contacted: { bg: '#DBEAFE', color: '#1E40AF' },
    interested: { bg: '#FEF3C7', color: '#92400E' },
    negotiation: { bg: '#EDE9FE', color: '#5B21B6' },
    won: { bg: '#D1FAE5', color: '#065F46' },
    lost: { bg: '#FEE2E2', color: '#991B1B' },
    converted: { bg: '#CFFAFE', color: '#155E75' },
    'not interested': { bg: '#F3F4F6', color: '#6B7280' },
  }
  const c = map[s] || { bg: '#E8E4DE', color: '#6B6560' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.color,
          display: 'inline-block',
        }}
      />
      {status || '—'}
    </span>
  )
}

function priorityPill(priority: string | null) {
  if (!priority) return '—'
  const p = priority.toLowerCase()
  const map: Record<string, { bg: string; color: string }> = {
    high: { bg: '#FEE2E2', color: '#991B1B' },
    medium: { bg: '#FEF3C7', color: '#92400E' },
    low: { bg: '#D1FAE5', color: '#065F46' },
    p1: { bg: '#FEE2E2', color: '#991B1B' },
    p2: { bg: '#FEF3C7', color: '#92400E' },
    p3: { bg: '#D1FAE5', color: '#065F46' },
  }
  const c = map[p] || { bg: '#F3F4F6', color: '#6B7280' }

  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '4px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {priority}
    </span>
  )
}

function formatDate(value: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

export default function RestaurantsClient({
  assigneeOptions,
}: {
  assigneeOptions: string[]
}) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 350)
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
        if (statusFilter) params.set('status', statusFilter)
        if (assigneeFilter) params.set('assignedTo', assigneeFilter)

        const res = await fetch(`/api/restaurants?${params.toString()}`, {
          cache: 'no-store',
        })

        const json = await res.json()

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch restaurants')
        }

        setRestaurants(json.data || [])
        setTotal(json.pagination?.total || 0)
        setTotalPages(json.pagination?.totalPages || 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setRestaurants([])
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [page, search, statusFilter, assigneeFilter])

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || null,
    [restaurants, selectedId]
  )

  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, total)

  function resetFilters() {
    setSearchInput('')
    setSearch('')
    setStatusFilter('')
    setAssigneeFilter('')
    setPage(1)
  }

  const thStyle: React.CSSProperties = {
    padding: '13px 18px',
    textAlign: 'left',
    fontSize: 11.5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-tertiary)',
    background: 'var(--bg-table-header)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '14px 18px',
    fontSize: 13.5,
    borderBottom: '1px solid var(--border-light)',
    verticalAlign: 'middle',
  }

  return (
    <div style={{ padding: '32px 40px 60px', maxWidth: 1440, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
            }}
          >
            Restaurants
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
            Manage your entire restaurant pipeline
          </p>
        </div>

        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
          }}
        >
          + Add Restaurant
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Search restaurant, owner, phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontFamily: 'var(--font-body)',
              fontSize: 13.5,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value)
          }}
          style={selectStyle}
        >
          <option value="">All Statuses</option>
          {['Lead', 'Contacted', 'Interested', 'Negotiation', 'Won', 'Lost', 'Converted', 'Not Interested'].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => {
            setPage(1)
            setAssigneeFilter(e.target.value)
          }}
          style={selectStyle}
        >
          <option value="">All Assignees</option>
          {assigneeOptions
            .filter((n) => n !== 'Unassigned')
            .map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
        </select>

        <button
          onClick={resetFilters}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
          }}
        >
          Reset
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-tertiary)', paddingRight: 4 }}>
          Showing {showingFrom}-{showingTo} of {total}
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Restaurant</th>
                <th style={thStyle}>Owner</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Area / City</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Assigned To</th>
                <th style={thStyle}>Follow Up</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    Loading restaurants...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#991B1B' }}>
                    {error}
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No restaurants found
                  </td>
                </tr>
              ) : (
                restaurants.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={tdStyle}>{r.restaurant_name || '—'}</td>
                    <td style={tdStyle}>{r.owner_name || '—'}</td>
                    <td style={tdStyle}>{r.phone || '—'}</td>
                    <td style={tdStyle}>
                      {[r.area, r.city].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td style={tdStyle}>{statusPill(r.lead_status)}</td>
                    <td style={tdStyle}>{priorityPill(r.priority)}</td>
                    <td style={tdStyle}>{r.assigned_to_name || '—'}</td>
                    <td style={tdStyle}>{formatDate(r.follow_up_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderTop: '1px solid var(--border-light)',
            background: 'var(--bg-table-header)',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={pagerButton(page <= 1)}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={pagerButton(page >= totalPages)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedRestaurant && (
        <RestaurantDetail
          restaurant={selectedRestaurant}
          onClose={() => setSelectedId(null)}
          assigneeOptions={assigneeOptions}
        />
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  color: 'var(--text-primary)',
  outline: 'none',
  cursor: 'pointer',
}

function pagerButton(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: disabled ? '#F3F4F6' : 'var(--bg-card)',
    color: disabled ? '#9CA3AF' : 'var(--text-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
  }
}
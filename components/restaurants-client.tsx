'use client'

import { useEffect, useMemo, useState } from 'react'
import RestaurantDetail from './restaurant-detail'
import { showToast } from '@/components/ui'

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
  if (!priority) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>

  const p = priority.toLowerCase()
  const map: Record<string, { bg: string; color: string }> = {
    high: { bg: '#FEE2E2', color: '#991B1B' },
    medium: { bg: '#FEF3C7', color: '#92400E' },
    low: { bg: '#D1FAE5', color: '#065F46' },
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
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assigneeList, setAssigneeList] = useState<string[]>(assigneeOptions)

  const [form, setForm] = useState({
    restaurant_name: '',
    owner_name: '',
    phone: '',
    email: '',
    area: '',
    city: 'Bengaluru',
    address: '',
    category: '',
    lead_status: 'Lead',
    assigned_to_name: '',
    priority: '',
    follow_up_date: '',
    remarks: '',
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    async function fetchAssignees() {
      try {
        const res = await fetch('/api/team/list', { cache: 'no-store' })
        const json = await res.json()

        if (!res.ok || !json.success) return

        const names = Array.from(
          new Set((json.assignees || []).filter(Boolean))
        ) as string[]

        setAssigneeList(['Unassigned', ...names])
      } catch {
        // keep fallback
      }
    }

    fetchAssignees()
  }, [])

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

  useEffect(() => {
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

  function resetForm() {
    setForm({
      restaurant_name: '',
      owner_name: '',
      phone: '',
      email: '',
      area: '',
      city: 'Bengaluru',
      address: '',
      category: '',
      lead_status: 'Lead',
      assigned_to_name: '',
      priority: '',
      follow_up_date: '',
      remarks: '',
    })
  }

  async function handleAddRestaurant(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add restaurant')
      }

      resetForm()
      setShowAddModal(false)
      setPage(1)
      await fetchRestaurants()
      showToast('Restaurant added successfully')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add restaurant'
      setError(message)
      showToast(message)
    } finally {
      setSaving(false)
    }
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontFamily: 'var(--font-body)',
    fontSize: 13.5,
    color: 'var(--text-primary)',
    outline: 'none',
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
          onClick={() => setShowAddModal(true)}
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

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 10,
            background: '#FEE2E2',
            color: '#991B1B',
            fontSize: 13.5,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 20,
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Search restaurant, owner, phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={inputStyle}
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
          {[
            'Lead',
            'Contacted',
            'Interested',
            'Negotiation',
            'Won',
            'Lost',
            'Converted',
            'Not Interested',
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
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
          {assigneeList
            .filter((n) => n !== 'Unassigned')
            .map((n) => (
              <option key={n} value={n}>
                {n}
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

        <div
          style={{
            marginLeft: 'auto',
            fontSize: 13,
            color: 'var(--text-tertiary)',
            paddingRight: 4,
          }}
        >
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
                  <td
                    colSpan={8}
                    style={{
                      ...tdStyle,
                      textAlign: 'center',
                      padding: '40px 18px',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      ...tdStyle,
                      textAlign: 'center',
                      padding: '40px 18px',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    No restaurants found
                  </td>
                </tr>
              ) : (
                restaurants.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    style={{ cursor: 'pointer', transition: 'background 0.1s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-table-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 550, color: 'var(--text-primary)' }}>
                        {r.restaurant_name || '—'}
                      </div>
                      {r.category && (
                        <div
                          style={{
                            color: 'var(--text-tertiary)',
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {r.category}
                        </div>
                      )}
                    </td>

                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                      {r.owner_name || '—'}
                    </td>

                    <td style={tdStyle}>
                      {r.phone ? (
                        <a
                          href={`https://wa.me/91${r.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: '#25D366',
                            fontWeight: 550,
                            textDecoration: 'none',
                          }}
                        >
                          📱 {r.phone}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>

                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                      {[r.area, r.city].filter(Boolean).join(' / ') || '—'}
                    </td>

                    <td style={tdStyle}>{statusPill(r.lead_status)}</td>
                    <td style={tdStyle}>{priorityPill(r.priority)}</td>

                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                      {r.assigned_to_name || (
                        <span style={{ color: 'var(--text-tertiary)' }}>Unassigned</span>
                      )}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        color: 'var(--text-tertiary)',
                        fontSize: 12.5,
                      }}
                    >
                      {formatDate(r.follow_up_date)}
                    </td>
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
              style={pagerBtn(page <= 1)}
            >
              Previous
            </button>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={pagerBtn(page >= totalPages)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <>
          <div
            onClick={() => setShowAddModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,24,20,0.55)',
              zIndex: 700,
              backdropFilter: 'blur(4px)',
            }}
          />

          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(720px, 92vw)',
              background: 'var(--bg-card)',
              borderRadius: 18,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 701,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 22px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 24,
                    fontStyle: 'italic',
                  }}
                >
                  Add Restaurant
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Add a new lead to the CRM
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} style={{ padding: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <input
                  placeholder="Restaurant name *"
                  value={form.restaurant_name}
                  onChange={(e) =>
                    setForm({ ...form, restaurant_name: e.target.value })
                  }
                  style={inputStyle}
                  required
                />

                <input
                  placeholder="Owner name"
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  style={inputStyle}
                />

                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={inputStyle}
                />

                <input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                />

                <input
                  placeholder="Area"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  style={inputStyle}
                />

                <input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  style={inputStyle}
                />

                <input
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={inputStyle}
                />

                <select
                  value={form.lead_status}
                  onChange={(e) => setForm({ ...form, lead_status: e.target.value })}
                  style={selectStyle}
                >
                  {[
                    'Lead',
                    'Contacted',
                    'Interested',
                    'Negotiation',
                    'Won',
                    'Lost',
                    'Converted',
                    'Not Interested',
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={form.assigned_to_name}
                  onChange={(e) =>
                    setForm({ ...form, assigned_to_name: e.target.value })
                  }
                  style={selectStyle}
                >
                  <option value="">Unassigned</option>
                  {assigneeList
                    .filter((n) => n !== 'Unassigned')
                    .map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                </select>

                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">No priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <input
                  type="date"
                  value={form.follow_up_date}
                  onChange={(e) =>
                    setForm({ ...form, follow_up_date: e.target.value })
                  }
                  style={inputStyle}
                />

                <input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{ ...inputStyle, gridColumn: '1 / -1' }}
                />

                <textarea
                  placeholder="Remarks"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  rows={4}
                  style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : 'Add Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {selectedRestaurant && (
        <RestaurantDetail
          restaurant={selectedRestaurant}
          onClose={() => setSelectedId(null)}
          assigneeOptions={assigneeList}
        />
      )}
    </div>
  )
}

function pagerBtn(disabled: boolean): React.CSSProperties {
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
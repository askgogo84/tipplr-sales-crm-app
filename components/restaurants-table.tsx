'use client'

import { useMemo, useState, useTransition } from 'react'

type Restaurant = {
  id?: number | string
  restaurant_name: string
  owner_name: string | null
  phone: string | null
  lead_status: string | null
  assigned_to_name: string | null
}

const STATUS_OPTIONS = ['Lead', 'Contacted', 'Negotiation', 'Won', 'Lost']

export default function RestaurantsTable({
  initialData,
  assigneeOptions,
}: {
  initialData: Restaurant[]
  assigneeOptions: string[]
}) {
  const [rows, setRows] = useState(initialData)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [assigneeFilter, setAssigneeFilter] = useState('All')
  const [myOnly, setMyOnly] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentUser = 'Goverdhan'

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = query.toLowerCase()

      const matchesQuery =
        row.restaurant_name?.toLowerCase().includes(q) ||
        row.owner_name?.toLowerCase().includes(q) ||
        row.phone?.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'All' ? true : (row.lead_status || '') === statusFilter

      const normalizedAssignee = row.assigned_to_name || 'Unassigned'

      const matchesAssignee =
        assigneeFilter === 'All' ? true : normalizedAssignee === assigneeFilter

      const matchesMyLeads =
        myOnly ? normalizedAssignee === currentUser : true

      return matchesQuery && matchesStatus && matchesAssignee && matchesMyLeads
    })
  }, [rows, query, statusFilter, assigneeFilter, myOnly])

  async function updateRow(
    id: number | string | undefined,
    updates: { lead_status?: string; assigned_to_name?: string }
  ) {
    if (!id) return

    const previousRows = rows

    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              ...(updates.lead_status !== undefined
                ? { lead_status: updates.lead_status }
                : {}),
              ...(updates.assigned_to_name !== undefined
                ? {
                    assigned_to_name:
                      updates.assigned_to_name === 'Unassigned'
                        ? null
                        : updates.assigned_to_name,
                  }
                : {}),
            }
          : row
      )
    )

    startTransition(async () => {
      const res = await fetch('/api/restaurants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...updates,
          assigned_to_name:
            updates.assigned_to_name === 'Unassigned'
              ? ''
              : updates.assigned_to_name,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setRows(previousRows)
        alert(data.error || 'Failed to update')
      }
    })
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr auto',
          gap: 12,
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurant, owner, phone"
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="All">All Assignees</option>
          {assigneeOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#fff',
            whiteSpace: 'nowrap',
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={myOnly}
            onChange={(e) => setMyOnly(e.target.checked)}
          />
          Show only my leads
        </label>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, #131313 0%, #0d0d0d 100%)',
          border: '1px solid #222',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1.2fr 1.2fr 1fr 1.2fr',
            gap: 12,
            padding: 14,
            background: '#171717',
            borderBottom: '1px solid #222',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <div>Restaurant</div>
          <div>Owner</div>
          <div>Phone</div>
          <div>Status</div>
          <div>Assigned To</div>
        </div>

        {filteredRows.map((row) => (
          <div
            key={row.id ?? row.restaurant_name}
            style={{
              display: 'grid',
              gridTemplateColumns: '2.2fr 1.2fr 1.2fr 1fr 1.2fr',
              gap: 12,
              padding: 14,
              borderBottom: '1px solid #1c1c1c',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{row.restaurant_name}</div>
            </div>

            <div style={{ opacity: 0.85 }}>{row.owner_name || '-'}</div>

            <div>
              {row.phone ? (
                <a
                  href={`https://wa.me/${String(row.phone).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#25D366',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {row.phone}
                </a>
              ) : (
                '-'
              )}
            </div>

            <div>
              <select
                value={row.lead_status || 'Lead'}
                onChange={(e) => updateRow(row.id, { lead_status: e.target.value })}
                style={{
                  ...selectStyle,
                  borderColor:
                    row.lead_status === 'Contacted'
                      ? '#facc15'
                      : row.lead_status === 'Negotiation'
                      ? '#3b82f6'
                      : row.lead_status === 'Won'
                      ? '#22c55e'
                      : row.lead_status === 'Lost'
                      ? '#ef4444'
                      : '#2a2a2a',
                }}
                disabled={isPending}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={row.assigned_to_name || 'Unassigned'}
                onChange={(e) =>
                  updateRow(row.id, { assigned_to_name: e.target.value })
                }
                style={selectStyle}
                disabled={isPending}
              >
                {assigneeOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {filteredRows.length === 0 ? (
          <div style={{ padding: 20, opacity: 0.7 }}>No restaurants found.</div>
        ) : null}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #2a2a2a',
  background: '#111',
  color: '#fff',
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid #2a2a2a',
  background: '#111',
  color: '#fff',
  outline: 'none',
}
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
const ASSIGNEE_OPTIONS = ['Unassigned', 'Goverdhan', 'Theresa', 'Manager A', 'Owner B']

export default function RestaurantsTable({
  initialData,
}: {
  initialData: Restaurant[]
}) {
  const [rows, setRows] = useState(initialData)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [assigneeFilter, setAssigneeFilter] = useState('All')
  const [isPending, startTransition] = useTransition()

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery =
        row.restaurant_name?.toLowerCase().includes(query.toLowerCase()) ||
        row.owner_name?.toLowerCase().includes(query.toLowerCase()) ||
        row.phone?.toLowerCase().includes(query.toLowerCase())

      const matchesStatus =
        statusFilter === 'All' ? true : (row.lead_status || '') === statusFilter

      const normalizedAssignee = row.assigned_to_name || 'Unassigned'
      const matchesAssignee =
        assigneeFilter === 'All' ? true : normalizedAssignee === assigneeFilter

      return matchesQuery && matchesStatus && matchesAssignee
    })
  }, [rows, query, statusFilter, assigneeFilter])

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
              ...(updates.lead_status !== undefined ? { lead_status: updates.lead_status } : {}),
              ...(updates.assigned_to_name !== undefined
                ? { assigned_to_name: updates.assigned_to_name === 'Unassigned' ? null : updates.assigned_to_name }
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
            updates.assigned_to_name === 'Unassigned' ? '' : updates.assigned_to_name,
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
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 12,
          marginBottom: 16,
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
          {ASSIGNEE_OPTIONS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1.3fr 1.3fr 1fr 1.2fr',
            gap: 12,
            padding: 14,
            background: '#161616',
            borderBottom: '1px solid #222',
            fontWeight: 600,
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
              gridTemplateColumns: '2.2fr 1.3fr 1.3fr 1fr 1.2fr',
              gap: 12,
              padding: 14,
              borderBottom: '1px solid #1c1c1c',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{row.restaurant_name}</div>
            </div>

            <div>{row.owner_name || '-'}</div>

            <div>
              {row.phone ? (
                <a
                  href={`https://wa.me/${String(row.phone).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#8ab4ff', textDecoration: 'none' }}
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
                onChange={(e) =>
                  updateRow(row.id, { lead_status: e.target.value })
                }
                style={selectStyle}
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
                {ASSIGNEE_OPTIONS.map((name) => (
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
  borderRadius: 10,
  border: '1px solid #2a2a2a',
  background: '#111',
  color: '#fff',
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #2a2a2a',
  background: '#111',
  color: '#fff',
  outline: 'none',
}
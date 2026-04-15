'use client'

import { useState } from 'react'

type Profile = {
  id: number
  full_name: string
  email: string
  role: string | null
}

export default function TeamManager({
  initialData,
}: {
  initialData: Profile[]
}) {
  const [rows, setRows] = useState(initialData)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('sales')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/team/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, role }),
    })

    const data = await res.json()

    if (!data.success) {
      alert(data.error || 'Failed to add team member')
      setLoading(false)
      return
    }

    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        full_name: fullName,
        email,
        role,
      },
    ])

    setFullName('')
    setEmail('')
    setRole('sales')
    setLoading(false)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 420px) 1fr',
        gap: 20,
      }}
    >
      <div style={cardStyle}>
        <div style={sectionTitle}>Add Team Member</div>
        <div style={sectionSub}>Create assignees your team can use inside the CRM.</div>

        <form onSubmit={handleAdd} style={{ marginTop: 18 }}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            style={inputStyle}
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            style={inputStyle}
          />

          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            <option value="sales">Sales</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Adding...' : 'Add Team Member'}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>Current Team</div>
        <div style={sectionSub}>These names appear in the lead assignment dropdown.</div>

        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          {rows.map((row) => (
            <div key={row.id} style={memberRowStyle}>
              <div>
                <div style={{ fontWeight: 700 }}>{row.full_name}</div>
                <div style={{ opacity: 0.65, marginTop: 4 }}>{row.email}</div>
              </div>

              <div style={rolePillStyle}>{row.role || 'sales'}</div>
            </div>
          ))}

          {rows.length === 0 ? (
            <div style={{ opacity: 0.65 }}>No team members yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #131313 0%, #0d0d0d 100%)',
  border: '1px solid #222',
  borderRadius: 20,
  padding: 22,
  boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
}

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
}

const sectionSub: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.68,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  marginBottom: 12,
  borderRadius: 12,
  border: '1px solid #2a2a2a',
  background: '#0b0b0b',
  color: '#fff',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 12,
  border: '1px solid #2f2f2f',
  background: '#1c1c1c',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
}

const memberRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  border: '1px solid #1f1f1f',
  borderRadius: 14,
  background: '#101010',
}

const rolePillStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 999,
  background: '#1b1b1b',
  border: '1px solid #2b2b2b',
  textTransform: 'capitalize',
  fontSize: 13,
}
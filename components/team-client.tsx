'use client'

import { useState } from 'react'
import { showToast } from '@/components/ui'

type Profile = {
  id: number
  full_name: string
  email: string
  role: string | null
}

const AVATAR_COLORS = ['#C67A3C', '#3B82F6', '#8B5CF6', '#059669', '#DC2626', '#D97706', '#EC4899']

export default function TeamClient({ initialData }: { initialData: Profile[] }) {
  const [members, setMembers] = useState(initialData)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('sales')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      showToast('Please fill in name and email')
      return
    }
    setLoading(true)

    const res = await fetch('/api/team/add', {  
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, role }),
    })

    const data = await res.json()

    if (!data.success) {
      showToast(data.error || 'Failed to add team member')
      setLoading(false)
      return
    }

    setMembers((prev) => [...prev, { id: Date.now(), full_name: fullName, email, role }])
    setFullName('')
    setEmail('')
    setRole('sales')
    setLoading(false)
    showToast(`${fullName} added to the team`)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1px solid var(--border)', borderRadius: 10,
    fontFamily: 'var(--font-body)', fontSize: 13.5,
    color: 'var(--text-primary)', background: 'var(--bg-input)',
    outline: 'none',
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '380px 1fr',
      gap: 24, alignItems: 'start',
    }}
    className="team-grid-responsive"
    >
      {/* Add Member Card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic' }}>Add Member</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            New members appear in assignment dropdowns
          </div>
        </div>
        <form onSubmit={handleAdd} style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: 'var(--text-tertiary)', marginBottom: 6,
            }}>
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Bareen"
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: 'var(--text-tertiary)', marginBottom: 6,
            }}>
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bareen@tipplr.in"
              type="email"
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: 'var(--text-tertiary)', marginBottom: 6,
            }}>
              Role
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              <option value="sales">Sales</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 18px', borderRadius: 10,
              border: 'none', background: 'var(--accent)', color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-body)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Adding...' : 'Add Team Member'}
          </button>
        </form>
      </div>

      {/* Current Team Card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{
          padding: '22px 24px 18px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic' }}>Current Team</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {members.length > 0 ? members.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-table-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 600, color: '#fff', flexShrink: 0,
              background: AVATAR_COLORS[i % AVATAR_COLORS.length],
            }}>
              {m.full_name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 550, fontSize: 14 }}>{m.full_name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 2 }}>{m.email}</div>
            </div>
            <div style={{
              padding: '5px 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 550, textTransform: 'capitalize',
              background: m.role === 'admin' ? 'var(--accent-badge)' : 'var(--bg-badge)',
              color: m.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)',
            }}>
              {m.role || 'sales'}
            </div>
          </div>
        )) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No team members yet
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .team-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

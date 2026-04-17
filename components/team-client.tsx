'use client'

import { useState } from 'react'

type Profile = {
  id: number
  full_name: string
  email: string
  role: string | null
}

const AVATAR_COLORS = ['#C67A3C', '#3B82F6', '#8B5CF6', '#059669', '#DC2626', '#D97706', '#EC4899']

function showToast(msg: string) {
  const existing = document.getElementById('tipplr-toast')
  if (existing) existing.remove()
  const toast = document.createElement('div')
  toast.id = 'tipplr-toast'
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px',
    padding: '14px 22px', borderRadius: '10px',
    background: '#1A1814', color: '#fff',
    fontSize: '13.5px', fontWeight: '500',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
    zIndex: '1000', opacity: '1',
    transition: 'all 0.3s ease',
    fontFamily: 'sans-serif',
  })
  toast.textContent = msg
  document.body.appendChild(toast)
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300) }, 2800)
}

export default function TeamClient({ initialData }: { initialData: Profile[] }) {
  const [members, setMembers] = useState(initialData)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('sales')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

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

  async function handleDelete(member: Profile) {
    setDeletingId(member.id)
    try {
      const res = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id }),
      })
      const data = await res.json()
      if (!data.success) {
        showToast(data.error || 'Failed to remove member')
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== member.id))
        showToast(`${member.full_name} removed from team`)
      }
    } catch {
      showToast('Failed to remove member')
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  const inputClass = "w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr] items-start">

      {/* Add Member Card */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Add Member</h2>
          <p className="mt-1 text-sm text-slate-500">New members appear in assignment dropdowns</p>
        </div>
        <form onSubmit={handleAdd} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Bareen"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bareen@tipplr.in"
              type="email"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="sales">Sales</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-2xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50 transition hover:bg-slate-800 active:scale-[0.98]"
          >
            {loading ? 'Adding...' : 'Add Team Member'}
          </button>
        </form>
      </div>

      {/* Current Team Card */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Current Team</h2>
            <p className="mt-1 text-sm text-slate-500">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No team members yet
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-5 sm:px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {m.full_name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{m.full_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{m.email}</div>
                </div>

                {/* Role pill */}
                <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  m.role === 'admin' ? 'bg-amber-100 text-amber-700'
                  : m.role === 'manager' ? 'bg-purple-100 text-purple-700'
                  : 'bg-slate-100 text-slate-600'
                }`}>
                  {m.role || 'sales'}
                </span>

                {/* Delete button / confirm */}
                {confirmDeleteId === m.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500 hidden sm:block">Sure?</span>
                    <button
                      onClick={() => handleDelete(m)}
                      disabled={deletingId === m.id}
                      className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
                    >
                      {deletingId === m.id ? '...' : 'Yes, remove'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(m.id)}
                    className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition"
                    title="Remove member"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

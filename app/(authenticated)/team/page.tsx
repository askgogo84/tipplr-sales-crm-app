'use client'

import { useEffect, useState } from 'react'

type TeamMember = {
  id: string
  full_name: string
  email: string | null
  role: string | null
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Sales')

  async function loadMembers() {
    try {
      setLoading(true)
      const res = await fetch('/api/team/list', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setMembers([]); return }
      setMembers(data.members || data.data || [])
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { alert('Full name is required'); return }
    try {
      setSaving(true)
      const res = await fetch('/api/team/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim() || null, role }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Failed to add member'); return }
      setFullName('')
      setEmail('')
      setRole('Sales')
      await loadMembers()
    } catch {
      alert('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(member: TeamMember) {
    setDeletingId(member.id)
    try {
      const res = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to remove member')
      } else {
        setMembers(prev => prev.filter(m => m.id !== member.id))
      }
    } catch {
      alert('Failed to remove member')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  useEffect(() => { loadMembers() }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Team</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your sales team members and assignees</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Add Member */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Add Member</h2>
            <p className="mt-1 text-sm text-slate-500">New members appear in restaurant assignment dropdowns</p>
          </div>
          <form onSubmit={handleAddMember} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Bareen"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@tipplr.in"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="Sales">Sales</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Team Member'}
            </button>
          </form>
        </div>

        {/* Current Team */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Current Team</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? 'Loading members...' : `${members.length} member${members.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-sm text-slate-500">Loading team members...</div>
          ) : members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              No team members found
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 gap-3"
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-white">
                      {(member.full_name || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{member.full_name}</div>
                      <div className="mt-1 text-sm text-slate-500 truncate">{member.email || 'No email'}</div>
                    </div>
                  </div>

                  {/* Role pill */}
                  <div className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    (member.role || '').toLowerCase() === 'admin' ? 'bg-amber-100 text-amber-700'
                    : (member.role || '').toLowerCase() === 'manager' ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-200 text-slate-700'
                  }`}>
                    {member.role || 'Sales'}
                  </div>

                  {/* Delete — confirm inline */}
                  {confirmDeleteId === member.id ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500 hidden sm:block">Remove?</span>
                      <button
                        onClick={() => handleDelete(member)}
                        disabled={deletingId === member.id}
                        className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
                      >
                        {deletingId === member.id ? '...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(member.id)}
                      title="Remove member"
                      className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition"
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
    </div>
  )
}

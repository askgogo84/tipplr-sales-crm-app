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

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Sales')

  async function loadMembers() {
    try {
      setLoading(true)
      const res = await fetch('/api/team/list', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) {
        console.error('Team list API error:', data)
        setMembers([])
        return
      }

      setMembers(data.members || data.data || [])
    } catch (error) {
      console.error('Failed to load team', error)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()

    if (!fullName.trim()) {
      alert('Full name is required')
      return
    }

    try {
      setSaving(true)

      const res = await fetch('/api/team/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim() || null,
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to add member')
        return
      }

      setFullName('')
      setEmail('')
      setRole('Sales')
      await loadMembers()
      alert('Team member added')
    } catch (error) {
      console.error('Failed to add member', error)
      alert('Something went wrong while adding member')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Team</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your sales team members and assignees
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Add Member</h2>
            <p className="mt-1 text-sm text-slate-500">
              New members appear in restaurant assignment dropdowns
            </p>
          </div>

          <form onSubmit={handleAddMember} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Bareen"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@tipplr.in"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
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
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-white">
                      {(member.full_name || 'T').charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        {member.full_name}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {member.email || 'No email'}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                    {member.role || 'Sales'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
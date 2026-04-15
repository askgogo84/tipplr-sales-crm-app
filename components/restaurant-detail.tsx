'use client'

import { useEffect, useMemo, useState } from 'react'

type Executive = {
  id: string
  full_name: string
}

type Restaurant = {
  id: string
  restaurant_name: string
  owner_name: string | null
  phone: string | null
  city: string | null
  area: string | null
  lead_status: string | null
  assigned_to_name: string | null
  remarks: string | null
}

type ActivityItem = {
  id: string
  action_type: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
  actor_name: string | null
}

type Props = {
  restaurant: Restaurant | null
  open: boolean
  onClose: () => void
  executives: Executive[]
  onSaved?: () => void
}

function getStatusClasses(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'lead':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'contacted':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'qualified':
      return 'bg-violet-100 text-violet-700 border-violet-200'
    case 'proposal sent':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'won':
    case 'converted':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'lost':
      return 'bg-rose-100 text-rose-700 border-rose-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export default function RestaurantDetailPanel({
  restaurant,
  open,
  onClose,
  executives,
  onSaved,
}: Props) {
  const [form, setForm] = useState<Restaurant | null>(restaurant)
  const [saving, setSaving] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  useEffect(() => {
    setForm(restaurant)
  }, [restaurant])

  useEffect(() => {
    if (restaurant?.id && open) {
      loadActivities(restaurant.id)
    }
  }, [restaurant?.id, open])

  async function loadActivities(restaurantId: string) {
    try {
      setLoadingActivities(true)
      const res = await fetch(`/api/restaurants/${restaurantId}/activity`, {
        cache: 'no-store',
      })
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Failed to load activities', error)
      setActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  const hasChanges = useMemo(() => {
    if (!restaurant || !form) return false

    return (
      restaurant.restaurant_name !== form.restaurant_name ||
      restaurant.owner_name !== form.owner_name ||
      restaurant.phone !== form.phone ||
      restaurant.city !== form.city ||
      restaurant.area !== form.area ||
      restaurant.lead_status !== form.lead_status ||
      restaurant.assigned_to_name !== form.assigned_to_name ||
      restaurant.remarks !== form.remarks
    )
  }, [restaurant, form])

  async function handleSave() {
    if (!form || !restaurant?.id) return

    try {
      setSaving(true)

      const res = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_name: form.restaurant_name,
          owner_name: form.owner_name,
          phone: form.phone,
          city: form.city,
          area: form.area,
          lead_status: form.lead_status,
          assigned_to_name: form.assigned_to_name,
          remarks: form.remarks,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to save restaurant')
        return
      }

      setForm(data.restaurant)
      await loadActivities(restaurant.id)
      onSaved?.()
      alert('Restaurant updated successfully')
    } catch (error) {
      console.error(error)
      alert('Something went wrong while saving')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !form) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-white shadow-2xl">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-8 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                      {(form.restaurant_name || 'R').charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        {form.restaurant_name || 'Restaurant Details'}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Edit restaurant info, assignee, and remarks
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                        form.lead_status
                      )}`}
                    >
                      {form.lead_status || 'Unknown'}
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {form.assigned_to_name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Restaurant Name
                  </label>
                  <input
                    value={form.restaurant_name || ''}
                    onChange={(e) =>
                      setForm({ ...form, restaurant_name: e.target.value })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Owner Name
                  </label>
                  <input
                    value={form.owner_name || ''}
                    onChange={(e) =>
                      setForm({ ...form, owner_name: e.target.value })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    value={form.phone || ''}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      City
                    </label>
                    <input
                      value={form.city || ''}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Area
                    </label>
                    <input
                      value={form.area || ''}
                      onChange={(e) =>
                        setForm({ ...form, area: e.target.value })
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Lead Status
                    </label>
                    <select
                      value={form.lead_status || ''}
                      onChange={(e) =>
                        setForm({ ...form, lead_status: e.target.value })
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                      <option value="">Select status</option>
                      <option value="Lead">Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Won">Won</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Assignee
                    </label>
                    <select
                      value={form.assigned_to_name || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          assigned_to_name: e.target.value || null,
                        })
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                      <option value="">Unassigned</option>
                      {executives.map((exec) => (
                        <option key={exec.id} value={exec.full_name}>
                          {exec.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Remarks
                  </label>
                  <textarea
                    rows={7}
                    value={form.remarks || ''}
                    onChange={(e) =>
                      setForm({ ...form, remarks: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    placeholder="Add notes, follow-up context, call summary..."
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-8 py-5">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-l border-slate-200 bg-slate-50 px-6 py-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Activity Log
            </h3>

            <div className="mt-5 space-y-3">
              {loadingActivities ? (
                <div className="text-sm text-slate-500">Loading activity...</div>
              ) : activities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No activity yet.
                </div>
              ) : (
                activities.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {item.action_type}
                    </div>

                    {item.field_name && (
                      <div className="mt-1 text-sm text-slate-600">
                        Field: {item.field_name}
                      </div>
                    )}

                    {(item.old_value || item.new_value) && (
                      <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {item.old_value || '—'} → {item.new_value || '—'}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                      {item.actor_name ? ` • ${item.actor_name}` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
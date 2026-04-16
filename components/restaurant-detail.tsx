'use client'

import { useEffect, useMemo, useState } from 'react'

type Executive = {
  id: string
  full_name: string
}

type Restaurant = {
  id: string
  restaurant_name: string | null
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
  open?: boolean
  onClose: () => void
  executives?: Executive[]
  assigneeOptions?: string[]
  onSaved?: () => void
}

function getStatusClasses(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'agreed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'not interested':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'visit':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'incorrect number':
    case 'wrong number':
    case 'invalid number':
      return 'bg-rose-100 text-rose-700 border-rose-200'
    case "couldn't connect":
    case 'call back':
    case 'followup':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'temporarily closed':
    case 'permanently closed':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'converted':
      return 'bg-green-100 text-green-700 border-green-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function cleanPhoneForActions(phone: string | null) {
  if (!phone) return null
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) return { tel: `+91${cleaned}`, wa: `91${cleaned}`, display: cleaned }
  if (cleaned.length === 12 && cleaned.startsWith('91')) return { tel: `+${cleaned}`, wa: cleaned, display: cleaned.slice(2) }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    const w = cleaned.slice(1)
    return { tel: `+91${w}`, wa: `91${w}`, display: w }
  }
  if (cleaned.length >= 7) return { tel: cleaned, wa: cleaned, display: cleaned }
  return null
}

export default function RestaurantDetailPanel({
  restaurant,
  open = true,
  onClose,
  executives = [],
  assigneeOptions = [],
  onSaved,
}: Props) {
  const [form, setForm] = useState<Restaurant | null>(restaurant)
  const [saving, setSaving] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showActivityMobile, setShowActivityMobile] = useState(false)

  const mergedExecutives: Executive[] =
    executives.length > 0
      ? executives
      : assigneeOptions
          .filter((name) => name && name !== 'Unassigned')
          .map((name, index) => ({
            id: String(index),
            full_name: name,
          }))

  useEffect(() => {
    setForm(restaurant)
  }, [restaurant])

  useEffect(() => {
    if (restaurant?.id && open) {
      loadActivities(restaurant.id)
    }
  }, [restaurant?.id, open])

  // Body scroll lock while modal is open
  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = `-${scrollY}px`
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.width = ''
      document.body.style.top = ''
      window.scrollTo(0, scrollY)
    }
  }, [open])

  // Escape key closes modal
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

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
        headers: { 'Content-Type': 'application/json' },
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
        setToast({ type: 'error', msg: data.error || 'Failed to save' })
        return
      }

      setForm(data.restaurant)
      await loadActivities(restaurant.id)
      onSaved?.()
      setToast({ type: 'success', msg: 'Changes saved' })
    } catch (error) {
      console.error(error)
      setToast({ type: 'error', msg: 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  if (!open || !form) return null

  const phoneActions = cleanPhoneForActions(form.phone)

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container — full screen on mobile, side panel on desktop */}
      <div
        className="relative ml-auto h-full w-full sm:max-w-5xl bg-white shadow-2xl flex flex-col"
        style={{ maxHeight: '100dvh' }}
      >
        {/* HEADER — always visible, non-scrolling */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white">
          <div className="px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-base sm:text-lg font-semibold text-white">
                  {(form.restaurant_name || 'R').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-slate-900 truncate">
                    {form.restaurant_name || 'Restaurant Details'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">
                    Edit info, assignee, and remarks
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close"
                className="flex-shrink-0 flex h-9 w-9 sm:h-auto sm:w-auto items-center justify-center sm:px-4 sm:py-2 rounded-2xl border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span className="sm:hidden text-lg leading-none">✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
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
              {activities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowActivityMobile(!showActivityMobile)}
                  className="lg:hidden inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {showActivityMobile ? 'Hide' : 'Show'} activity ({activities.length})
                </button>
              )}
            </div>

            {/* Quick-action row: Call + WhatsApp */}
            {phoneActions && (
              <div className="mt-3 flex gap-2">
                
                  href={`tel:${phoneActions.tel}`}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 active:bg-blue-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Call
                </a>
                
                  href={`https://wa.me/${phoneActions.wa}?text=${encodeURIComponent(
                    `Hi${form.owner_name ? ' ' + form.owner_name : ''}, this is from Tipplr. Do you have a moment to discuss partnering with us${form.restaurant_name ? ' for ' + form.restaurant_name : ''}?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 active:bg-green-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        {/* BODY — scrollable */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] overflow-hidden">
          {/* Form column — scrolls independently */}
          <div
            className={`overflow-y-auto px-4 sm:px-8 py-5 ${
              showActivityMobile ? 'hidden lg:block' : 'block'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Restaurant Name
                </label>
                <input
                  value={form.restaurant_name || ''}
                  onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Owner Name
                </label>
                <input
                  value={form.owner_name || ''}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    City
                  </label>
                  <input
                    value={form.city || ''}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Area
                  </label>
                  <input
                    value={form.area || ''}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Lead Status
                  </label>
                  <select
                    value={form.lead_status || ''}
                    onChange={(e) => setForm({ ...form, lead_status: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    {[
                      'Agreed',
                      'Not Interested',
                      'Visit',
                      'Incorrect Number',
                      "Couldn't Connect",
                      'Call Back',
                      'Wrong Number',
                      'Invalid Number',
                      'Temporarily Closed',
                      'Permanently Closed',
                      'Followup',
                      'Converted',
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
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
                    {mergedExecutives.map((exec) => (
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
                  rows={6}
                  value={form.remarks || ''}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Add notes, follow-up context, call summary..."
                />
              </div>

              <div className="h-4" />
            </div>
          </div>

          {/* Activity column — scrolls independently on desktop, optional on mobile */}
          <div
            className={`border-l border-slate-200 bg-slate-50 px-4 sm:px-6 py-5 overflow-y-auto ${
              showActivityMobile ? 'block' : 'hidden lg:block'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Activity Log
            </h3>
            <div className="mt-4 space-y-3">
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
                      <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 break-words">
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

        {/* FOOTER — always visible */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 sm:px-8 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="rounded-2xl bg-slate-900 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 max-w-sm px-4 py-3 rounded-lg shadow-lg z-[60] ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="font-medium flex items-center gap-2">
              <span>{toast.type === 'success' ? '✓' : '✕'}</span>
              <span>{toast.msg}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
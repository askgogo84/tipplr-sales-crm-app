'use client'

import { useEffect, useMemo, useState } from 'react'

type Restaurant = Record<string, any> & {
  id: string
}

type Executive = {
  id: string
  full_name: string
}

type FormState = {
  lead_status: string
  assigned_to_name: string
  follow_up_date: string
  priority: string
  remarks: string
  converted: boolean
  documents_received: boolean
  reason: string
  go_live_date: string
}

const STATUS_OPTIONS = [
  'Lead',
  'Agreed',
  'Followup',
  'Call Back',
  "Couldn't Connect",
  'Visit',
  'Not Interested',
  'Wrong Number',
  'Invalid Number',
  'Permanently Closed',
  'Temporarily Closed',
  'Converted',
]

export default function RestaurantDetailPanel({
  open,
  restaurant,
  onClose,
  executives,
  onSaved,
}: {
  open: boolean
  restaurant: Restaurant
  onClose: () => void
  executives: Executive[]
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const initialState: FormState = useMemo(
    () => ({
      lead_status: restaurant.lead_status || '',
      assigned_to_name: restaurant.assigned_to_name || '',
      follow_up_date: restaurant.follow_up_date || '',
      priority: restaurant.priority || '',
      remarks: restaurant.remarks || '',
      converted: Boolean(restaurant.converted),
      documents_received: Boolean(restaurant.documents_received),
      reason: restaurant.reason || '',
      go_live_date: restaurant.go_live_date || '',
    }),
    [restaurant]
  )

  const [form, setForm] = useState<FormState>(initialState)

  useEffect(() => {
    setForm(initialState)
    setSavedMessage('')
    setErrorMessage('')
  }, [initialState])

  if (!open) return null

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSavedMessage('')
    setErrorMessage('')
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialState)

  async function handleSave() {
    setLoading(true)
    setSavedMessage('')
    setErrorMessage('')

    try {
      const res = await fetch('/api/restaurants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restaurant.id,
          lead_status: form.lead_status || null,
          assigned_to_name: form.assigned_to_name || null,
          follow_up_date: form.follow_up_date || null,
          priority: form.priority || null,
          remarks: form.remarks || null,
          converted: form.converted,
          documents_received: form.documents_received,
          reason: form.reason || null,
          go_live_date: form.go_live_date || null,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save changes')
      }

      setSavedMessage('Updated successfully')
      onSaved()
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setForm(initialState)
    setSavedMessage('')
    setErrorMessage('')
  }

  const whatsappHref = restaurant.phone
    ? `https://wa.me/91${String(restaurant.phone).replace(/\D/g, '')}`
    : null

  const callHref = restaurant.phone ? `tel:${restaurant.phone}` : null

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-[2px]"
      />

      <div className="fixed right-0 top-0 z-[501] flex h-screen w-[560px] max-w-[96vw] flex-col overflow-hidden bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="truncate text-xl font-semibold text-slate-900">
              {restaurant.restaurant_name || 'Restaurant'}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {restaurant.owner_name || 'No owner'}
              {restaurant.city ? ` • ${restaurant.city}` : ''}
              {restaurant.source_sheet ? ` • ${restaurant.source_sheet}` : ''}
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-4 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-4">
            <SectionCard title="Lead Status">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Status">
                  <select
                    value={form.lead_status}
                    onChange={(e) => setField('lead_status', e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Assigned To">
                  <select
                    value={form.assigned_to_name}
                    onChange={(e) => setField('assigned_to_name', e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Unassigned</option>
                    {executives.map((ex) => (
                      <option key={ex.id} value={ex.full_name}>
                        {ex.full_name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Follow-up & Priority">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Follow-up Date">
                  <input
                    type="date"
                    value={form.follow_up_date}
                    onChange={(e) => setField('follow_up_date', e.target.value)}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Priority">
                  <select
                    value={form.priority}
                    onChange={(e) => setField('priority', e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">None</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </Field>
              </div>
            </SectionCard>

            {(whatsappHref || callHref) && (
              <SectionCard title="Contact">
                <div className="grid gap-3 sm:grid-cols-2">
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <div />
                  )}

                  {callHref ? (
                    <a
                      href={callHref}
                      className="rounded-xl bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Call
                    </a>
                  ) : (
                    <div />
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Notes">
              <div className="grid gap-4">
                <Field label="Remarks">
                  <textarea
                    rows={4}
                    value={form.remarks}
                    onChange={(e) => setField('remarks', e.target.value)}
                    className={`${inputClassName} min-h-[110px] resize-y`}
                  />
                </Field>

                <Field label="Reason">
                  <textarea
                    rows={3}
                    value={form.reason}
                    onChange={(e) => setField('reason', e.target.value)}
                    className={`${inputClassName} min-h-[90px] resize-y`}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Conversion Details">
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ToggleField
                    label="Converted"
                    value={form.converted}
                    onChange={(value) => setField('converted', value)}
                  />
                  <ToggleField
                    label="Docs Received"
                    value={form.documents_received}
                    onChange={(value) => setField('documents_received', value)}
                  />
                </div>

                <Field label="Go Live Date">
                  <input
                    type="date"
                    value={form.go_live_date}
                    onChange={(e) => setField('go_live_date', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Read Only">
              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <ReadOnlyItem label="Restaurant Name" value={restaurant.restaurant_name} />
                <ReadOnlyItem label="Owner" value={restaurant.owner_name} />
                <ReadOnlyItem label="Phone" value={restaurant.phone} />
                <ReadOnlyItem label="City" value={restaurant.city} />
                <ReadOnlyItem label="Source Sheet" value={restaurant.source_sheet} />
                <ReadOnlyItem label="Last Updated" value={restaurant.updated_at} />
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          {errorMessage && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          {savedMessage && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {savedMessage}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleReset}
              disabled={loading || !isDirty}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={loading || !isDirty}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      {children}
    </label>
  )
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
          value
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-200 text-slate-600'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </button>
    </div>
  )
}

function ReadOnlyItem({
  label,
  value,
}: {
  label: string
  value: any
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="break-words text-sm text-slate-800">
        {value ? String(value) : '-'}
      </div>
    </div>
  )
}

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white'
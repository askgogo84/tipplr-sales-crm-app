import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusPill from '@/components/StatusPill'
import StaleBadge from '@/components/StaleBadge'
import ContactActions from '@/components/ContactActions'

type Restaurant = {
  id: string
  restaurant_name: string | null
  owner_name: string | null
  phone: string | null
  city: string | null
  priority: string | null
  lead_status: string | null
  assigned_to_name: string | null
  remarks: string | null
  converted: boolean | null
  documents_received: boolean | null
  go_live_on_digihat: string | null
  go_live_date: string | null
  menu_pricing: string | null
  discount: string | null
  reason: string | null
  follow_up_date: string | null
  source_row_number: number | null
  updated_at: string | null
  created_at: string | null
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return d
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-3 border-b border-slate-100 last:border-b-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:w-40 flex-shrink-0">
        {label}
      </div>
      <div className="text-sm text-slate-900 sm:text-right flex-1 break-words">
        {value || <span className="text-slate-400">—</span>}
      </div>
    </div>
  )
}

function BoolPill({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-slate-400">—</span>
  if (value) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        ✓ Yes
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      No
    </span>
  )
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const r = data as Restaurant

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href="/restaurants"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4"
        >
          ← Back to restaurants
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 break-words">
              {r.restaurant_name || 'Unnamed Restaurant'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={r.lead_status} />
              <StaleBadge updatedAt={r.updated_at} status={r.lead_status} />
              {r.priority && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  Priority: {r.priority}
                </span>
              )}
            </div>
            {r.owner_name && (
              <div className="mt-3 text-sm text-slate-600">
                👤 {r.owner_name}
                {r.city && ` · ${r.city}`}
              </div>
            )}
          </div>

          {r.phone && (
            <div className="flex-shrink-0">
              <ContactActions
                phone={r.phone}
                restaurantName={r.restaurant_name}
                ownerName={r.owner_name}
                size="lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact & Assignment */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Contact & Assignment
          </h2>
          <div>
            <InfoRow label="Owner" value={r.owner_name} />
            <InfoRow label="Phone" value={r.phone} />
            <InfoRow label="City" value={r.city} />
            <InfoRow label="Assigned To" value={r.assigned_to_name} />
            <InfoRow label="Priority" value={r.priority} />
            <InfoRow label="Follow-up Date" value={r.follow_up_date} />
          </div>
        </div>

        {/* Deal Info */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Deal Information
          </h2>
          <div>
            <InfoRow label="Status" value={<StatusPill status={r.lead_status} size="sm" />} />
            <InfoRow label="Converted" value={<BoolPill value={r.converted} />} />
            <InfoRow label="Documents Received" value={<BoolPill value={r.documents_received} />} />
            <InfoRow label="Go Live on Digihat" value={r.go_live_on_digihat} />
            <InfoRow label="Go Live Date" value={r.go_live_date} />
            <InfoRow label="Menu Pricing" value={r.menu_pricing} />
            <InfoRow label="Discount" value={r.discount} />
          </div>
        </div>
      </div>

      {/* Remarks */}
      {r.remarks && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Remarks</h2>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-wrap break-words">
            {r.remarks}
          </div>
        </div>
      )}

      {/* Reason (if not agreeing) */}
      {r.reason && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Reason / Notes
          </h2>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-slate-800 whitespace-pre-wrap break-words">
            {r.reason}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Record Details</h2>
        <div>
          <InfoRow label="Created At" value={formatDate(r.created_at)} />
          <InfoRow label="Last Updated" value={formatDate(r.updated_at)} />
          <InfoRow label="Sheet Row Number" value={r.source_row_number?.toString()} />
          <InfoRow label="Record ID" value={<code className="text-xs font-mono text-slate-500">{r.id}</code>} />
        </div>
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import { fetchAllActiveRestaurants, buildCrmMetrics, normalizeStatus } from '@/lib/crm-metrics'

function getStatusClasses(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'agreed':
      return 'bg-emerald-100 text-emerald-700'
    case 'converted':
      return 'bg-green-100 text-green-700'
    case 'not interested':
      return 'bg-slate-100 text-slate-700'
    case 'visit':
      return 'bg-amber-100 text-amber-700'
    case 'wrong number':
      return 'bg-rose-100 text-rose-700'
    case "couldn't connect":
    case 'call back':
    case 'followup':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function formatFollowUpDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function RestaurantsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const rows = await fetchAllActiveRestaurants(
    supabase,
    'id, restaurant_name, owner_name, phone, city, area, lead_status, assigned_to_name, follow_up_date, remarks, updated_at, converted, source_sheet, is_deactivated'
  )

  const metrics = buildCrmMetrics(rows)

  const restaurants = rows
    .map((row: any) => ({
      ...row,
      lead_status: normalizeStatus(row.lead_status, row.converted),
    }))
    .sort((a: any, b: any) => {
      const aa = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const bb = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return bb - aa
    })

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Restaurants
          </h1>
          <p className="mt-1 sm:mt-2 text-sm text-slate-500">
            Track restaurants, owners, assignments, and follow-ups
          </p>
        </div>

        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Restaurants
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">
              {metrics.total}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Converted Till Date
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-emerald-600">
              {metrics.convertedTillDate}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
              Agreed Till Date
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-teal-600">
              {metrics.agreedTillDate}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
              Unassigned
            </div>
            <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-amber-600">
              {metrics.unassigned}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="hidden lg:grid grid-cols-14 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="col-span-4">Restaurant</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-2">Follow-up</div>
          <div className="col-span-2">Phone</div>
        </div>

        {restaurants.length === 0 ? (
          <div className="px-6 py-12 text-sm text-slate-500">No restaurants found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {restaurants.slice(0, 300).map((restaurant: any) => (
              <div key={restaurant.id} className="w-full text-left">
                <div className="hidden lg:grid grid-cols-14 items-center px-6 py-4 hover:bg-slate-50 transition">
                  <div className="col-span-4 pr-4">
                    <div className="text-[15px] font-semibold text-slate-900">
                      {restaurant.restaurant_name || '—'}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {[restaurant.area, restaurant.city].filter(Boolean).join(', ') || 'No location'}
                    </div>
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {restaurant.owner_name || '—'}
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                        restaurant.lead_status
                      )}`}
                    >
                      {restaurant.lead_status || 'Unknown'}
                    </span>
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {restaurant.assigned_to_name || 'Unassigned'}
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {formatFollowUpDate(restaurant.follow_up_date)}
                  </div>

                  <div className="col-span-2 text-sm text-slate-700">
                    {restaurant.phone || '—'}
                  </div>
                </div>

                <div className="lg:hidden px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-slate-900 leading-tight">
                        {restaurant.restaurant_name || '—'}
                      </div>
                      <div className="mt-1 text-[13px] text-slate-500 leading-snug">
                        {restaurant.owner_name || 'No owner'}
                        {' · '}
                        {[restaurant.area, restaurant.city].filter(Boolean).join(', ') || 'No location'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex-shrink-0 mt-0.5 ${getStatusClasses(
                        restaurant.lead_status
                      )}`}
                    >
                      {restaurant.lead_status || '—'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                    {restaurant.assigned_to_name && <span>{restaurant.assigned_to_name}</span>}
                    {restaurant.phone && <span>{restaurant.phone}</span>}
                    {restaurant.follow_up_date && <span>{formatFollowUpDate(restaurant.follow_up_date)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {restaurants.length > 300 && (
          <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
            Showing first 300 restaurants for speed. We can add server-side filters next.
          </div>
        )}
      </div>
    </div>
  )
}
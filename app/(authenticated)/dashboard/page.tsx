import { createClient } from '@supabase/supabase-js'

type LeadRow = {
  lead_status: string | null
}

type RecentRestaurant = {
  id: string
  restaurant_name: string | null
  owner_name: string | null
  lead_status: string | null
  assigned_to_name: string | null
  updated_at: string | null
}

type ActivityRow = {
  id: number
  restaurant_id: string | null
  action_type: string | null
  action_details: string | null
  performed_by: string | null
  created_at: string | null
  restaurants?: { restaurant_name?: string | null }[] | { restaurant_name?: string | null } | null
}

function timeAgo(d: string | null): string {
  if (!d) return '—'
  const now = new Date()
  const diff = now.getTime() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(d).toLocaleDateString()
}

function getRestaurantName(restaurants: ActivityRow['restaurants']) {
  if (!restaurants) return 'Restaurant'
  if (Array.isArray(restaurants)) return restaurants[0]?.restaurant_name || 'Restaurant'
  return restaurants.restaurant_name || 'Restaurant'
}

function statusPill(status: string | null) {
  const s = (status || '').toLowerCase()
  const map: Record<string, { bg: string; color: string }> = {
    lead: { bg: '#E8E4DE', color: '#6B6560' },
    contacted: { bg: '#DBEAFE', color: '#1E40AF' },
    interested: { bg: '#FEF3C7', color: '#92400E' },
    negotiation: { bg: '#EDE9FE', color: '#5B21B6' },
    won: { bg: '#D1FAE5', color: '#065F46' },
    lost: { bg: '#FEE2E2', color: '#991B1B' },
    converted: { bg: '#CFFAFE', color: '#155E75' },
    'not interested': { bg: '#F3F4F6', color: '#6B7280' },
  }
  const c = map[s] || { bg: '#E8E4DE', color: '#6B6560' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.color,
          display: 'inline-block',
        }}
      />
      {status || '—'}
    </span>
  )
}

function statCard(label: string, value: number, accent: string) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
        }}
      />
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-tertiary)',
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: allLeads }, { data: recentRestaurants }, { data: recentActivity }] = await Promise.all([
    supabase.from('restaurants').select('lead_status'),
    supabase
      .from('restaurants')
      .select('id, restaurant_name, owner_name, lead_status, assigned_to_name, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(10),
    supabase
      .from('activity_logs')
      .select('id, restaurant_id, action_type, action_details, performed_by, created_at, restaurants(restaurant_name)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const leads = (allLeads || []) as LeadRow[]
  const restaurants = (recentRestaurants || []) as RecentRestaurant[]
  const activity = (recentActivity || []) as ActivityRow[]

  const countByStatus = (status: string) =>
    leads.filter((x) => (x.lead_status || '').toLowerCase() === status.toLowerCase()).length

  return (
    <div style={{ padding: '32px 40px 60px', maxWidth: 1440, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
            }}
          >
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
            Sales pipeline overview & key metrics
          </p>
        </div>

        <form action="/api/sync" method="POST">
          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
            }}
          >
            ↻ Sync Sheets
          </button>
        </form>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {statCard('Total Leads', leads.length, 'var(--accent)')}
        {statCard('Contacted', countByStatus('Contacted'), '#3B82F6')}
        {statCard('Negotiation', countByStatus('Negotiation'), '#8B5CF6')}
        {statCard('Won', countByStatus('Won'), '#059669')}
        {statCard('Lost', countByStatus('Lost'), '#DC2626')}
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic' }}>
            Recent Activity
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Latest changes across your pipeline
          </div>
        </div>

        <div style={{ padding: '12px 24px 20px' }}>
          {activity.length > 0 ? (
            activity.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    background: '#F5E6D8',
                    color: '#C67A3C',
                  }}
                >
                  •
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <strong>{getRestaurantName(a.restaurants)}</strong> — {a.action_details || 'Activity updated'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {a.performed_by || 'System'} · {timeAgo(a.created_at)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No recent activity
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            padding: '22px 24px 18px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic' }}>
              Recently Updated
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Last 10 restaurants modified
            </div>
          </div>

          <a
            href="/restaurants"
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              background: 'none',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            View all →
          </a>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Restaurant', 'Owner', 'Status', 'Assigned To', 'Updated'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '13px 18px',
                      textAlign: 'left',
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-tertiary)',
                      background: 'var(--bg-table-header)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {restaurants.length > 0 ? (
                restaurants.map((r) => (
                  <tr key={r.id}>
                    <td style={tdStyle}>{r.restaurant_name || '—'}</td>
                    <td style={tdStyle}>{r.owner_name || '—'}</td>
                    <td style={tdStyle}>{statusPill(r.lead_status)}</td>
                    <td style={tdStyle}>{r.assigned_to_name || '—'}</td>
                    <td style={tdStyle}>{timeAgo(r.updated_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No restaurant data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const tdStyle: React.CSSProperties = {
  padding: '14px 18px',
  fontSize: 13.5,
  borderBottom: '1px solid var(--border-light)',
  verticalAlign: 'middle',
}
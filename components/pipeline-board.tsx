'use client'

type Restaurant = {
  id: string
  restaurant_name: string | null
  owner_name: string | null
  area: string | null
  city: string | null
  lead_status: string | null
  assigned_to_name: string | null
}

const COLUMNS = ['Lead', 'Contacted', 'Interested', 'Negotiation', 'Won', 'Lost']

const COLUMN_COLORS: Record<string, string> = {
  Lead: '#E8E4DE',
  Contacted: '#DBEAFE',
  Interested: '#FEF3C7',
  Negotiation: '#EDE9FE',
  Won: '#D1FAE5',
  Lost: '#FEE2E2',
}

export default function PipelineBoard({ restaurants }: { restaurants: Restaurant[] }) {
  return (
    <div style={{
      display: 'flex', gap: 16,
      overflowX: 'auto', paddingBottom: 16,
    }}>
      {COLUMNS.map((status) => {
        const items = restaurants.filter((r) => r.lead_status === status)
        return (
          <div
            key={status}
            style={{
              minWidth: 280, maxWidth: 300, flexShrink: 0,
              borderRadius: 14,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
            }}
          >
            {/* Column header */}
            <div style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-light)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{status}</span>
              <span style={{
                fontSize: 12, fontWeight: 600,
                background: 'var(--bg-card)', padding: '2px 9px',
                borderRadius: 999, color: 'var(--text-secondary)',
              }}>
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{
              padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
              maxHeight: '60vh', overflowY: 'auto',
            }}>
              {items.length > 0 ? items.slice(0, 25).map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 14,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    borderLeft: `3px solid ${COLUMN_COLORS[status] || 'var(--border)'}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>
                    {r.restaurant_name || 'Unnamed'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {r.owner_name || 'No owner'} · {r.area || r.city || ''}
                    {r.assigned_to_name && <><br />{r.assigned_to_name}</>}
                  </div>
                </div>
              )) : (
                <div style={{ padding: 12, color: 'var(--text-tertiary)', fontSize: 13 }}>
                  No restaurants
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/components/ui'

export default async function ActivityPage() {
  const supabase = createClient()

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('id, restaurant_id, action_type, action_details, performed_by, created_at, restaurants(restaurant_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const iconMap: Record<string, { cls: string; emoji: string }> = {
    status_change: { cls: 'activity-icon-status', emoji: '↻' },
    note_added: { cls: 'activity-icon-note', emoji: '✎' },
    assigned: { cls: 'activity-icon-assign', emoji: '→' },
    call_made: { cls: 'activity-icon-call', emoji: '✆' },
    document_uploaded: { cls: 'activity-icon-doc', emoji: '📎' },
  }

  return (
    <div style={{ padding: '32px 40px 60px', maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400,
          fontStyle: 'italic', letterSpacing: '-0.02em',
          color: 'var(--text-primary)', lineHeight: 1.15,
        }}>Activity Log</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Full audit trail of all CRM actions
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px' }}>
          {logs && logs.length > 0 ? logs.map((a: any) => {
            const ic = iconMap[a.action_type] || { cls: 'activity-icon-note', emoji: '•' }
            return (
              <div key={a.id} style={{
                display: 'flex', gap: 14, padding: '16px 0',
                borderBottom: '1px solid var(--border-light)',
              }}>
                <div className={ic.cls} style={{
                  width: 32, height: 32, flexShrink: 0, borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>{ic.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <strong>{a.restaurants?.restaurant_name || 'Restaurant'}</strong> — {a.action_details}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {a.performed_by} · {timeAgo(a.created_at)}
                  </div>
                </div>
              </div>
            )
          }) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No activity recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

// ─── Status Badge ───
export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: 'var(--text-tertiary)', fontSize: 12.5 }}>—</span>
  const cls = status.toLowerCase().replace(/\s+/g, '-')
  return (
    <span
      className={`badge-${cls}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 11px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 550,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        className={`badge-${cls}`}
        style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  )
}

// ─── Priority Badge ───
export function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span style={{ color: 'var(--text-tertiary)', fontSize: 12.5 }}>—</span>
  const cls = priority.toLowerCase()
  return (
    <span
      className={`badge-priority-${cls}`}
      style={{
        display: 'inline-flex',
        padding: '4px 11px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 550,
      }}
    >
      {priority}
    </span>
  )
}

// ─── Stat Card ───
export function StatCard({
  label,
  value,
  accentColor,
  delay,
}: {
  label: string
  value: string | number
  accentColor?: string
  delay?: number
}) {
  return (
    <div
      className="animate-in"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 0.2s ease',
        animationDelay: delay ? `${delay * 0.05}s` : undefined,
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
      {accentColor && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: accentColor,
        }} />
      )}
      <div style={{
        fontSize: 12, fontWeight: 550,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--text-tertiary)',
        marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 36,
        fontStyle: 'italic',
        color: 'var(--text-primary)',
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  )
}

// ─── Page Header ───
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div style={{
      marginBottom: 32,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 20,
      flexWrap: 'wrap',
    }}>
      <div>
        <h1
          className="animate-in"
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
          {title}
        </h1>
        {subtitle && (
          <p className="animate-in delay-1" style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="animate-in delay-1" style={{ display: 'flex', gap: 10 }}>{children}</div>}
    </div>
  )
}

// ─── WhatsApp Link ───
export function WhatsAppLink({ phone }: { phone: string | null }) {
  if (!phone) return <span style={{ color: 'var(--text-tertiary)', fontSize: 12.5 }}>—</span>
  const clean = phone.replace(/\D/g, '')
  return (
    <a
      href={`https://wa.me/91${clean}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        color: '#25D366',
        fontWeight: 550,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        transition: 'opacity 0.12s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
    >
      📱 {phone}
    </a>
  )
}

// ─── Time Ago helper ───
export function timeAgo(d: string | null): string {
  if (!d) return ''
  const now = new Date()
  const diff = now.getTime() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Toast (client-side) ───
export function showToast(msg: string) {
  const existing = document.getElementById('tipplr-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'tipplr-toast'
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '14px 22px',
    borderRadius: '10px',
    background: '#1A1814',
    color: '#fff',
    fontSize: '13.5px',
    fontWeight: '500',
    fontFamily: 'var(--font-body)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: '1000',
    transform: 'translateY(0)',
    opacity: '1',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  })
  toast.textContent = msg
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(20px)'
    setTimeout(() => toast.remove(), 300)
  }, 2800)
}

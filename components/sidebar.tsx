'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

const NAV_MAIN = [
  {
    label: 'Dashboard', href: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Restaurants', href: '/restaurants',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <path d="M3 3h18v18H3z" rx="2" />
        <path d="M3 9h18M9 3v18" />
      </svg>
    ),
  },
  {
    label: 'My Day', href: '/pipeline',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: 'Bulk Assign', href: '/bulk-assign',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M19 8l2 2 4-4" />
      </svg>
    ),
  },
]

const NAV_MANAGE = [
  {
    label: 'Team', href: '/team',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: 'Reports', href: '/activity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'WA Digest', href: '/digest',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
]

export default function Sidebar({ userName, userRole }: { userName?: string; userRole?: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = (userName || 'U').charAt(0).toUpperCase()

  function renderLink(item: (typeof NAV_MAIN)[0]) {
    const active = pathname === item.href
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 10,
          color: active ? '#FFFFFF' : '#C8C2B8',
          background: active ? 'var(--bg-sidebar-active)' : 'transparent',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: active ? 600 : 450,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = 'var(--bg-sidebar-hover)'
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = 'transparent'
        }}
      >
        <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
        {item.label}
      </Link>
    )
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: 'none', position: 'fixed',
          top: 16, left: 16, zIndex: 200,
          width: 42, height: 42, borderRadius: 10,
          background: 'var(--bg-sidebar)', color: '#fff',
          border: 'none', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }}
        className="mobile-menu-btn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileOpen ? (
            <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 299 }} className="md:hidden" />
      )}

      <aside
        style={{
          width: 260, minWidth: 260,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-sidebar)',
          display: 'flex', flexDirection: 'column',
          height: '100vh', position: 'sticky', top: 0,
          zIndex: 300,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto',
        }}
        className={`sidebar-aside ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Brand */}
        <div style={{ padding: '28px 24px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, background: 'var(--accent)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', fontStyle: 'italic',
          }}>T</div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff',
            fontStyle: 'italic', letterSpacing: '-0.02em',
          }}>Tipplr</span>
        </div>

        {/* Main nav */}
        <div style={{ padding: '24px 24px 8px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5C574E' }}>
          Main
        </div>
        <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_MAIN.map(renderLink)}
        </nav>

        {/* Manage nav */}
        <div style={{ padding: '24px 24px 8px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5C574E' }}>
          Manage
        </div>
        <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_MANAGE.map(renderLink)}
        </nav>

        {/* User */}
        <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid var(--border-sidebar)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 999, background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: '#fff',
            }}>{initials}</div>
            <div>
              <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 500 }}>{userName || 'User'}</div>
              <div style={{ color: '#6B6560', fontSize: 11.5, marginTop: 1 }}>{userRole || 'Admin'}</div>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .mobile-menu-btn { display: flex !important; }
          .sidebar-aside { position: fixed !important; transform: translateX(-100%); height: 100vh; }
          .sidebar-aside.mobile-open { transform: translateX(0) !important; }
        }
      `}</style>
    </>
  )
}

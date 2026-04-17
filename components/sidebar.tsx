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
        <path d="M3 3h18v18H3z" />
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
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
          active
            ? 'bg-[#35302A] text-white font-semibold'
            : 'text-[#C8C2B8] hover:bg-[#2A2620] hover:text-[#E8E4DE] font-normal'
        }`}
      >
        <span className={active ? 'opacity-100' : 'opacity-70'}>{item.icon}</span>
        {item.label}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mobile-menu-btn fixed top-4 left-4 z-[200] w-10 h-10 rounded-xl items-center justify-center border-0 cursor-pointer"
        style={{ display: 'none', background: '#1A1814', color: '#fff' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileOpen ? (
            <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[299] md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-aside flex flex-col h-screen sticky top-0 z-[300] overflow-y-auto ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: 260,
          minWidth: 260,
          background: '#1A1814',
          borderRight: '1px solid #2A2620',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 pt-7 pb-2">
          <div
            className="flex items-center justify-center w-[38px] h-[38px] rounded-xl text-white text-xl"
            style={{ background: '#E07B39', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}
          >
            T
          </div>
          <span className="text-white text-xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
            Tipplr
          </span>
        </div>

        {/* Main nav */}
        <div className="px-6 pt-6 pb-2 text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: '#5C574E' }}>
          Main
        </div>
        <nav className="px-3 flex flex-col gap-0.5">
          {NAV_MAIN.map(renderLink)}
        </nav>

        {/* Manage nav */}
        <div className="px-6 pt-6 pb-2 text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: '#5C574E' }}>
          Manage
        </div>
        <nav className="px-3 flex flex-col gap-0.5">
          {NAV_MANAGE.map(renderLink)}
        </nav>

        {/* User */}
        <div className="mt-auto p-4" style={{ borderTop: '1px solid #2A2620' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div
              className="flex-shrink-0 flex items-center justify-center w-[34px] h-[34px] rounded-full text-white text-sm font-semibold"
              style={{ background: '#E07B39' }}
            >
              {initials}
            </div>
            <div>
              <div className="text-white text-[13.5px] font-medium">{userName || 'User'}</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: '#6B6560' }}>{userRole || 'Admin'}</div>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .mobile-menu-btn { display: flex !important; }
          .sidebar-aside {
            position: fixed !important;
            transform: translateX(-100%);
          }
          .sidebar-aside.mobile-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  )
}

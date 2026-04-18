'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/logout-button'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', section: 'Main' },
  { label: 'Restaurants', href: '/restaurants', section: 'Main' },
  { label: 'My Day', href: '/pipeline', section: 'Main' },
  { label: 'Bulk Assign', href: '/bulk-assign', section: 'Main' },
  { label: 'Team', href: '/team', section: 'Manage' },
  { label: 'Reports', href: '/activity', section: 'Manage' },
  { label: 'WA Digest', href: '/digest', section: 'Manage' },
]

export default function Sidebar() {
  const pathname = usePathname()

  const mainItems = navItems.filter((item) => item.section === 'Main')
  const manageItems = navItems.filter((item) => item.section === 'Manage')

  function renderItems(items: typeof navItems) {
    return items.map((item) => {
      const isActive = pathname === item.href

      return (
        <Link
          key={item.href}
          href={item.href}
          className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
            isActive
              ? 'bg-white/10 text-white'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          {item.label}
        </Link>
      )
    })
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[220px] flex-col border-r border-slate-800 bg-[#071120] text-white">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="text-2xl font-semibold text-white">Tipplr</div>
        <div className="mt-1 text-xs text-slate-400">Sales CRM</div>
      </div>

      <div className="flex-1 px-3 py-5 overflow-y-auto">
        <div className="mb-8">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Main
          </div>
          <nav className="space-y-2">{renderItems(mainItems)}</nav>
        </div>

        <div>
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Manage
          </div>
          <nav className="space-y-2">{renderItems(manageItems)}</nav>
        </div>
      </div>

      <div className="border-t border-slate-800 px-3 py-4">
        <LogoutButton />
      </div>
    </aside>
  )
}
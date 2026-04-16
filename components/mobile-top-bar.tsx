'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/sidebar'

export default function MobileTopBar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100"
        >
          <svg
            className="w-5 h-5 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <div className="text-base font-semibold text-slate-900">Tipplr</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 -mt-0.5">
            Sales CRM
          </div>
        </div>

        <div className="w-10" />
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full animate-slide-in-left">
            <Sidebar variant="drawer" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
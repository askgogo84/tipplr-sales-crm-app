import Sidebar from '@/components/sidebar'
import MobileTopBar from '@/components/mobile-top-bar'
import MobileBottomNav from '@/components/mobile-bottom-nav'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile top bar with hamburger - hidden on desktop */}
      <div className="lg:hidden">
        <MobileTopBar />
      </div>

      {/* Main content area */}
      <main className="lg:pl-[220px]">
        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">{children}</div>
      </main>

      {/* Mobile bottom navigation - hidden on desktop */}
      <div className="lg:hidden">
        <MobileBottomNav />
      </div>
    </div>
  )
}
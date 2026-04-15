import Sidebar from '@/components/sidebar'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="pl-[260px]">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
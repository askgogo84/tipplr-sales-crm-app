export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {children}
    </div>
  )
}
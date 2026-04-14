export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#0b0b0b', color: '#fff' }}>
        <nav
          style={{
            display: 'flex',
            gap: 20,
            padding: '14px 20px',
            borderBottom: '1px solid #222',
            background: '#111',
          }}
        >
          <a href="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</a>
          <a href="/restaurants" style={{ color: '#fff', textDecoration: 'none' }}>Restaurants</a>
          <a href="/team" style={{ color: '#fff', textDecoration: 'none' }}>Team</a>
        </nav>

        <div style={{ padding: 20 }}>{children}</div>
      </body>
    </html>
  )
}
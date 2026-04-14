import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tipplr Sales CRM',
  description: 'Internal sales CRM',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'Inter, Arial, sans-serif',
          background: '#0a0a0a',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <aside
            style={{
              width: 240,
              background: '#101010',
              borderRight: '1px solid #1f1f1f',
              padding: 20,
              position: 'sticky',
              top: 0,
              height: '100vh',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 26 }}>
              Tipplr CRM
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <a href="/dashboard" style={navLink}>Dashboard</a>
              <a href="/restaurants" style={navLink}>Restaurants</a>
              <a href="/team" style={navLink}>Team</a>
            </div>
          </aside>

          <main style={{ flex: 1, padding: 28 }}>{children}</main>
        </div>
      </body>
    </html>
  )
}

const navLink: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  padding: '12px 14px',
  borderRadius: 12,
  background: '#161616',
  border: '1px solid #232323',
}
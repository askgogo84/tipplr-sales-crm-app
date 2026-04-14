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
          fontFamily: 'Arial, sans-serif',
          background: '#0b0b0b',
          color: '#fff',
        }}
      >
        <nav
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #1f1f1f',
            background: '#101010',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>Tipplr Sales CRM</div>
          <a href="/dashboard" style={navLink}>Dashboard</a>
          <a href="/restaurants" style={navLink}>Restaurants</a>
          <a href="/team" style={navLink}>Team</a>
        </nav>

        <div style={{ padding: 24 }}>{children}</div>
      </body>
    </html>
  )
}

const navLink: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  opacity: 0.85,
}
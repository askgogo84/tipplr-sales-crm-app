import './globals.css'

export const metadata = {
  title: 'Tipplr CRM',
  description: 'Tipplr sales CRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
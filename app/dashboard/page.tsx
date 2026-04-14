import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import LogoutButton from '@/components/logout-button'

export default async function DashboardPage() {
  const authClient = await createServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase.from('restaurants').select('lead_status')

  const total = data?.length || 0
  const lead = data?.filter((x) => x.lead_status === 'Lead').length || 0
  const contacted = data?.filter((x) => x.lead_status === 'Contacted').length || 0
  const negotiation = data?.filter((x) => x.lead_status === 'Negotiation').length || 0
  const won = data?.filter((x) => x.lead_status === 'Won').length || 0

  return (
    <main>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 30 }}>Dashboard</h1>
          <p style={{ marginTop: 8, opacity: 0.72 }}>Welcome, {user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(160px, 1fr))',
          gap: 16,
        }}
      >
        <Card title="Total Leads" value={String(total)} />
        <Card title="Lead" value={String(lead)} />
        <Card title="Contacted" value={String(contacted)} />
        <Card title="Negotiation" value={String(negotiation)} />
        <Card title="Won" value={String(won)} />
      </div>
    </main>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #131313 0%, #0d0d0d 100%)',
        border: '1px solid #222',
        borderRadius: 18,
        padding: 18,
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ opacity: 0.65, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 800 }}>{value}</div>
    </div>
  )
}
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <LogoutButton />
    </main>
  )
}
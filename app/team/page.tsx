import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Team</h1>
      <p>This page will show team members.</p>
    </main>
  )
}
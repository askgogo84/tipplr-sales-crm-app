import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import TeamManager from '@/components/team-manager'

type Profile = {
  id: number
  full_name: string
  email: string
  role: string | null
}

export default async function TeamPage() {
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

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('full_name', { ascending: true })

  if (error) {
    return <main style={{ padding: 24 }}>Error loading team page</main>
  }

  return (
    <main>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 8, fontSize: 30 }}>Team</h1>
        <p style={{ opacity: 0.7, marginTop: 0 }}>
          Add members here and use them as assignees inside the CRM.
        </p>
      </div>

      <TeamManager initialData={(data || []) as Profile[]} />
    </main>
  )
}
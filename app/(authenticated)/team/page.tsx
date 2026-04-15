import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui'
import TeamClient from '@/components/team-client'

type Profile = {
  id: number
  full_name: string
  email: string
  role: string | null
}

export default async function TeamPage() {
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('full_name', { ascending: true })

  if (error) {
    return (
      <div style={{ padding: '32px 40px' }}>
        <PageHeader title="Team" subtitle="Error loading team data" />
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 40px 60px', maxWidth: 1440, margin: '0 auto' }}>
      <PageHeader title="Team" subtitle="Manage your sales team members and assignees" />
      <TeamClient initialData={(data || []) as Profile[]} />
    </div>
  )
}

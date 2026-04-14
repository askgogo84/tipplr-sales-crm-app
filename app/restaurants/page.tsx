import { redirect } from 'next/navigation'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient as createPublicSupabase } from '@supabase/supabase-js'

export default async function RestaurantsPage() {
  const authSupabase = await createServerSupabase()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createPublicSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .limit(50)

  if (error) {
    return <main style={{ padding: 24 }}>Error loading restaurants</main>
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Restaurants ({data?.length ?? 0})</h1>
      {data?.map((r: any) => (
        <div key={r.id ?? r.restaurant_name} style={{ marginBottom: 16 }}>
          <b>{r.restaurant_name}</b>
          <div>{r.owner_name}</div>
          <div>{r.phone}</div>
          <div>{r.lead_status}</div>
        </div>
      ))}
    </main>
  )
}
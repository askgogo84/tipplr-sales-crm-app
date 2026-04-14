import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'
import RestaurantsTable from '@/components/restaurants-table'

type Restaurant = {
  id?: number | string
  restaurant_name: string
  owner_name: string | null
  phone: string | null
  lead_status: string | null
  assigned_to_name: string | null
}

export default async function RestaurantsPage() {
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
    .from('restaurants')
    .select('id, restaurant_name, owner_name, phone, lead_status, assigned_to_name')
    .order('restaurant_name', { ascending: true })
    .limit(300)

  if (error) {
    return <main style={{ padding: 24 }}>Error loading restaurants</main>
  }

  const restaurants = (data || []) as Restaurant[]

  return (
    <main>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 8 }}>Restaurants CRM</h1>
        <p style={{ opacity: 0.7 }}>
          Search, filter, update status, and assign leads.
        </p>
      </div>

      <RestaurantsTable initialData={restaurants} />
    </main>
  )
}
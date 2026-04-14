import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'

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
    .limit(100)

  if (error) {
    return <main>Error loading restaurants</main>
  }

  const restaurants = (data || []) as Restaurant[]

  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>Restaurants ({restaurants.length})</h1>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#111',
            border: '1px solid #222',
          }}
        >
          <thead>
            <tr style={{ background: '#1a1a1a' }}>
              <th style={th}>Restaurant</th>
              <th style={th}>Owner</th>
              <th style={th}>Phone</th>
              <th style={th}>Status</th>
              <th style={th}>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id ?? r.restaurant_name}>
                <td style={td}>{r.restaurant_name}</td>
                <td style={td}>{r.owner_name || '-'}</td>
                <td style={td}>{r.phone || '-'}</td>
                <td style={td}>{r.lead_status || '-'}</td>
                <td style={td}>{r.assigned_to_name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: 12,
  borderBottom: '1px solid #222',
}

const td: React.CSSProperties = {
  padding: 12,
  borderBottom: '1px solid #1b1b1b',
}
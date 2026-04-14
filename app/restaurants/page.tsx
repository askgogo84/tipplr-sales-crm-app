import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function RestaurantsPage() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .limit(50)

  if (error) {
    return <div>Error loading restaurants</div>
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Restaurants ({data.length})</h1>

      {data.map((r) => (
        <div key={r.id} style={{ marginBottom: 12 }}>
          <b>{r.restaurant_name}</b>
          <div>{r.owner_name}</div>
          <div>{r.phone}</div>
          <div>{r.lead_status}</div>
        </div>
      ))}
    </main>
  )
}
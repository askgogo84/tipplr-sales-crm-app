import { createClient } from '@supabase/supabase-js'
import RestaurantsClient from '../../../components/restaurants-client'

export default async function RestaurantsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: profiles } = await supabase
    .from('profiles')
    .select('full_name')
    .order('full_name', { ascending: true })

  const assigneeOptions = ['Unassigned', ...(profiles?.map((p) => p.full_name) || [])]

  return <RestaurantsClient assigneeOptions={assigneeOptions} />
}
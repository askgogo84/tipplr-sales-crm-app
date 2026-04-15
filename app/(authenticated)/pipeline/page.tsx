import { createClient } from '@/lib/supabase/server'
import PipelineBoard from '@/components/pipeline-board'

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select(
      'id, restaurant_name, owner_name, phone, area, city, lead_status, assigned_to_name, priority'
    )
    .order('updated_at', { ascending: false, nullsFirst: false })

  return (
    <div style={{ padding: '32px 40px 60px', maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
          }}
        >
          Pipeline
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Visual overview of your sales funnel
        </p>
      </div>
      <PipelineBoard restaurants={restaurants || []} />
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Restaurant = {
  id: string
  restaurant_name: string
  owner_name: string | null
  phone: string | null
  area: string | null
  city: string | null
  lead_status: string | null
  assigned_to_name: string | null
  remarks: string | null
}

const stageOptions = ['All', 'Lead', 'Contacted', 'Negotiation', 'Onboarded', 'Lost', 'Hold']
const editableStageOptions = ['Lead', 'Contacted', 'Negotiation', 'Onboarded', 'Lost', 'Hold']

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [editedRemarks, setEditedRemarks] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadRestaurants() {
      const { data, error } = await supabase
        .from('restaurants')
        .select(
          'id, restaurant_name, owner_name, phone, area, city, lead_status, assigned_to_name, remarks'
        )
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const rows = data || []
      setRestaurants(rows)

      const initialRemarks: Record<string, string> = {}
      rows.forEach((row) => {
        initialRemarks[row.id] = row.remarks || ''
      })
      setEditedRemarks(initialRemarks)

      setLoading(false)
    }

    loadRestaurants()
  }, [])

  function handleLocalChange(id: string, value: string) {
    setEditedRemarks((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  async function handleUpdateStatus(id: string, newStatus: string) {
    setSavingId(id)
    setError(null)

    const { error } = await supabase
      .from('restaurants')
      .update({ lead_status: newStatus })
      .eq('id', id)

    if (error) {
      setError(`Failed to update status: ${error.message}`)
      setSavingId(null)
      return
    }

    setRestaurants((prev) =>
      prev.map((restaurant) =>
        restaurant.id === id
          ? { ...restaurant, lead_status: newStatus }
          : restaurant
      )
    )

    setSavingId(null)
  }

  async function handleSaveRemarks(id: string) {
    setSavingId(id)
    setError(null)

    const newRemarks = editedRemarks[id] ?? ''

    const { error } = await supabase
      .from('restaurants')
      .update({ remarks: newRemarks })
      .eq('id', id)

    if (error) {
      setError(`Failed to save remarks: ${error.message}`)
      setSavingId(null)
      return
    }

    setRestaurants((prev) =>
      prev.map((restaurant) =>
        restaurant.id === id
          ? { ...restaurant, remarks: newRemarks }
          : restaurant
      )
    )

    setSavingId(null)
  }

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesStage =
        stageFilter === 'All' || restaurant.lead_status === stageFilter

      const q = search.toLowerCase().trim()
      const matchesSearch =
        q === '' ||
        restaurant.restaurant_name.toLowerCase().includes(q) ||
        (restaurant.owner_name || '').toLowerCase().includes(q) ||
        (restaurant.phone || '').toLowerCase().includes(q) ||
        (restaurant.area || '').toLowerCase().includes(q) ||
        (restaurant.city || '').toLowerCase().includes(q)

      return matchesStage && matchesSearch
    })
  }, [restaurants, search, stageFilter])

  const total = restaurants.length
  const leadCount = restaurants.filter((r) => r.lead_status === 'Lead').length
  const contactedCount = restaurants.filter((r) => r.lead_status === 'Contacted').length
  const negotiationCount = restaurants.filter((r) => r.lead_status === 'Negotiation').length
  const onboardedCount = restaurants.filter((r) => r.lead_status === 'Onboarded').length

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b0b0b',
        color: '#ffffff',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>Tipplr Sales CRM</h1>
            <p style={{ margin: 0, color: '#cfcfcf' }}>Live dashboard from Supabase</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/restaurants"
              style={{
                textDecoration: 'none',
                background: '#2563eb',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              Open Restaurants CRM
            </Link>

            <Link
              href="/team"
              style={{
                textDecoration: 'none',
                background: '#1f2937',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              Team
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <SummaryCard title="Total" value={total} />
          <SummaryCard title="Lead" value={leadCount} />
          <SummaryCard title="Contacted" value={contactedCount} />
          <SummaryCard title="Negotiation" value={negotiationCount} />
          <SummaryCard title="Onboarded" value={onboardedCount} />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurant, owner, phone, area, city"
            style={{
              flex: '1 1 320px',
              minWidth: '280px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #333',
              background: '#151515',
              color: '#fff',
              outline: 'none',
            }}
          />

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #333',
              background: '#151515',
              color: '#fff',
              minWidth: '180px',
            }}
          >
            {stageOptions.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        {loading && <p>Loading restaurants...</p>}

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#2a1111',
              border: '1px solid #5a2323',
              color: '#ff9b9b',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filteredRestaurants.length === 0 && (
          <div
            style={{
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            No restaurants found.
          </div>
        )}

        {!loading && filteredRestaurants.length > 0 && (
          <div
            style={{
              overflowX: 'auto',
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: '14px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '1180px',
              }}
            >
              <thead>
                <tr style={{ background: '#111111' }}>
                  <Th>Restaurant</Th>
                  <Th>Owner</Th>
                  <Th>Phone</Th>
                  <Th>Area</Th>
                  <Th>City</Th>
                  <Th>Status</Th>
                  <Th>Assigned To</Th>
                  <Th>Remarks</Th>
                </tr>
              </thead>
              <tbody>
                {filteredRestaurants.map((restaurant) => (
                  <tr key={restaurant.id} style={{ borderTop: '1px solid #2a2a2a' }}>
                    <Td strong>{restaurant.restaurant_name}</Td>
                    <Td>{restaurant.owner_name || '-'}</Td>
                    <Td>{restaurant.phone || '-'}</Td>
                    <Td>{restaurant.area || '-'}</Td>
                    <Td>{restaurant.city || '-'}</Td>

                    <Td>
                      <select
                        value={restaurant.lead_status || 'Lead'}
                        onChange={(e) =>
                          handleUpdateStatus(restaurant.id, e.target.value)
                        }
                        disabled={savingId === restaurant.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: '#111',
                          color: '#fff',
                          border: '1px solid #333',
                          minWidth: '140px',
                        }}
                      >
                        {editableStageOptions.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </Td>

                    <Td>{restaurant.assigned_to_name || '-'}</Td>

                    <Td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          value={editedRemarks[restaurant.id] ?? ''}
                          onChange={(e) =>
                            handleLocalChange(restaurant.id, e.target.value)
                          }
                          placeholder="Add remarks"
                          style={{
                            width: '100%',
                            minWidth: '220px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: '#111',
                            color: '#fff',
                            border: '1px solid #333',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => handleSaveRemarks(restaurant.id)}
                          disabled={savingId === restaurant.id}
                          style={{
                            alignSelf: 'flex-start',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: savingId === restaurant.id ? '#333' : '#2563eb',
                            color: '#fff',
                            border: 'none',
                            cursor: savingId === restaurant.id ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {savingId === restaurant.id ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: '#161616',
        border: '1px solid #2a2a2a',
        borderRadius: '14px',
        padding: '18px',
      }}
    >
      <div style={{ fontSize: '14px', color: '#bdbdbd', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '14px',
        fontSize: '13px',
        color: '#bdbdbd',
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  strong = false,
}: {
  children: React.ReactNode
  strong?: boolean
}) {
  return (
    <td
      style={{
        padding: '14px',
        fontSize: '14px',
        color: '#ffffff',
        fontWeight: strong ? 700 : 400,
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  )
}
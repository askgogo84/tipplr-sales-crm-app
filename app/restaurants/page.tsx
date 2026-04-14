'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  assigned_user_id: string | null
  remarks: string | null
}

type User = {
  id: string
  name: string
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('realtime-restaurants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurants',
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadData() {
    const { data: restData } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: userData } = await supabase
      .from('users')
      .select('id, name')

    setRestaurants(restData || [])
    setUsers(userData || [])
    setLoading(false)
  }

  async function updateRestaurant(
    id: string,
    updates: Partial<Restaurant>
  ) {
    await supabase.from('restaurants').update(updates).eq('id', id)
    loadData()
  }

  return (
    <main style={mainStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={headerStyle}>
          <h1 style={{ margin: 0 }}>Restaurants CRM</h1>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/" style={buttonBlue}>
              Back to Dashboard
            </Link>

            <Link href="/team" style={buttonDark}>
              Team
            </Link>
          </div>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Restaurant</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
                <Th>Assign</Th>
                <Th>Remarks</Th>
                <Th>Action</Th>
              </tr>
            </thead>

            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <Td strong>{r.restaurant_name}</Td>
                  <Td>{r.owner_name || '-'}</Td>

                  <Td>
                    <select
                      value={r.lead_status || 'Lead'}
                      onChange={(e) =>
                        updateRestaurant(r.id, {
                          lead_status: e.target.value,
                        })
                      }
                      style={inputStyle}
                    >
                      <option value="Lead">Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Onboarded">Onboarded</option>
                    </select>
                  </Td>

                  <Td>
                    <select
                      value={r.assigned_user_id || ''}
                      onChange={(e) =>
                        updateRestaurant(r.id, {
                          assigned_user_id: e.target.value || null,
                        })
                      }
                      style={inputStyle}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Td>

                  <Td>
                    <input
                      defaultValue={r.remarks || ''}
                      onBlur={(e) =>
                        updateRestaurant(r.id, {
                          remarks: e.target.value,
                        })
                      }
                      style={inputStyle}
                    />
                  </Td>

                  <Td>
                    <button style={buttonGreen} type="button">
                      Saved
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}

/* styles */

const mainStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0b0b0b',
  color: '#fff',
  padding: '24px',
  fontFamily: 'Arial, sans-serif',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  gap: '16px',
  flexWrap: 'wrap',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  background: '#111',
  borderRadius: '12px',
  overflow: 'hidden',
}

const inputStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #333',
  background: '#111',
  color: '#fff',
}

const buttonBlue: React.CSSProperties = {
  background: '#2563eb',
  padding: '10px 14px',
  borderRadius: '8px',
  color: '#fff',
  textDecoration: 'none',
}

const buttonDark: React.CSSProperties = {
  background: '#1f2937',
  padding: '10px 14px',
  borderRadius: '8px',
  color: '#fff',
  textDecoration: 'none',
}

const buttonGreen: React.CSSProperties = {
  background: '#22c55e',
  padding: '6px 10px',
  borderRadius: '6px',
  border: 'none',
  color: '#fff',
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '12px',
        color: '#bbb',
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
        padding: '12px',
        fontWeight: strong ? 600 : 400,
        borderTop: '1px solid #222',
      }}
    >
      {children}
    </td>
  )
}
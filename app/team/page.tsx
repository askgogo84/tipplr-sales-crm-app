'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type User = {
  id: string
  name: string
  role: string | null
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [role, setRole] = useState('Sales')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setUsers(data || [])
    setLoading(false)
  }

  async function addUser() {
    if (!name.trim()) return

    const { error } = await supabase.from('users').insert([
      {
        name: name.trim(),
        role,
      },
    ])

    if (error) {
      setError(error.message)
      return
    }

    setName('')
    setRole('Sales')
    loadUsers()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b0b0b',
        color: '#fff',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '24px',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <h1 style={{ margin: 0 }}>Team Management</h1>

          <Link
            href="/"
            style={{
              background: '#2563eb',
              padding: '10px 14px',
              borderRadius: '8px',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: '#2a1111',
              color: '#ffb3b3',
              border: '1px solid #5a2323',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: '#161616',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <h3>Add Team Member</h3>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
            >
              <option value="Sales">Sales</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>

            <button onClick={addUser} style={buttonStyle} type="button">
              Add
            </button>
          </div>
        </div>

        <div
          style={{
            background: '#161616',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <h3>Team Members</h3>

          {loading && <p>Loading...</p>}

          {!loading && users.length === 0 && <p>No team members found.</p>}

          {!loading &&
            users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #2a2a2a',
                }}
              >
                <strong>{user.name}</strong> — {user.role || 'Sales'}
              </div>
            ))}
        </div>
      </div>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #333',
  background: '#111',
  color: '#fff',
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: '#22c55e',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
}
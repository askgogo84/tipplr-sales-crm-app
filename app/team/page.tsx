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

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setUsers(data || [])
    setLoading(false)
  }

  async function addUser() {
    if (!name) return

    const { error } = await supabase.from('users').insert([
      {
        name,
        role,
      },
    ])

    if (error) {
      setError(error.message)
      return
    }

    setName('')
    loadUsers()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b0b0b',
        color: '#fff',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h1>Team Management</h1>

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

        {/* ADD USER */}
        <div
          style={{
            background: '#161616',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <h3>Add Team Member</h3>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
              <option>Sales</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>

            <button onClick={addUser} style={buttonStyle}>
              Add
            </button>
          </div>
        </div>

        {/* USERS LIST */}
        <div
          style={{
            background: '#161616',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <h3>Team Members</h3>

          {loading && <p>Loading...</p>}

          {!loading &&
            users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #2a2a2a',
                }}
              >
                <strong>{user.name}</strong> — {user.role}
              </div>
            ))}
        </div>
      </div>
    </main>
  )
}

const inputStyle = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #333',
  background: '#111',
  color: '#fff',
}

const buttonStyle = {
  padding: '10px 14px',
  background: '#22c55e',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
}
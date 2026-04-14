'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 24,
          border: '1px solid #ddd',
          borderRadius: 12,
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Tipplr CRM Login</h1>
        <p style={{ marginBottom: 20 }}>Sign in with your work email.</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              border: '1px solid #ccc',
              borderRadius: 8,
              marginBottom: 12,
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              border: '1px solid #ccc',
              borderRadius: 8,
              marginBottom: 12,
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
      </div>
    </main>
  )
}
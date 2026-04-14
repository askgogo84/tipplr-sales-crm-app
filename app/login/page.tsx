'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Magic link sent. Check your email.')
    }

    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24, border: '1px solid #ddd', borderRadius: 12 }}>
        <h1 style={{ marginBottom: 8 }}>Tipplr CRM Login</h1>
        <p style={{ marginBottom: 20 }}>Use your work email to sign in.</p>

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
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>

        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
      </div>
    </main>
  )
}
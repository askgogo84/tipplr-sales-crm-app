'use client'

import { useState } from 'react'
import { createClientBrowser } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientBrowser()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: 'var(--bg-input)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '48px 40px',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: 'var(--accent)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              color: '#fff',
              fontStyle: 'italic',
            }}
          >
            T
          </div>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          Tipplr CRM
        </div>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 14,
            marginBottom: 36,
          }}
        >
          Sign in to your sales dashboard
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#FEE2E2',
              color: '#991B1B',
              fontSize: 13,
              marginBottom: 20,
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@tipplr.in"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
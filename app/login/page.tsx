'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#FAF8F5', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#fff',
        border: '1px solid #E8E4DE', borderRadius: 20,
        padding: '48px 40px', boxShadow: '0 12px 40px rgba(26,24,20,0.1)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 44, height: 44, background: '#C67A3C', borderRadius: 12,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 24, color: '#fff', fontStyle: 'italic', marginBottom: 8,
        }}>T</div>

        <div style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 32, fontStyle: 'italic', color: '#1A1814', marginBottom: 6,
        }}>Tipplr CRM</div>

        <p style={{ color: '#6B6560', fontSize: 14, marginBottom: 36 }}>
          Sign in to your sales dashboard
        </p>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: '#FEE2E2', color: '#991B1B',
            fontSize: 13, marginBottom: 20, textAlign: 'left',
          }}>{error}</div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: '#9C9690', marginBottom: 6,
            }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@tipplr.in" required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #E8E4DE',
                borderRadius: 10, fontSize: 14, color: '#1A1814',
                background: '#F5F3F0', outline: 'none',
              }} />
          </div>
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: '#9C9690', marginBottom: 6,
            }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="........" required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #E8E4DE',
                borderRadius: 10, fontSize: 14, color: '#1A1814',
                background: '#F5F3F0', outline: 'none',
              }} />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px 18px', borderRadius: 10,
            border: 'none', background: '#C67A3C', color: '#fff',
            cursor: loading ? 'wait' : 'pointer', fontSize: 14,
            fontWeight: 600, marginTop: 8, opacity: loading ? 0.7 : 1,
          }}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  )
}
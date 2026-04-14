'use client'

import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={logout}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid #2a2a2a',
        background: '#111',
        color: '#fff',
        cursor: 'pointer',
      }}
    >
      Logout
    </button>
  )
}
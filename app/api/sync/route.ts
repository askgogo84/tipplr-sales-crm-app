import { JWT } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// ✅ FIXED FUNCTION (THIS WAS YOUR ERROR)
function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

export async function GET() {
  try {
    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!GOOGLE_SHEET_ID) {
      return Response.json({ success: false, error: 'Missing GOOGLE_SHEET_ID' }, { status: 500 })
    }

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      return Response.json({ success: false, error: 'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL' }, { status: 500 })
    }

    if (!GOOGLE_PRIVATE_KEY) {
      return Response.json({ success: false, error: 'Missing GOOGLE_PRIVATE_KEY' }, { status: 500 })
    }

    if (!SUPABASE_URL) {
      return Response.json({ success: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim(),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const tokenResponse = await withTimeout(auth.authorize(), 10000, 'Google auth')
    const accessToken = tokenResponse.access_token

    if (!accessToken) {
      return Response.json({ success: false, error: 'Failed to get access token' }, { status: 500 })
    }

    const range = encodeURIComponent("'Final List'!A2:K")

    const googleRes = await withTimeout(
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      10000,
      'Google fetch'
    )

    if (!googleRes.ok) {
      const text = await googleRes.text()
      return Response.json({ success: false, error: text }, { status: 500 })
    }

    const data = await googleRes.json()
    const rows = data.values || []

    let syncedCount = 0

    for (const row of rows) {
      const restaurant_name = row[0]?.trim()
      if (!restaurant_name) continue

      const payload = {
        restaurant_name,
        owner_name: row[4] || null,
        phone: row[6] || null,
        city: 'Bengaluru',
        lead_status: row[8]?.toLowerCase() === 'yes' ? 'Contacted' : 'Lead',
        assigned_to_name: row[9] || null,
        remarks: null,
      }

      const result = await withTimeout(
        supabase.from('restaurants').upsert(payload, { onConflict: 'restaurant_name' }),
        10000,
        'Supabase upsert'
      )

      const error =
        result && typeof result === 'object' && 'error' in result ? result.error : null

      if (!error) syncedCount++
    }

    return Response.json({
      success: true,
      rows_fetched: rows.length,
      rows_synced: syncedCount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
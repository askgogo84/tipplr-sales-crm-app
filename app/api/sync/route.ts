import { JWT } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)

    promise
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
      return Response.json({ success: false, step: 'env', error: 'Missing GOOGLE_SHEET_ID' }, { status: 500 })
    }

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      return Response.json(
        { success: false, step: 'env', error: 'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL' },
        { status: 500 }
      )
    }

    if (!GOOGLE_PRIVATE_KEY) {
      return Response.json({ success: false, step: 'env', error: 'Missing GOOGLE_PRIVATE_KEY' }, { status: 500 })
    }

    if (!SUPABASE_URL) {
      return Response.json({ success: false, step: 'env', error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { success: false, step: 'env', error: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    console.log('STEP 1: env ok')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim(),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    console.log('STEP 2: requesting Google access token')

    const tokenResponse = await withTimeout(auth.authorize(), 10000, 'Google authorize')
    const accessToken = tokenResponse.access_token

    if (!accessToken) {
      return Response.json(
        { success: false, step: 'google_auth', error: 'Failed to get Google access token' },
        { status: 500 }
      )
    }

    console.log('STEP 3: token received')

    const range = encodeURIComponent("'Final List'!A2:K")
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    console.log('STEP 4: fetching Google Sheet rows')

    const googleRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeout))

    if (!googleRes.ok) {
      const errorText = await googleRes.text()
      return Response.json(
        {
          success: false,
          step: 'google_sheet_fetch',
          error: `Google Sheets API error: ${googleRes.status} ${errorText}`,
        },
        { status: 500 }
      )
    }

    const sheetData = (await googleRes.json()) as { values?: string[][] }
    const rows = sheetData.values || []

    console.log(`STEP 5: fetched ${rows.length} rows`)

    let syncedCount = 0
    const failedRows: Array<{ row: number; restaurant_name: string; error: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      const restaurant_name = String(row[0] ?? '').trim()
      const priority = String(row[1] ?? '').trim()
      const outlets = String(row[2] ?? '').trim()
      const pos = String(row[3] ?? '').trim()
      const brand_contact_person = String(row[4] ?? '').trim()
      const designation = String(row[5] ?? '').trim()
      const contact_no = String(row[6] ?? '').trim()
      const zomato_page_number = String(row[7] ?? '').trim()
      const contacted = String(row[8] ?? '').trim()
      const tipplr_executive_name = String(row[9] ?? '').trim()
      const approached_on = String(row[10] ?? '').trim()

      if (!restaurant_name) continue

      const lead_status = contacted.toLowerCase() === 'yes' ? 'Contacted' : 'Lead'

      const remarksParts = [
        priority ? `Priority: ${priority}` : '',
        outlets ? `Outlets: ${outlets}` : '',
        pos ? `POS: ${pos}` : '',
        designation ? `Designation: ${designation}` : '',
        zomato_page_number ? `Zomato: ${zomato_page_number}` : '',
        approached_on ? `Approached On: ${approached_on}` : '',
      ].filter(Boolean)

      const payload = {
        restaurant_name,
        owner_name: brand_contact_person || null,
        phone: contact_no || null,
        area: null,
        city: 'Bengaluru',
        lead_status,
        assigned_to_name: tipplr_executive_name || null,
        remarks: remarksParts.length ? remarksParts.join(' | ') : null,
      }

      const { error } = await withTimeout(
        supabase.from('restaurants').upsert(payload, { onConflict: 'restaurant_name' }),
        10000,
        `Supabase upsert row ${i + 2}`
      )

      if (error) {
        failedRows.push({
          row: i + 2,
          restaurant_name,
          error: error.message,
        })
      } else {
        syncedCount += 1
      }
    }

    console.log('STEP 6: sync complete')

    return Response.json({
      success: true,
      rows_fetched: rows.length,
      rows_synced: syncedCount,
      failed_rows: failedRows,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return Response.json(
      {
        success: false,
        step: 'catch',
        error: message,
      },
      { status: 500 }
    )
  }
}
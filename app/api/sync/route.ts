import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    if (!process.env.GOOGLE_SHEET_ID) {
      return Response.json(
        { success: false, error: 'Missing GOOGLE_SHEET_ID' },
        { status: 500 }
      )
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      return Response.json(
        { success: false, error: 'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL' },
        { status: 500 }
      )
    }

    if (!process.env.GOOGLE_PRIVATE_KEY) {
      return Response.json(
        { success: false, error: 'Missing GOOGLE_PRIVATE_KEY' },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return Response.json(
        { success: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL' },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({
      version: 'v4',
      auth,
    })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'Final List'!A2:K",
    })

    const rows = response.data.values || []
    let syncedCount = 0

    for (const row of rows) {
      const restaurant_name = row[0]?.trim() || ''
      const priority = row[1]?.trim() || ''
      const outlets = row[2]?.trim() || ''
      const pos = row[3]?.trim() || ''
      const brand_contact_person = row[4]?.trim() || ''
      const designation = row[5]?.trim() || ''
      const contact_no = row[6]?.trim() || ''
      const zomato_page_number = row[7]?.trim() || ''
      const contacted = row[8]?.trim() || ''
      const tipplr_executive_name = row[9]?.trim() || ''
      const approached_on = row[10]?.trim() || ''

      if (!restaurant_name) continue

      const lead_status =
        contacted.toLowerCase() === 'yes' ? 'Contacted' : 'Lead'

      const remarksParts = [
        priority ? `Priority: ${priority}` : '',
        outlets ? `Outlets: ${outlets}` : '',
        pos ? `POS: ${pos}` : '',
        designation ? `Designation: ${designation}` : '',
        zomato_page_number ? `Zomato: ${zomato_page_number}` : '',
        approached_on ? `Approached On: ${approached_on}` : '',
      ].filter(Boolean)

      const remarks = remarksParts.join(' | ')

      const payload = {
        restaurant_name,
        owner_name: brand_contact_person || null,
        phone: contact_no || null,
        area: null,
        city: 'Bengaluru',
        lead_status,
        assigned_to_name: tipplr_executive_name || null,
        remarks: remarks || null,
      }

      const { error } = await supabase
        .from('restaurants')
        .upsert(payload, { onConflict: 'restaurant_name' })

      if (!error) {
        syncedCount += 1
      }
    }

    return Response.json({
      success: true,
      rows_fetched: rows.length,
      rows_synced: syncedCount,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'

    return Response.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
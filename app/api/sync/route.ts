import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // 🔐 Supabase setup
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ IMPORTANT
    )

    // 🔐 Google auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const client = await auth.getClient()

    const sheets = google.sheets({
      version: 'v4',
      auth: client,
    })

    // 📊 Fetch sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'Final List'!A2:K",
    })

    const rows = response.data.values || []

    // 🔁 Transform + insert into Supabase
    for (const row of rows) {
      const [
        restaurant_name,
        priority,
        outlets,
        pos,
        owner_name,
        designation,
        phone,
        zomato,
        contacted,
        assigned_to,
        date
      ] = row

      await supabase.from('restaurants').upsert({
        restaurant_name,
        owner_name: owner_name || '',
        phone: phone || '',
        area: '', // can enhance later
        city: 'Bengaluru',
        lead_status: contacted === 'Yes' ? 'Contacted' : 'Lead',
        assigned_to_name: assigned_to || 'Unassigned',
        remarks: `Priority: ${priority}`,
      }, { onConflict: 'restaurant_name' })
    }

    return Response.json({
      success: true,
      rows_synced: rows.length,
    })

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
    })
  }
}
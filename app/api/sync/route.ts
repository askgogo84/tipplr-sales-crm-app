import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type RestaurantPayload = {
  restaurant_name: string
  owner_name: string | null
  phone: string | null
  area: string | null
  city: string | null
  lead_status: string | null
  assigned_to_name: string | null
  remarks: string | null
  converted: string | null
  documents_received: string | null
  go_live_on_digihat: string | null
  go_live_date: string | null
  menu_pricing: string | null
  source_row_number: number
}

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL')
  }

  if (!privateKey) {
    throw new Error('Missing GOOGLE_PRIVATE_KEY')
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceRoleKey)
}

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID
    const sheetRange =
      process.env.GOOGLE_SHEET_RANGE || "'Final List'!A:Z"

    if (!sheetId) {
      return NextResponse.json(
        { success: false, error: 'Missing GOOGLE_SHEET_ID' },
        { status: 500 }
      )
    }

    const auth = getGoogleAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const supabase = getSupabase()

    const sheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetRange,
    })

    const values = sheetResponse.data.values || []

    if (values.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'No data rows found in sheet',
        inserted: 0,
        failed: 0,
        totalRowsRead: values.length,
      })
    }

    const rows = values.slice(1)

    let inserted = 0
    let failed = 0
    const errors: string[] = []

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      const source_row_number = index + 2

      const restaurant_name = row[0]?.toString().trim() || ''
      const brand_contact_person = row[1]?.toString().trim() || null
      const contact_no = row[2]?.toString().trim() || null
      const status = row[3]?.toString().trim() || null
      const tipplr_executive_name = row[4]?.toString().trim() || null
      const remarksRaw = row[5]?.toString().trim() || null
      const converted = row[6]?.toString().trim() || null
      const documents_received = row[7]?.toString().trim() || null
      const go_live_on_digihat = row[8]?.toString().trim() || null
      const go_live_date = row[9]?.toString().trim() || null
      const menu_pricing = row[10]?.toString().trim() || null

      if (!restaurant_name) {
        continue
      }

      const remarksParts = [remarksRaw].filter(Boolean)

      const payload: RestaurantPayload = {
        restaurant_name,
        owner_name: brand_contact_person,
        phone: contact_no,
        area: null,
        city: 'Bengaluru',
        lead_status: status || 'Lead',
        assigned_to_name: tipplr_executive_name,
        remarks: remarksParts.length ? remarksParts.join(' | ') : null,
        converted,
        documents_received,
        go_live_on_digihat,
        go_live_date,
        menu_pricing,
        source_row_number,
      }

      const { error } = await supabase
        .from('restaurants')
        .upsert(payload, {
          onConflict: 'source_row_number',
        })

      if (error) {
        failed++
        errors.push(`Row ${source_row_number}: ${error.message}`)
      } else {
        inserted++
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      failed,
      totalRowsRead: rows.length,
      errors: errors.slice(0, 20),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown sync error'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
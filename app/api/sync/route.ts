import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

function normalizeBoolean(value: string | null | undefined): boolean | null {
  if (!value) return null
  const v = String(value).trim().toLowerCase()
  if (['yes', 'y', 'true', '1', 'live'].includes(v)) return true
  if (['no', 'n', 'false', '0', 'not live'].includes(v)) return false
  return null
}

function clean(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

export async function GET() {
  return syncSheet()
}

export async function POST() {
  return syncSheet()
}

async function syncSheet() {
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

    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    )

    const sheets = google.sheets({ version: 'v4', auth })

    // Read spreadsheet metadata to get the first tab name
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    })

    const firstSheetTitle = meta.data.sheets?.[0]?.properties?.title
    if (!firstSheetTitle) {
      return Response.json(
        { success: false, error: 'Could not determine first sheet title' },
        { status: 500 }
      )
    }

    // Read first tab
    const sheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${firstSheetTitle}!A:Z`,
    })

    const rows = sheetResponse.data.values || []
    if (rows.length < 2) {
      return Response.json({
        success: true,
        message: 'No data rows found in sheet',
        synced: 0,
      })
    }

    const headers = rows[0].map((h) => String(h).trim())
    const dataRows = rows.slice(1)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    let synced = 0
    const errors: Array<{ row: number; error: string }> = []

    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index]
      const source_row_number = index + 2

      try {
        const record: Record<string, string> = {}
        headers.forEach((header, i) => {
          record[header] = row[i] || ''
        })

        // Sheet column mapping based on your screenshot/current sheet
        const restaurant_name = clean(record['Brand Name'])
        if (!restaurant_name) continue

        const priority = clean(record['Priority'])
        const outlets = clean(record['#Outlets'])
        const pos = clean(record['POS'])
        const brand_contact_person = clean(record['Brand Contact Person'])
        const designation = clean(record['Designation'])
        const contact_no = clean(record['Contact No'])
        const zomato_page_number = clean(record['Zomato Page Number'])
        const contacted = clean(record['Contacted'])
        const tipplr_executive_name = clean(record['Tipplr Executive Name'])
        const approached_on = clean(record['Approached On'])
        const converted = clean(record['Converted'])
        const documents_received = clean(record['Documents Received'])
        const go_live_on_digihat = clean(record['Go Live on Digibhaat']) || clean(record['Go Live on Digihat']) || clean(record['Go Live on Digilist'])
        const go_live_date = clean(record['Go Live Date'])
        const menu_pricing = clean(record['Menu Pricing'])
        const discount = clean(record['Discount'])
        const last_contacted_on = clean(record['Last Contacted On'])
        const reason = clean(record['Reason (if not agreeing on Menu Price/Offline menu)']) || clean(record['Reason'])
        const remarks = clean(record['Remarks (if any)'])
        const added_to_master = clean(record['Added to Master (ONDC Column)'])

        // Derive lead status smartly
        let lead_status = 'Lead'
        if (converted && converted.toLowerCase() === 'yes') {
          lead_status = 'Converted'
        } else if (contacted && contacted.toLowerCase() === 'yes') {
          lead_status = 'Contacted'
        }

        // Build a readable remarks field
        const remarksParts = [
          remarks,
          designation ? `Designation: ${designation}` : null,
          pos ? `POS: ${pos}` : null,
          outlets ? `Outlets: ${outlets}` : null,
          zomato_page_number ? `Zomato: ${zomato_page_number}` : null,
          approached_on ? `Approached On: ${approached_on}` : null,
          added_to_master ? `Added to Master: ${added_to_master}` : null,
        ].filter(Boolean)

        const payload = {
          restaurant_name,
          owner_name: brand_contact_person || null,
          phone: contact_no || null,
          area: null,
          city: 'Bengaluru',
          priority: priority || null,
          lead_status,
          assigned_to_name: tipplr_executive_name || null,
          remarks: remarksParts.length ? remarksParts.join(' | ') : null,
          converted: normalizeBoolean(converted),
          documents_received: normalizeBoolean(documents_received),
          go_live_on_digihat: go_live_on_digihat || null,
          go_live_date: go_live_date || null,
          menu_pricing: menu_pricing || null,
          discount: discount || null,
          reason: reason || null,
          last_contacted_on: last_contacted_on || null,
          source_row_number,
        }

        // Upsert by source_row_number if available, otherwise by restaurant_name
        const { error } = await supabase
          .from('restaurants')
          .upsert(payload, {
            onConflict: 'source_row_number',
          })

        if (error) {
          // fallback in case source_row_number doesn't exist as a unique conflict target
          const existing = await supabase
            .from('restaurants')
            .select('id')
            .eq('restaurant_name', restaurant_name)
            .limit(1)
            .maybeSingle()

          if (existing.data?.id) {
            const updateRes = await supabase
              .from('restaurants')
              .update(payload)
              .eq('id', existing.data.id)

            if (updateRes.error) {
              throw updateRes.error
            }
          } else {
            const insertRes = await supabase
              .from('restaurants')
              .insert(payload)

            if (insertRes.error) {
              throw insertRes.error
            }
          }
        }

        synced++
      } catch (err) {
        errors.push({
          row: source_row_number,
          error: err instanceof Error ? err.message : 'Unknown row error',
        })
      }
    }

    return Response.json({
      success: true,
      sheet: firstSheetTitle,
      synced,
      totalRows: dataRows.length,
      errors,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected sync error',
      },
      { status: 500 }
    )
  }
}
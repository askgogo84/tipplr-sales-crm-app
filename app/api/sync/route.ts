import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

function clean(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

function normalizeBoolean(value: string | null | undefined): boolean | null {
  if (!value) return null
  const v = value.trim().toLowerCase()
  if (['yes', 'y', 'true', '1', 'live'].includes(v)) return true
  if (['no', 'n', 'false', '0', 'not live'].includes(v)) return false
  return null
}

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.cwd() + '/google-service-account.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({
      version: 'v4',
      auth,
    })

    const spreadsheetId = process.env.GOOGLE_SHEET_ID!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const meta = await sheets.spreadsheets.get({ spreadsheetId })
    const firstSheetTitle = meta.data.sheets?.[0]?.properties?.title

    if (!firstSheetTitle) {
      return Response.json({
        success: false,
        error: 'Could not detect sheet tab name',
      })
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${firstSheetTitle}!A:Z`,
    })

    const rows = response.data.values || []
    if (rows.length < 2) {
      return Response.json({
        success: true,
        synced: 0,
        message: 'No data rows found',
      })
    }

    const headers = rows[0].map((h) => String(h).trim())
    const dataRows = rows.slice(1)

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

        const restaurant_name = clean(record['Brand Name'])
        if (!restaurant_name) continue

        const priority = clean(record['Priority'])
        const brand_contact_person = clean(record['Brand Contact Person'])
        const designation = clean(record['Designation'])
        const contact_no = clean(record['Contact No'])
        const zomato_page_number = clean(record['Zomato Page Number'])
        const contacted = clean(record['Contacted'])
        const tipplr_executive_name = clean(record['Tipplr Executive Name'])
        const approached_on = clean(record['Approached On'])
        const converted = clean(record['Converted'])
        const documents_received = clean(record['Documents Received'])
        const go_live_on_digihat =
          clean(record['Go Live on Digibhaat']) ||
          clean(record['Go Live on Digihat']) ||
          clean(record['Go Live on Digilist'])
        const go_live_date = clean(record['Go Live Date'])
        const menu_pricing = clean(record['Menu Pricing'])
        const discount = clean(record['Discount'])
        const reason =
          clean(record['Reason (if not agreeing on Menu Price/Offline menu)']) ||
          clean(record['Reason'])
        const remarks = clean(record['Remarks (if any)'])

        let lead_status = 'Lead'
        if (converted?.toLowerCase() === 'yes') {
          lead_status = 'Converted'
        } else if (contacted?.toLowerCase() === 'yes') {
          lead_status = 'Contacted'
        }

        const remarksParts = [
          remarks,
          designation ? `Designation: ${designation}` : null,
          zomato_page_number ? `Zomato: ${zomato_page_number}` : null,
          approached_on ? `Approached On: ${approached_on}` : null,
        ].filter(Boolean)

        const payload = {
          restaurant_name,
          owner_name: brand_contact_person || null,
          phone: contact_no || null,
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
          source_row_number,
        }

        const existing = await supabase
          .from('restaurants')
          .select('id')
          .eq('source_row_number', source_row_number)
          .maybeSingle()

        if (existing.data?.id) {
          const { error } = await supabase
            .from('restaurants')
            .update(payload)
            .eq('id', existing.data.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('restaurants')
            .insert(payload)

          if (error) throw error
        }

        synced++
      } catch (err) {
        errors.push({
          row: source_row_number,
          error: err instanceof Error ? err.message : 'Unknown error',
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
  } catch (err) {
    return Response.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
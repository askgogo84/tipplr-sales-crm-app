import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

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

function getGoogleCredentials() {
  const envJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  if (!envJson) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment')
  }

  try {
    return JSON.parse(envJson)
  } catch {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format')
  }
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export async function GET() {
  try {
    if (!process.env.GOOGLE_SHEET_ID) {
      return Response.json(
        { success: false, error: 'Missing GOOGLE_SHEET_ID' },
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

    const credentials = getGoogleCredentials()

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({
      version: 'v4',
      auth,
    })

    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    const targetGid = 964452752

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const meta = await sheets.spreadsheets.get({ spreadsheetId })

    const matchedSheet = meta.data.sheets?.find(
      (sheet) => sheet.properties?.sheetId === targetGid
    )

    const sheetTitle = matchedSheet?.properties?.title

    if (!sheetTitle) {
      return Response.json(
        {
          success: false,
          error: `Could not find sheet tab for gid ${targetGid}`,
        },
        { status: 500 }
      )
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A:Z`,
    })

    const rows = response.data.values || []

    if (rows.length < 2) {
      return Response.json({
        success: true,
        sheet: sheetTitle,
        gid: targetGid,
        synced: 0,
        totalRows: 0,
        errors: [],
      })
    }

    const headers = rows[0].map((h) => String(h).trim())
    const dataRows = rows.slice(1)

    const payloads: any[] = []
    const rowErrors: Array<{ row: number; error: string }> = []

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

        const sheetStatus = clean(record['Status'])
        const lead_status = sheetStatus || 'Lead'

        const remarksParts = [
          remarks,
          designation ? `Designation: ${designation}` : null,
          zomato_page_number ? `Zomato: ${zomato_page_number}` : null,
          approached_on ? `Approached On: ${approached_on}` : null,
        ].filter(Boolean)

        payloads.push({
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
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        rowErrors.push({
          row: source_row_number,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const chunks = chunkArray(payloads, 500)
    const batchErrors: Array<{ batch: number; error: string }> = []

    for (let i = 0; i < chunks.length; i++) {
      const { error } = await supabase
        .from('restaurants')
        .upsert(chunks[i], {
          onConflict: 'source_row_number',
          ignoreDuplicates: false,
        })

      if (error) {
        batchErrors.push({
          batch: i + 1,
          error: error.message,
        })
      }
    }

    return Response.json({
      success: batchErrors.length === 0,
      sheet: sheetTitle,
      gid: targetGid,
      synced: payloads.length,
      totalRows: dataRows.length,
      rowErrors,
      batchErrors,
    })
  } catch (err) {
    console.error('SYNC ROUTE ERROR:', err)

    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
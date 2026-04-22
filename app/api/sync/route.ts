export const dynamic = 'force-dynamic'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

type SheetConfig = {
  title: string
  isDeactivated?: boolean
}

type ParsedRow = {
  restaurant_name: string
  owner_name: string | null
  phone: string | null
  city: string | null
  priority: string | null
  lead_status: string | null
  assigned_to_name: string | null
  remarks: string | null
  converted: boolean | null
  documents_received: boolean | null
  go_live_on_digihat: string | null
  go_live_date: string | null
  menu_pricing: string | null
  discount: string | null
  reason: string | null
}

const SHEETS_TO_SYNC: SheetConfig[] = [
  { title: 'Final List' },
  { title: 'ONDC Priority Sheet' },
  { title: 'Tipplr - Waayu ' },
  { title: 'Priority List' },
  { title: 'Magic Pindata' },
  { title: 'Deactivated Outlets', isDeactivated: true },
]

function clean(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

function normalizeBoolean(value: string | null | undefined): boolean | null {
  if (!value) return null
  const v = value.trim().toLowerCase()
  if (['yes', 'y', 'true', '1', 'live', 'converted'].includes(v)) return true
  if (['no', 'n', 'false', '0', 'not live'].includes(v)) return false
  return null
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normalizeStatus(status: string | null | undefined, converted?: boolean | null): string {
  const s = (status || '').trim().toLowerCase()

  if (converted === true) return 'Converted'
  if (['converted', 'already live', 'live'].includes(s)) return 'Converted'
  if (['agreed', 'agreement done'].includes(s)) return 'Agreed'
  if (['followup', 'follow up'].includes(s)) return 'Followup'
  if (['call back', 'callback', 'called back'].includes(s)) return 'Call Back'
  if (["couldn't connect", 'couldnt connect', 'not reachable'].includes(s)) return "Couldn't Connect"
  if (['not interested', 'not live', 'rejected'].includes(s)) return 'Not Interested'
  if (['wrong number', 'incorrect number', 'invalid number'].includes(s)) return 'Wrong Number'
  if (['lead', 'new'].includes(s)) return 'Lead'
  if (['visit', 'visited'].includes(s)) return 'Visit'
  if (['deactivated'].includes(s)) return 'Deactivated'

  return status || 'Lead'
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

function firstNonEmpty(record: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    const value = clean(record[key])
    if (value) return value
  }
  return null
}

function buildRecord(headers: string[], row: string[]): Record<string, string> {
  const record: Record<string, string> = {}
  headers.forEach((header, i) => {
    record[header] = row[i] || ''
  })
  return record
}

function parseRowBySheet(
  sheetTitle: string,
  record: Record<string, string>,
  isDeactivated: boolean
): ParsedRow | null {
  let restaurant_name: string | null = null
  let owner_name: string | null = null
  let phone: string | null = null
  let priority: string | null = null
  let assigned_to_name: string | null = null
  let lead_status: string | null = null
  let remarks: string | null = null
  let converted: boolean | null = null
  let documents_received: boolean | null = null
  let go_live_on_digihat: string | null = null
  let go_live_date: string | null = null
  let menu_pricing: string | null = null
  let discount: string | null = null
  let reason: string | null = null
  let city: string | null = 'Bengaluru'

  if (sheetTitle === 'Final List') {
    restaurant_name = firstNonEmpty(record, ['brand name'])
    owner_name = firstNonEmpty(record, ['brand contact person'])
    phone = firstNonEmpty(record, ['contact no'])
    priority = firstNonEmpty(record, ['priority'])
    assigned_to_name = firstNonEmpty(record, ['tipplr executive name'])
    lead_status = firstNonEmpty(record, ['status']) || 'Lead'
    converted = normalizeBoolean(firstNonEmpty(record, ['converted']))
    documents_received = normalizeBoolean(firstNonEmpty(record, ['documents received']))
    go_live_on_digihat = firstNonEmpty(record, [
      'go live on digibhaat',
      'go live on digihat',
      'go live on digilist',
    ])
    go_live_date = firstNonEmpty(record, ['go live date'])
    menu_pricing = firstNonEmpty(record, ['menu pricing'])
    discount = firstNonEmpty(record, ['discount'])
    reason = firstNonEmpty(record, [
      'reason (if not agreeing on menu price/offline menu)',
      'reason',
    ])

    const designation = firstNonEmpty(record, ['designation'])
    const zomatoPage = firstNonEmpty(record, ['zomato page number'])
    const approachedOn = firstNonEmpty(record, ['approached on'])
    const freeTextRemarks = firstNonEmpty(record, ['remarks (if any)'])

    const remarksParts = [
      freeTextRemarks,
      designation ? `Designation: ${designation}` : null,
      zomatoPage ? `Zomato: ${zomatoPage}` : null,
      approachedOn ? `Approached On: ${approachedOn}` : null,
    ].filter(Boolean)

    remarks = remarksParts.length ? remarksParts.join(' | ') : null
  } else if (sheetTitle === 'ONDC Priority Sheet') {
    restaurant_name = firstNonEmpty(record, ['restaurant name'])
    owner_name = firstNonEmpty(record, ['contact person'])
    phone = firstNonEmpty(record, ['contact no'])
    priority = firstNonEmpty(record, ['priority'])
    assigned_to_name = firstNonEmpty(record, ['executive name'])
    lead_status = firstNonEmpty(record, ['status']) || 'Lead'
    remarks = firstNonEmpty(record, ['remarks'])
    reason = firstNonEmpty(record, ['reason'])
  } else if (sheetTitle === 'Tipplr - Waayu ') {
    restaurant_name = firstNonEmpty(record, ['restaurant names'])
    owner_name = firstNonEmpty(record, ['contact person', 'poc name'])
    phone = firstNonEmpty(record, ['contact number', 'phone number'])
    priority = firstNonEmpty(record, ['priority'])
    assigned_to_name = firstNonEmpty(record, ['called by'])
    lead_status = firstNonEmpty(record, ['pushback/status', 'status']) || 'Lead'
    remarks = firstNonEmpty(record, ['remarks'])
    reason = firstNonEmpty(record, ['pushback/status', 'reason'])
  } else if (sheetTitle === 'Priority List') {
    restaurant_name = firstNonEmpty(record, ['outlet name'])
    owner_name = firstNonEmpty(record, ['poc name'])
    phone = firstNonEmpty(record, ['poc contact'])
    priority = firstNonEmpty(record, ['priority'])
    assigned_to_name = firstNonEmpty(record, ['called by'])
    lead_status = firstNonEmpty(record, ['status']) || 'Lead'
    remarks = firstNonEmpty(record, ['remarks'])
    reason = firstNonEmpty(record, ['reason'])
  } else if (sheetTitle === 'Magic Pindata') {
    restaurant_name = firstNonEmpty(record, ['restaurant name'])
    owner_name = firstNonEmpty(record, ['contact person', 'poc name'])
    phone = firstNonEmpty(record, ['phone number', 'contact number'])
    priority = firstNonEmpty(record, ['priority'])
    assigned_to_name = firstNonEmpty(record, ['called by'])
    lead_status = firstNonEmpty(record, ['status']) || 'Lead'
    remarks = firstNonEmpty(record, ['remarks'])
    reason = firstNonEmpty(record, ['reason'])
  } else if (sheetTitle === 'Deactivated Outlets') {
    restaurant_name = firstNonEmpty(record, ['name'])
    owner_name = firstNonEmpty(record, ['contact person', 'poc name'])
    phone = firstNonEmpty(record, ['phone number', 'contact number'])
    assigned_to_name = firstNonEmpty(record, ['called by'])
    lead_status = firstNonEmpty(record, ['status']) || 'Deactivated'
    remarks = firstNonEmpty(record, ['remarks'])
    reason = firstNonEmpty(record, ['reason'])
  }

  if (!restaurant_name) return null

  if (isDeactivated && !lead_status) {
    lead_status = 'Deactivated'
  }

  return {
    restaurant_name,
    owner_name,
    phone,
    city,
    priority,
    lead_status,
    assigned_to_name,
    remarks,
    converted,
    documents_received,
    go_live_on_digihat,
    go_live_date,
    menu_pricing,
    discount,
    reason,
  }
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const meta = await sheets.spreadsheets.get({ spreadsheetId })
    const workbookSheets = meta.data.sheets || []

    const payloads: any[] = []
    const rowErrors: Array<{
      sheet: string
      row: number
      error: string
    }> = []
    const sheetSummary: Array<{
      sheet: string
      gid: number | null
      synced: number
      totalRows: number
    }> = []

    for (const config of SHEETS_TO_SYNC) {
      const matchedSheet = workbookSheets.find(
        (sheet) => sheet.properties?.title === config.title
      )

      const source_gid = matchedSheet?.properties?.sheetId ?? null
      const sheetTitle = matchedSheet?.properties?.title ?? null

      if (!sheetTitle || source_gid === null) {
        rowErrors.push({
          sheet: config.title,
          row: 0,
          error: 'Sheet tab not found in workbook',
        })
        continue
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetTitle}!A:ZZ`,
      })

      const rows = response.data.values || []

      if (rows.length < 2) {
        sheetSummary.push({
          sheet: sheetTitle,
          gid: source_gid,
          synced: 0,
          totalRows: 0,
        })
        continue
      }

      const headers = rows[0].map((h) => normalizeHeader(String(h)))
      const dataRows = rows.slice(1)

      let currentSheetSynced = 0

      for (let index = 0; index < dataRows.length; index++) {
        const row = dataRows[index]
        const source_row_number = index + 2

        try {
          const record = buildRecord(headers, row)
          const parsed = parseRowBySheet(
            sheetTitle,
            record,
            Boolean(config.isDeactivated)
          )

          if (!parsed) continue

          payloads.push({
            restaurant_name: parsed.restaurant_name,
            owner_name: parsed.owner_name,
            phone: parsed.phone,
            city: parsed.city,
            priority: parsed.priority,
            lead_status: parsed.lead_status,
            assigned_to_name: parsed.assigned_to_name,
            remarks: parsed.remarks,
            converted: parsed.converted,
            documents_received: parsed.documents_received,
            go_live_on_digihat: parsed.go_live_on_digihat,
            go_live_date: parsed.go_live_date,
            menu_pricing: parsed.menu_pricing,
            discount: parsed.discount,
            reason: parsed.reason,
            source_sheet: sheetTitle,
            source_gid,
            source_row_number,
            is_deactivated: Boolean(config.isDeactivated),
            synced_at: new Date().toISOString(),
          })

          currentSheetSynced++
        } catch (err) {
          rowErrors.push({
            sheet: sheetTitle,
            row: source_row_number,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }

      sheetSummary.push({
        sheet: sheetTitle,
        gid: source_gid,
        synced: currentSheetSynced,
        totalRows: dataRows.length,
      })
    }

    const chunks = chunkArray(payloads, 500)
    const batchErrors: Array<{ batch: number; error: string }> = []

    for (let i = 0; i < chunks.length; i++) {
      const batch = chunks[i]

      const sourceGids = Array.from(
        new Set(batch.map((row: any) => row.source_gid).filter((v) => v !== null && v !== undefined))
      )

      const sourceRowNumbers = Array.from(
        new Set(batch.map((row: any) => row.source_row_number).filter((v) => v !== null && v !== undefined))
      )

      let existingRows: any[] = []

      if (sourceGids.length > 0 && sourceRowNumbers.length > 0) {
        const { data, error: existingRowsError } = await supabase
          .from('restaurants')
          .select('id, restaurant_name, lead_status, converted, assigned_to_name, source_sheet, source_gid, source_row_number')
          .in('source_gid', sourceGids)
          .in('source_row_number', sourceRowNumbers)

        if (existingRowsError) {
          console.error('Failed to fetch existing rows for activity comparison', existingRowsError)
        } else {
          existingRows = data || []
        }
      }

      const existingMap = new Map(
        existingRows.map((row: any) => [`${row.source_gid}-${row.source_row_number}`, row])
      )

      const { error } = await supabase
        .from('restaurants')
        .upsert(batch, {
          onConflict: 'source_gid,source_row_number',
          ignoreDuplicates: false,
        })

      if (error) {
        batchErrors.push({
          batch: i + 1,
          error: error.message,
        })
        continue
      }

      const activityRows: any[] = []

      for (const row of batch) {
        const existing = existingMap.get(`${row.source_gid}-${row.source_row_number}`)

        const oldStatus = normalizeStatus(existing?.lead_status, existing?.converted)
        const newStatus = normalizeStatus(row.lead_status, row.converted)

        if (oldStatus !== 'Converted' && newStatus === 'Converted') {
          activityRows.push({
            restaurant_id: existing?.id || null,
            restaurant_name: row.restaurant_name,
            source_sheet: row.source_sheet || existing?.source_sheet || null,
            old_status: oldStatus,
            new_status: 'Converted',
            changed_by: row.assigned_to_name || existing?.assigned_to_name || 'Sheet Sync',
            changed_at: new Date().toISOString(),
            note: 'Detected during sheet sync',
          })
        }
      }

      if (activityRows.length > 0) {
        const { error: activityInsertError } = await supabase
          .from('restaurant_activity_log')
          .insert(activityRows)

        if (activityInsertError) {
          console.error('Failed to insert activity log rows', activityInsertError)
        }
      }
    }

    return Response.json({
      success: batchErrors.length === 0,
      synced: payloads.length,
      sheets: sheetSummary,
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
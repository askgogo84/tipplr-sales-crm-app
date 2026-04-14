import { JWT } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, lead_status, assigned_to_name } = body as {
      id: number | string
      lead_status?: string
      assigned_to_name?: string
    }

    if (!id) {
      return Response.json(
        { success: false, error: 'Missing restaurant id' },
        { status: 400 }
      )
    }

    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      return Response.json(
        { success: false, error: 'Missing Google Sheets environment variables' },
        { status: 500 }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        { success: false, error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, restaurant_name, source_row_number')
      .eq('id', id)
      .single()

    if (fetchError || !restaurant) {
      return Response.json(
        { success: false, error: fetchError?.message || 'Restaurant not found' },
        { status: 404 }
      )
    }

    const updatePayload: Record<string, string | null> = {}

    if (typeof lead_status === 'string') {
      updatePayload.lead_status = lead_status
    }

    if (typeof assigned_to_name === 'string') {
      updatePayload.assigned_to_name = assigned_to_name === '' ? null : assigned_to_name
    }

    const { error: updateError } = await supabase
      .from('restaurants')
      .update(updatePayload)
      .eq('id', id)

    if (updateError) {
      return Response.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    const sourceRowNumber = restaurant.source_row_number

    if (sourceRowNumber) {
      const auth = new google.auth.JWT({
        email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      const sheets = google.sheets({
        version: 'v4',
        auth: auth as any,
      })

      const updates: Array<{ range: string; values: string[][] }> = []

      if (typeof lead_status === 'string') {
        updates.push({
          range: `'Final List'!L${sourceRowNumber}`,
          values: [[lead_status]],
        })
      }

      if (typeof assigned_to_name === 'string') {
        updates.push({
          range: `'Final List'!J${sourceRowNumber}`,
          values: [[assigned_to_name]],
        })
      }

      if (updates.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: GOOGLE_SHEET_ID,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates,
          },
        })
      }
    }

    return Response.json({
      success: true,
      synced_to_sheet: Boolean(sourceRowNumber),
      source_row_number: sourceRowNumber || null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
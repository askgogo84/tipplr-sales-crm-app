import { google } from 'googleapis'

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

    const res = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    })

    return Response.json({
      success: true,
      title: res.data.properties?.title,
    })
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err.message,
    })
  }
}
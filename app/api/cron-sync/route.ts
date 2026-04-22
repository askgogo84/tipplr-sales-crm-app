export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expected) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

    const syncRes = await fetch(`${baseUrl}/api/sync`, {
      method: 'GET',
      cache: 'no-store',
    })

    const syncData = await syncRes.json()

    return NextResponse.json({
      success: syncRes.ok,
      triggeredAt: new Date().toISOString(),
      sync: syncData,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
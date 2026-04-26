export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAllActiveRestaurants, normalizeStatus } from '@/lib/crm-metrics'

type RawRow = { date: string; restaurant: string; executive: string }

type DailyExportRow = {
  sl_no: number
  restaurant_name: string
  onboarded_date: string
  source: string
}

const HISTORICAL_SOURCE_NAME = 'Onboarding reports.xlsx'
const ACTIVITY_SOURCE_NAME = 'CRM Activity Log'
const TOTAL_SOURCE_NAME = 'CRM Converted Restaurants'
const HISTORICAL_END_DATE = '2026-04-25'

const HISTORICAL_ROWS: RawRow[] = [
  ['2026-04-22', 'Kayalum Kadalum', '—'],
  ['2026-04-22', 'Bungalow 47', '—'],
  ['2026-04-22', 'Al-Ansar Hotel', '—'],
  ['2026-04-22', 'Fanoos Xpress Since 1975', '—'],
  ['2026-04-22', 'Fanoos Xprss Since 1975', '—'],
  ['2026-04-22', 'Sri Hari Khadya Bhandar', '—'],
  ['2026-04-22', 'HOTEL FANOOS SINCE 1975', '—'],
  ['2026-04-22', 'HOTEL FANOOS SINCE 1975', '—'],
  ['2026-04-22', 'hotel aditya', '—'],
  ['2026-04-22', 'bist dhaba (2)', '—'],
  ['2026-04-22', 'bist dhaba (2)', '—'],
  ['2026-04-22', 'ahhar veg', '—'],
  ['2026-04-22', 'indian grill house', '—'],
  ['2026-04-22', 'sitara veg', '—'],
  ['2026-04-22', 'tandoori nights', '—'],
  ['2026-04-22', 'sai sagaar', '—'],
  ['2026-04-22', 'Ganesh Food Corner', '—'],
  ['2026-04-22', 'Big Wok Chinese', '—'],
  ['2026-04-22', 'A1 Delhi Dum Chicken Biryani', '—'],
  ['2026-04-22', 'The coffee House', '—'],
  ['2026-04-22', 'Attil Multi cuisine Restaurant', '—'],
  ['2026-04-22', 'Udupi Sagar', '—'],
  ['2026-04-22', "Crack'D Cafe", '—'],
  ['2026-04-22', 'Achayans Cafe 2.0', '—'],
  ['2026-04-22', 'Bazabi', '—'],
  ['2026-04-22', 'The Kerala Mess', '—'],
  ['2026-04-22', 'Sabari Juice Junction', '—'],
  ['2026-04-22', 'Kabab Mehal', '—'],
  ['2026-04-22', 'Kabab Mehak', '—'],
  ['2026-04-22', 'Kabab Street', '—'],
  ['2026-04-22', 'Pattanshetty Hotel', '—'],
  ['2026-04-23', 'Hotel Baaduta', '—'],
  ['2026-04-23', 'Mizo Kitchen', '—'],
  ['2026-04-23', 'Mrs Iyengar kitchen', '—'],
  ['2026-04-23', 'shree guru sagar', '—'],
  ['2026-04-23', 'bhyrava biriyani', '—'],
  ['2026-04-23', 'Moms singh', '—'],
  ['2026-04-23', 'Star Biryani', '—'],
  ['2026-04-23', 'Board 4 Bored', '—'],
  ['2026-04-23', 'Jain bites', '—'],
  ['2026-04-23', 'Bowled over by Board 4 Bored', '—'],
  ['2026-04-23', '99 Variety Dosa And Pav Bhaji', '—'],
  ['2026-04-23', 'Five Star', '—'],
  ['2026-04-23', 'Sri Hari Khadya Bhandar', '—'],
  ['2026-04-23', 'Delhi Flavour', '—'],
  ['2026-04-23', 'Mysuru Thindiies [1]', '—'],
  ['2026-04-23', 'Mysuru Thindiies [2]', '—'],
  ['2026-04-23', 'New Darbar Family Restaurant', '—'],
  ['2026-04-23', 'Jai Bhavani Hotel', '—'],
  ['2026-04-23', 'Madurai Tiffin Center', '—'],
  ['2026-04-23', 'The Benne Mane', '—'],
  ['2026-04-23', 'Dilli Bhature Chole', '—'],
  ['2026-04-23', 'Big Scoop cafe', '—'],
  ['2026-04-23', 'Desi Veg Cravings', '—'],
  ['2026-04-23', 'Devansh Momos Corner', '—'],
  ['2026-04-24', 'sankalpa reddy Restaurant(1)', '—'],
  ['2026-04-24', 'sankalpa reddy Restaurant(2)', '—'],
  ['2026-04-24', 'sankalpa reddy Restaurant(3)', '—'],
  ['2026-04-24', 'sankalpa reddy Restaurant(4)', '—'],
  ['2026-04-24', 'Antarastriya momo pasta (1)', '—'],
  ['2026-04-24', 'Antarastriya momo pasta (2)', '—'],
  ['2026-04-24', 'Antarastriya momo pasta (3)', '—'],
  ['2026-04-24', 'Antarastriya momo pasta (4)', '—'],
  ['2026-04-24', 'shareat panipuri', '—'],
  ['2026-04-24', 'Cafe Corner', '—'],
  ['2026-04-24', 'Kavin Restaurant', '—'],
  ['2026-04-24', 'The Shades', '—'],
  ['2026-04-24', 'Bhojan Bhavan', '—'],
  ['2026-04-24', 'Hasanamba Iyengers Cake Mane', '—'],
  ['2026-04-24', 'Luv u Bhojan', '—'],
  ['2026-04-24', 'MBS Mandi House [1]', '—'],
  ['2026-04-24', 'MBS Mandi House [2]', '—'],
  ['2026-04-24', 'MBS Mandi House [3]', '—'],
  ['2026-04-24', 'DirtyDogs [1]', '—'],
  ['2026-04-24', 'DirtyDogs [2]', '—'],
  ['2026-04-24', 'S M Bakery', '—'],
  ['2026-04-24', 'Yakshee Cafe', '—'],
  ['2026-04-25', '24 Parganas', '—'],
  ['2026-04-25', 'Ohhdaily - Healthy & Homely Tiffins [1]', '—'],
  ['2026-04-25', 'Ohhdaily - Healthy & Homely Tiffins [2]', '—'],
  ['2026-04-25', 'RR Chats [1]', '—'],
  ['2026-04-25', 'RR Chats [2]', '—'],
  ['2026-04-25', 'Naidu Hotel', '—'],
  ['2026-04-25', 'Chakadola sweets', '—'],
  ['2026-04-25', 'Meghana biriyani', '—'],
  ['2026-04-25', "Dande's Biriyani", '—'],
  ['2026-04-25', 'Regal Feast', '—'],
  ['2026-04-25', 'Sri banashakari Military hotel', '—'],
  ['2026-04-25', 'food king', '—'],
  ['2026-04-25', 'Lassi And Juice', '—'],
  ['2026-04-25', 'Samskruthi Grand', '—'],
  ['2026-04-25', 'Breezy Cow Bar (1)', '—'],
  ['2026-04-25', 'Breezy Cow Bar (2)', '—'],
  ['2026-04-25', 'Cafe Prassiddhi Pure Veg', '—'],
  ['2026-04-25', 'Oasis Dine House', '—'],
  ['2026-04-25', 'Udaram Bharnam', '—'],
  ['2026-04-25', 'Mana Vijayawada Ruchulu', '—'],
  ['2026-04-25', 'Chennupati canteen', '—'],
  ['2026-04-25', 'Shri Krishna Bhavan', '—'],
  ['2026-04-25', 'Apna Punjabi Dhaba', '—'],
  ['2026-04-25', 'The Pulp Fiction', '—'],
  ['2026-04-25', 'For Food Lovers', '—'],
  ['2026-04-25', 'Bazabi', '—'],
].map(([date, restaurant, executive]) => ({ date, restaurant, executive }))

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey)
}

function getDefaultYesterdayIST() {
  const now = new Date()
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  istDate.setDate(istDate.getDate() - 1)
  return istDate.toLocaleDateString('en-CA')
}

function startOfISTDayUtc(dateStr: string) {
  return new Date(`${dateStr}T00:00:00+05:30`).toISOString()
}

function endOfISTDayUtc(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999+05:30`).toISOString()
}

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function formatDateTimeIST(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function matchesSearch(values: unknown[], search: string) {
  if (!search) return true
  return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(search))
}

async function getActivityRowsForDate(supabase: any, date: string): Promise<DailyExportRow[]> {
  const { data, error } = await supabase
    .from('restaurant_activity_log')
    .select('restaurant_name, source_sheet, new_status, created_at, changed_at')
    .eq('new_status', 'Converted')
    .gte('created_at', startOfISTDayUtc(date))
    .lte('created_at', endOfISTDayUtc(date))
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map((row: any, index: number) => ({
    sl_no: index + 1,
    restaurant_name: row.restaurant_name || '—',
    onboarded_date: date,
    source: row.source_sheet || ACTIVITY_SOURCE_NAME,
  }))
}

async function getAllConvertedRows(supabase: any, search: string) {
  const all = await fetchAllActiveRestaurants(
    supabase,
    'id, restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted, is_deactivated'
  )

  return (all || [])
    .filter((row: any) => normalizeStatus(row.lead_status, row.converted) === 'converted')
    .map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      assigned_to: row.assigned_to_name || 'Unassigned',
      source_sheet: row.source_sheet || TOTAL_SOURCE_NAME,
      last_updated: formatDateTimeIST(row.updated_at || row.synced_at || null),
    }))
    .filter((row: any) => matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search))
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') || 'range').trim()
    const selectedDate = (searchParams.get('date') || searchParams.get('from') || getDefaultYesterdayIST()).trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    if (type === 'all') {
      const rows = await getAllConvertedRows(supabase, search)
      const headers = ['Brand Name', 'Assigned To', 'Source Sheet', 'Last Updated']
      const lines = [
        headers.join(','),
        ...rows.map((row: any) => [
          escapeCsv(row.brand_name),
          escapeCsv(row.assigned_to),
          escapeCsv(row.source_sheet),
          escapeCsv(row.last_updated),
        ].join(',')),
      ]

      return new NextResponse('\uFEFF' + lines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="onboarded-brands-all.csv"',
        },
      })
    }

    const historicalRows: DailyExportRow[] = HISTORICAL_ROWS
      .filter((row) => row.date === selectedDate)
      .map((row, index) => ({
        sl_no: index + 1,
        restaurant_name: row.restaurant,
        onboarded_date: row.date,
        source: HISTORICAL_SOURCE_NAME,
      }))

    const rows = selectedDate <= HISTORICAL_END_DATE
      ? historicalRows
      : await getActivityRowsForDate(supabase, selectedDate)

    const filtered = rows.filter((row) =>
      matchesSearch([row.restaurant_name, row.source], search)
    )

    const headers = ['SL No', 'Restaurant Name', 'Onboarded Date', 'Source']
    const lines = [
      headers.join(','),
      ...filtered.map((row, index) => [
        escapeCsv(index + 1),
        escapeCsv(row.restaurant_name),
        escapeCsv(row.onboarded_date),
        escapeCsv(row.source),
      ].join(',')),
    ]

    return new NextResponse('\uFEFF' + lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="onboarded-brands-${selectedDate}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAllActiveRestaurants, normalizeStatus } from '@/lib/crm-metrics'

type OnboardedRow = {
  brand_name: string
  converted_at: string
  converted_at_label: string
  changed_by: string
  source_sheet: string
}

const HISTORICAL_SOURCE_NAME = 'Verified Daily Onboarding Report'
const ACTIVITY_SOURCE_NAME = 'CRM Onboarded Date'
const TOTAL_SOURCE_NAME = 'CRM Converted Restaurants'

/**
 * Verified historical reports.
 * These dates were manually reconciled from the onboarding report screenshots/files.
 * Future dates should come from restaurants.onboarded_business_date.
 */
const HISTORICAL_END_DATE = '2026-04-27'

const HISTORICAL_ROWS: Record<string, { restaurant: string; executive?: string }[]> = {
  '2026-04-22': [
    { restaurant: 'Kayalum Kadalum', executive: 'Bareen' },
    { restaurant: 'Bungalow 47', executive: 'Bareen' },
    { restaurant: 'Al-Ansar Hotel', executive: 'Bareen' },
    { restaurant: 'Fanoos Xpress Since 1975', executive: 'Bareen' },
    { restaurant: 'Fanoos Xprss Since 1975', executive: 'Bareen' },
    { restaurant: 'Sri Hari Khadya Bhandar', executive: 'Bareen' },
    { restaurant: 'HOTEL FANOOS SINCE 1975', executive: 'Bareen' },
    { restaurant: 'HOTEL FANOOS SINCE 1975', executive: 'Bareen' },
    { restaurant: 'hotel aditya', executive: 'Shruthi' },
    { restaurant: 'bist dhaba (2)', executive: 'Shruthi' },
    { restaurant: 'bist dhaba (2)', executive: 'Shruthi' },
    { restaurant: 'ahhar veg', executive: 'Shruthi' },
    { restaurant: 'indian grill house', executive: 'Shruthi' },
    { restaurant: 'sitara veg', executive: 'Shruthi' },
    { restaurant: 'tandoori nights', executive: 'Shruthi' },
    { restaurant: 'sai sagaar', executive: 'Shruthi' },
    { restaurant: 'Ganesh Food Corner', executive: 'Keerthana' },
    { restaurant: 'Big Wok Chinese', executive: 'Keerthana' },
    { restaurant: 'A1 Delhi Dum Chicken Biryani', executive: 'Keerthana' },
    { restaurant: 'The coffee House', executive: 'Lalitha' },
    { restaurant: 'Attil Multi cuisine Restaurant', executive: 'Lalitha' },
    { restaurant: 'Udupi Sagar', executive: 'Lalitha' },
    { restaurant: "Crack'D Cafe", executive: 'Lalitha' },
    { restaurant: 'Achayans Cafe 2.0', executive: 'Lalitha' },
    { restaurant: 'Bazabi', executive: 'Lalitha' },
    { restaurant: 'The Kerala Mess', executive: 'Lalitha' },
    { restaurant: 'Sabari Juice Junction', executive: 'Neshavani' },
    { restaurant: 'Kabab Mehal', executive: 'Neshavani' },
    { restaurant: 'Kabab Mehak', executive: 'Neshavani' },
    { restaurant: 'Kabab Street', executive: 'Neshavani' },
    { restaurant: 'Pattanshetty Hotel', executive: 'Neshavani' },
  ],

  '2026-04-23': [
    { restaurant: 'Hotel Baaduta', executive: 'Shruthi' },
    { restaurant: 'Mizo Kitchen', executive: 'Shruthi' },
    { restaurant: 'Mrs Iyengar kitchen', executive: 'Shruthi' },
    { restaurant: 'shree guru sagar', executive: 'Shruthi' },
    { restaurant: 'bhyrava biriyani', executive: 'Shruthi' },
    { restaurant: 'Moms singh', executive: 'Shruthi' },
    { restaurant: 'Star Biryani', executive: 'Keerthana' },
    { restaurant: 'Board 4 Bored', executive: 'Keerthana' },
    { restaurant: 'Jain bites', executive: 'Keerthana' },
    { restaurant: 'Bowled over by Board 4 Bored', executive: 'Keerthana' },
    { restaurant: '99 Variety Dosa And Pav Bhaji', executive: 'Keerthana' },
    { restaurant: 'Five Star', executive: 'Keerthana' },
    { restaurant: 'Sri Hari Khadya Bhandar', executive: 'Bareen' },
    { restaurant: 'Delhi Flavour', executive: 'Bareen' },
    { restaurant: 'Mysuru Thindiies [1]', executive: 'Bareen' },
    { restaurant: 'Mysuru Thindiies [2]', executive: 'Bareen' },
    { restaurant: 'New Darbar Family Restaurant', executive: 'Bareen' },
    { restaurant: 'Jai Bhavani Hotel', executive: 'Bareen' },
    { restaurant: 'Madurai Tiffin Center', executive: 'Bareen' },
    { restaurant: 'The Benne Mane', executive: 'Lalitha' },
    { restaurant: 'Dilli Bhature Chole', executive: 'Lalitha' },
    { restaurant: 'Big Scoop cafe', executive: 'Lalitha' },
    { restaurant: 'Desi Veg Cravings', executive: 'Lalitha' },
    { restaurant: 'Devansh Momos Corner', executive: 'Lalitha' },
  ],

  '2026-04-24': [
    { restaurant: 'sankalpa reddy Restaurant(1)', executive: 'Shruthi' },
    { restaurant: 'sankalpa reddy Restaurant(2)', executive: 'Shruthi' },
    { restaurant: 'sankalpa reddy Restaurant(3)', executive: 'Shruthi' },
    { restaurant: 'sankalpa reddy Restaurant(4)', executive: 'Shruthi' },
    { restaurant: 'Antarastriya momo pasta (1)', executive: 'Shruthi' },
    { restaurant: 'Antarastriya momo pasta (2)', executive: 'Shruthi' },
    { restaurant: 'Antarastriya momo pasta (3)', executive: 'Shruthi' },
    { restaurant: 'Antarastriya momo pasta (4)', executive: 'Shruthi' },
    { restaurant: 'shareat panipuri', executive: 'Shruthi' },
    { restaurant: 'Cafe Corner', executive: 'Lalitha' },
    { restaurant: 'Kavin Restaurant', executive: 'Lalitha' },
    { restaurant: 'The Shades', executive: 'Lalitha' },
    { restaurant: 'Bhojan Bhavan', executive: 'Lalitha' },
    { restaurant: 'Hasanamba Iyengers Cake Mane', executive: 'Lalitha' },
    { restaurant: 'Luv u Bhojan', executive: 'Lalitha' },
    { restaurant: 'MBS Mandi House [1]', executive: 'Bareen' },
    { restaurant: 'MBS Mandi House [2]', executive: 'Bareen' },
    { restaurant: 'MBS Mandi House [3]', executive: 'Bareen' },
    { restaurant: 'DirtyDogs [1]', executive: 'Bareen' },
    { restaurant: 'DirtyDogs [2]', executive: 'Bareen' },
    { restaurant: 'S M Bakery', executive: 'Bareen' },
    { restaurant: 'Yakshee Cafe', executive: 'Bareen' },
  ],

  '2026-04-25': [
    { restaurant: '24 Parganas' },
    { restaurant: 'Ohhdaily - Healthy & Homely Tiffins [1]' },
    { restaurant: 'Ohhdaily - Healthy & Homely Tiffins [2]' },
    { restaurant: 'RR Chats [1]' },
    { restaurant: 'RR Chats [2]' },
    { restaurant: 'Naidu Hotel' },
    { restaurant: 'Chakadola sweets' },
    { restaurant: 'Meghana biriyani' },
    { restaurant: "Dande's Biriyani" },
    { restaurant: 'Regal Feast' },
    { restaurant: 'Sri banashakari Military hotel' },
    { restaurant: 'food king' },
    { restaurant: 'Lassi And Juice' },
    { restaurant: 'Samskruthi Grand' },
    { restaurant: 'Breezy Cow Bar (1)' },
    { restaurant: 'Breezy Cow Bar (2)' },
    { restaurant: 'Cafe Prassiddhi Pure Veg' },
    { restaurant: 'Oasis Dine House' },
    { restaurant: 'Udaram Bharnam' },
    { restaurant: 'Mana Vijayawada Ruchulu' },
    { restaurant: 'Chennupati canteen' },
    { restaurant: 'Shri Krishna Bhavan' },
    { restaurant: 'Apna Punjabi Dhaba' },
    { restaurant: 'The Pulp Fiction' },
    { restaurant: 'For Food Lovers' },
    { restaurant: 'Bazabi' },
  ],

  '2026-04-27': [
    { restaurant: 'Anjanadris Palace', executive: 'Bareen' },
    { restaurant: 'Cafe Aahaara', executive: 'Bareen' },
    { restaurant: 'Jerry Cafe', executive: 'Bareen' },
    { restaurant: 'Kerala Kitchen By Savoury', executive: 'Bareen' },
    { restaurant: 'New York Pizza Co', executive: 'Bareen' },
    { restaurant: 'SLN Mushroom Biryani', executive: 'Bareen' },
    { restaurant: 'Sri Shivanandi Mushroom Donne Biriyani House', executive: 'Bareen' },
    { restaurant: 'Vinayaka Refreshments', executive: 'Bareen' },
    { restaurant: 'Bangalore Restaurant', executive: 'Lalitha' },
    { restaurant: 'Biryani Junction', executive: 'Manyata' },
    { restaurant: "Shelly's Deli", executive: 'Manyata' },
    { restaurant: 'Biryani Station', executive: 'Neshavani' },
    { restaurant: 'Hungry Tomato', executive: 'Neshavani' },
    { restaurant: 'Delicious Momos', executive: 'Shruthi' },
    { restaurant: 'Kannur Restaurant', executive: 'Shruthi' },
    { restaurant: 'Millets Family', executive: 'Shruthi' },
    { restaurant: 'Yum Yum Korean Bucket', executive: 'Shruthi' },
  ],
}

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

function formatDateLabel(dateStr: string) {
  return new Date(`${dateStr}T12:00:00+05:30`).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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

function buildHistoricalRows(date: string): OnboardedRow[] {
  const rows = HISTORICAL_ROWS[date] || []

  return rows.map((row) => ({
    brand_name: row.restaurant,
    converted_at: date,
    converted_at_label: formatDateLabel(date),
    changed_by: row.executive || '—',
    source_sheet: HISTORICAL_SOURCE_NAME,
  }))
}

function dedupeRows(rows: OnboardedRow[]) {
  const seen = new Set<string>()
  const output: OnboardedRow[] = []

  for (const row of rows) {
    const key = `${row.brand_name.trim().toLowerCase()}::${row.converted_at}`

    if (seen.has(key)) continue

    seen.add(key)
    output.push(row)
  }

  return output
}

/**
 * Permanent future-date logic.
 *
 * The sync route should set:
 * - restaurants.onboarded_at
 * - restaurants.onboarded_business_date
 *
 * This page reads that stored business date.
 * It no longer guesses using updated_at / synced_at / activity log timestamps.
 */
async function buildOnboardedRowsFromRestaurants(
  supabase: ReturnType<typeof createClient>,
  date: string
): Promise<OnboardedRow[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'restaurant_name, assigned_to_name, source_sheet, onboarded_at, onboarded_business_date, converted, lead_status'
    )
    .eq('onboarded_business_date', date)
    .order('onboarded_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = (data || [])
    .filter((row: any) => normalizeStatus(row.lead_status, row.converted) === 'converted')
    .map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      converted_at: date,
      converted_at_label: formatDateLabel(date),
      changed_by: row.assigned_to_name || '—',
      source_sheet: row.source_sheet || ACTIVITY_SOURCE_NAME,
    }))

  return dedupeRows(rows)
}

async function buildTotalRows(supabase: ReturnType<typeof createClient>, search: string) {
  const rows = await fetchAllActiveRestaurants(
    supabase,
    'id, restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, onboarded_at, onboarded_business_date, lead_status, converted, is_deactivated'
  )

  return (rows || [])
    .filter((row: any) => normalizeStatus(row.lead_status, row.converted) === 'converted')
    .map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      assigned_to: row.assigned_to_name || 'Unassigned',
      source_sheet: row.source_sheet || TOTAL_SOURCE_NAME,
      last_updated: row.onboarded_at || row.updated_at || row.synced_at || null,
      last_updated_label: formatDateTimeIST(row.onboarded_at || row.updated_at || row.synced_at || null),
    }))
    .filter((row: any) => matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const selectedDate = (searchParams.get('date') || searchParams.get('from') || getDefaultYesterdayIST()).trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const supabase = getSupabaseAdmin()

    const dailySourceRows =
      selectedDate <= HISTORICAL_END_DATE
        ? buildHistoricalRows(selectedDate)
        : await buildOnboardedRowsFromRestaurants(supabase, selectedDate)

    const dailyBrands = dailySourceRows.filter((row) =>
      matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search)
    )

    const allBrands = await buildTotalRows(supabase, search)

    return NextResponse.json({
      success: true,
      summary: {
        selectedDate,
        fromDate: selectedDate,
        toDate: selectedDate,
        yesterdayCount: dailyBrands.length,
        totalBrandsTillDate: allBrands.length,
      },
      yesterdayBrands: dailyBrands,
      allBrands,
      source:
        selectedDate <= HISTORICAL_END_DATE
          ? `${HISTORICAL_SOURCE_NAME} for selected-day verified report; ${TOTAL_SOURCE_NAME} for total`
          : `${ACTIVITY_SOURCE_NAME} from restaurants.onboarded_business_date; ${TOTAL_SOURCE_NAME} for total`,
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
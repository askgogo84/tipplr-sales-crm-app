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
const ACTIVITY_SOURCE_NAME = 'CRM Activity Log'
const TOTAL_SOURCE_NAME = 'CRM Converted Restaurants'
const HISTORICAL_END_DATE = '2026-04-27'

const HISTORICAL_CSV = `date,restaurant,executive
2026-04-22,Kayalum Kadalum,Bareen
2026-04-22,Bungalow 47,Bareen
2026-04-22,Al-Ansar Hotel,Bareen
2026-04-22,Fanoos Xpress Since 1975,Bareen
2026-04-22,Fanoos Xprss Since 1975,Bareen
2026-04-22,Sri Hari Khadya Bhandar,Bareen
2026-04-22,HOTEL FANOOS SINCE 1975,Bareen
2026-04-22,HOTEL FANOOS SINCE 1975,Bareen
2026-04-22,hotel aditya,Shruthi
2026-04-22,bist dhaba (2),Shruthi
2026-04-22,bist dhaba (2),Shruthi
2026-04-22,ahhar veg,Shruthi
2026-04-22,indian grill house,Shruthi
2026-04-22,sitara veg,Shruthi
2026-04-22,tandoori nights,Shruthi
2026-04-22,sai sagaar,Shruthi
2026-04-22,Ganesh Food Corner,Keerthana
2026-04-22,Big Wok Chinese,Keerthana
2026-04-22,A1 Delhi Dum Chicken Biryani,Keerthana
2026-04-22,The coffee House,Lalitha
2026-04-22,Attil Multi cuisine Restaurant,Lalitha
2026-04-22,Udupi Sagar,Lalitha
2026-04-22,Crack'D Cafe,Lalitha
2026-04-22,Achayans Cafe 2.0,Lalitha
2026-04-22,Bazabi,Lalitha
2026-04-22,The Kerala Mess,Lalitha
2026-04-22,Sabari Juice Junction,Neshavani
2026-04-22,Kabab Mehal,Neshavani
2026-04-22,Kabab Mehak,Neshavani
2026-04-22,Kabab Street,Neshavani
2026-04-22,Pattanshetty Hotel,Neshavani
2026-04-23,Hotel Baaduta,Shruthi
2026-04-23,Mizo Kitchen,Shruthi
2026-04-23,Mrs Iyengar kitchen,Shruthi
2026-04-23,shree guru sagar,Shruthi
2026-04-23,bhyrava biriyani,Shruthi
2026-04-23,Moms singh,Shruthi
2026-04-23,Star Biryani,Keerthana
2026-04-23,Board 4 Bored,Keerthana
2026-04-23,Jain bites,Keerthana
2026-04-23,Bowled over by Board 4 Bored,Keerthana
2026-04-23,99 Variety Dosa And Pav Bhaji,Keerthana
2026-04-23,Five Star,Keerthana
2026-04-23,Sri Hari Khadya Bhandar,Bareen
2026-04-23,Delhi Flavour,Bareen
2026-04-23,Mysuru Thindiies [1],Bareen
2026-04-23,Mysuru Thindiies [2],Bareen
2026-04-23,New Darbar Family Restaurant,Bareen
2026-04-23,Jai Bhavani Hotel,Bareen
2026-04-23,Madurai Tiffin Center,Bareen
2026-04-23,The Benne Mane,Lalitha
2026-04-23,Dilli Bhature Chole,Lalitha
2026-04-23,Big Scoop cafe,Lalitha
2026-04-23,Desi Veg Cravings,Lalitha
2026-04-23,Devansh Momos Corner,Lalitha
2026-04-24,sankalpa reddy Restaurant(1),Shruthi
2026-04-24,sankalpa reddy Restaurant(2),Shruthi
2026-04-24,sankalpa reddy Restaurant(3),Shruthi
2026-04-24,sankalpa reddy Restaurant(4),Shruthi
2026-04-24,Antarastriya momo pasta (1),Shruthi
2026-04-24,Antarastriya momo pasta (2),Shruthi
2026-04-24,Antarastriya momo pasta (3),Shruthi
2026-04-24,Antarastriya momo pasta (4),Shruthi
2026-04-24,shareat panipuri,Shruthi
2026-04-24,Cafe Corner,Lalitha
2026-04-24,Kavin Restaurant,Lalitha
2026-04-24,The Shades,Lalitha
2026-04-24,Bhojan Bhavan,Lalitha
2026-04-24,Hasanamba Iyengers Cake Mane,Lalitha
2026-04-24,Luv u Bhojan,Lalitha
2026-04-24,MBS Mandi House [1],Bareen
2026-04-24,MBS Mandi House [2],Bareen
2026-04-24,MBS Mandi House [3],Bareen
2026-04-24,DirtyDogs [1],Bareen
2026-04-24,DirtyDogs [2],Bareen
2026-04-24,S M Bakery,Bareen
2026-04-24,Yakshee Cafe,Bareen
2026-04-25,24 Parganas,—
2026-04-25,Ohhdaily - Healthy & Homely Tiffins [1],—
2026-04-25,Ohhdaily - Healthy & Homely Tiffins [2],—
2026-04-25,RR Chats [1],—
2026-04-25,RR Chats [2],—
2026-04-25,Naidu Hotel,—
2026-04-25,Chakadola sweets,—
2026-04-25,Meghana biriyani,—
2026-04-25,Dande's Biriyani,—
2026-04-25,Regal Feast,—
2026-04-25,Sri banashakari Military hotel,—
2026-04-25,food king,—
2026-04-25,Lassi And Juice,—
2026-04-25,Samskruthi Grand,—
2026-04-25,Breezy Cow Bar (1),—
2026-04-25,Breezy Cow Bar (2),—
2026-04-25,Cafe Prassiddhi Pure Veg,—
2026-04-25,Oasis Dine House,—
2026-04-25,Udaram Bharnam,—
2026-04-25,Mana Vijayawada Ruchulu,—
2026-04-25,Chennupati canteen,—
2026-04-25,Shri Krishna Bhavan,—
2026-04-25,Apna Punjabi Dhaba,—
2026-04-25,The Pulp Fiction,—
2026-04-25,For Food Lovers,—
2026-04-25,Bazabi,—
2026-04-27,Anjanadris Palace,Bareen
2026-04-27,Cafe Aahaara,Bareen
2026-04-27,Jerry Cafe,Bareen
2026-04-27,Kerala Kitchen By Savoury,Bareen
2026-04-27,New York Pizza Co,Bareen
2026-04-27,SLN Mushroom Biryani,Bareen
2026-04-27,Sri Shivanandi Mushroom Donne Biriyani House,Bareen
2026-04-27,Vinayaka Refreshments,Bareen
2026-04-27,Bangalore Restaurant,Lalitha
2026-04-27,Biryani Junction,Manyata
2026-04-27,Shelly's Deli,Manyata
2026-04-27,Biryani Station,Neshavani
2026-04-27,Hungry Tomato,Neshavani
2026-04-27,Delicious Momos,Shruthi
2026-04-27,Kannur Restaurant,Shruthi
2026-04-27,Millets Family,Shruthi
2026-04-27,Yum Yum Korean Bucket,Shruthi`

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

function startOfISTDayUtc(dateStr: string) {
  return new Date(`${dateStr}T00:00:00+05:30`).toISOString()
}

function endOfISTDayUtc(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999+05:30`).toISOString()
}

function matchesSearch(values: unknown[], search: string) {
  if (!search) return true
  return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(search))
}

function isRealConvertedTransition(row: any) {
  const oldStatus = String(row.old_status || '').trim().toLowerCase()
  const newStatus = String(row.new_status || '').trim().toLowerCase()
  const changedBy = String(row.changed_by || '').trim().toLowerCase()
  return newStatus === 'converted' && oldStatus !== 'converted' && changedBy !== '' && changedBy !== 'sheet sync' && changedBy !== 'system'
}

function buildHistoricalRows(): OnboardedRow[] {
  return HISTORICAL_CSV.trim().split('\n').slice(1).map((line) => {
    const [date, restaurant, executive = '—'] = line.split(',')
    return {
      brand_name: restaurant.trim(),
      converted_at: date.trim(),
      converted_at_label: formatDateLabel(date.trim()),
      changed_by: executive.trim() || '—',
      source_sheet: HISTORICAL_SOURCE_NAME,
    }
  })
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

async function buildActivityRowsForDate(supabase: any, date: string): Promise<OnboardedRow[]> {
  const { data, error } = await supabase
    .from('restaurant_activity_log')
    .select('restaurant_name, source_sheet, changed_by, old_status, new_status, changed_at')
    .gte('changed_at', startOfISTDayUtc(date))
    .lte('changed_at', endOfISTDayUtc(date))
    .order('changed_at', { ascending: false })
  if (error) throw new Error(error.message)
  return dedupeRows((data || []).filter(isRealConvertedTransition).map((row: any) => ({
    brand_name: row.restaurant_name || '—',
    converted_at: date,
    converted_at_label: formatDateLabel(date),
    changed_by: row.changed_by || '—',
    source_sheet: row.source_sheet || ACTIVITY_SOURCE_NAME,
  })))
}

async function buildTotalRows(supabase: any, search: string) {
  const rows = await fetchAllActiveRestaurants(
    supabase,
    'id, restaurant_name, assigned_to_name, source_sheet, updated_at, synced_at, lead_status, converted, is_deactivated'
  )
  return (rows || [])
    .filter((row: any) => normalizeStatus(row.lead_status, row.converted) === 'converted')
    .map((row: any) => ({
      brand_name: row.restaurant_name || '—',
      assigned_to: row.assigned_to_name || 'Unassigned',
      source_sheet: row.source_sheet || TOTAL_SOURCE_NAME,
      last_updated: row.updated_at || row.synced_at || null,
      last_updated_label: formatDateTimeIST(row.updated_at || row.synced_at || null),
    }))
    .filter((row: any) => matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const selectedDate = (searchParams.get('date') || searchParams.get('from') || getDefaultYesterdayIST()).trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const supabase = getSupabaseAdmin()
    const dailySourceRows = selectedDate <= HISTORICAL_END_DATE ? buildHistoricalRows() : await buildActivityRowsForDate(supabase, selectedDate)
    const dailyBrands = dailySourceRows.filter((row) => row.converted_at === selectedDate).filter((row) => matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search))
    const allBrands = await buildTotalRows(supabase, search)
    return NextResponse.json({
      success: true,
      summary: { selectedDate, fromDate: selectedDate, toDate: selectedDate, yesterdayCount: dailyBrands.length, totalBrandsTillDate: allBrands.length },
      yesterdayBrands: dailyBrands,
      allBrands,
      source: selectedDate <= HISTORICAL_END_DATE ? `${HISTORICAL_SOURCE_NAME} for selected-day verified report; ${TOTAL_SOURCE_NAME} for total` : `${ACTIVITY_SOURCE_NAME} real converted transitions only; ${TOTAL_SOURCE_NAME} for total`,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

type RawRow = { date: string; restaurant: string; executive: string }
type OnboardedRow = {
  brand_name: string
  converted_at: string
  converted_at_label: string
  changed_by: string
  source_sheet: string
}

const SOURCE_NAME = 'Outlet count as on 22 23 24 April'

const ROWS: RawRow[] = [
  ['2026-04-22', 'Kayalum Kadalum', 'Bareen'],
  ['2026-04-22', 'Bungalow 47', 'Bareen'],
  ['2026-04-22', 'Al-Ansar Hotel', 'Bareen'],
  ['2026-04-22', 'Fanoos Xpress Since 1975', 'Bareen'],
  ['2026-04-22', 'Fanoos Xprss Since 1975', 'Bareen'],
  ['2026-04-22', 'Sri Hari Khadya Bhandar', 'Bareen'],
  ['2026-04-22', 'hotel aditya', 'Shruthi'],
  ['2026-04-22', 'bist dhaba (2)', 'Shruthi'],
  ['2026-04-22', 'bist dhaba (2)', 'Shruthi'],
  ['2026-04-22', 'ahhar veg', 'Shruthi'],
  ['2026-04-22', 'indian grill house', 'Shruthi'],
  ['2026-04-22', 'sitara veg', 'Shruthi'],
  ['2026-04-22', 'tandoori nights', 'Shruthi'],
  ['2026-04-22', 'sai sagaar', 'Shruthi'],
  ['2026-04-22', 'Ganesh Food Corner', 'Keerthana'],
  ['2026-04-22', 'The coffee House', 'Lalitha'],
  ['2026-04-22', 'Attil Multi cuisine Restaurant', 'Lalitha'],
  ['2026-04-22', 'Udupi Sagar', 'Lalitha'],
  ['2026-04-22', "Crack'D Cafe", 'Lalitha'],
  ['2026-04-22', 'Achayans Cafe 2.0', 'Lalitha'],
  ['2026-04-22', 'Bazabi', 'Lalitha'],
  ['2026-04-22', 'The Kerala Mess', 'Lalitha'],
  ['2026-04-22', 'Sabari Juice Junction', 'Neshvani'],
  ['2026-04-22', 'Kabab Mehal', 'Neshvani'],
  ['2026-04-22', 'Kabab Mehak', 'Neshvani'],
  ['2026-04-22', 'Kabab Street', 'Neshvani'],
  ['2026-04-22', 'Pattanshetty Hotel', 'Neshvani'],
  ['2026-04-23', 'Hotel Baaduta', 'Shruthi'],
  ['2026-04-23', 'Mizo Kitchen', 'Shruthi'],
  ['2026-04-23', 'Mrs Iyengar kitchen', 'Shruthi'],
  ['2026-04-23', 'shree guru sagar', 'Shruthi'],
  ['2026-04-23', 'bhyrava biriyani', 'Shruthi'],
  ['2026-04-23', 'Moms singh', 'Shruthi'],
  ['2026-04-23', 'Star Biryani', 'Keerthana'],
  ['2026-04-23', 'Board 4 Bored', 'Keerthana'],
  ['2026-04-23', 'Jain bites', 'Keerthana'],
  ['2026-04-23', 'Bowled over by Board 4 Bored', 'Keerthana'],
  ['2026-04-23', 'Sri Hari Khadya Bhandar', 'Bareen'],
  ['2026-04-23', 'Delhi Flavour', 'Bareen'],
  ['2026-04-23', 'Mysuru Thindiies [1]', 'Bareen'],
  ['2026-04-23', 'Mysuru Thindiies [2]', 'Bareen'],
  ['2026-04-23', 'New Darbar Family Restaurant', 'Bareen'],
  ['2026-04-23', 'Jai Bhavani Hotel', 'Bareen'],
  ['2026-04-23', 'Madurai Tiffin Center', 'Bareen'],
  ['2026-04-23', 'The Benne Mane', 'Lalitha'],
  ['2026-04-23', 'Dilli Bhature Chole', 'Lalitha'],
  ['2026-04-23', 'Big Scoop cafe', 'Lalitha'],
  ['2026-04-23', 'Desi Veg Cravings', 'Lalitha'],
  ['2026-04-23', 'Devansh Momos Corner', 'Lalitha'],
  ['2026-04-24', 'sankalpa reddy Restaurant(1)', 'Shruthi'],
  ['2026-04-24', 'sankalpa reddy Restaurant(2)', 'Shruthi'],
  ['2026-04-24', 'sankalpa reddy Restaurant(3)', 'Shruthi'],
  ['2026-04-24', 'sankalpa reddy Restaurant(4)', 'Shruthi'],
  ['2026-04-24', 'Antarastriya momo pasta (1)', 'Shruthi'],
  ['2026-04-24', 'Antarastriya momo pasta (2)', 'Shruthi'],
  ['2026-04-24', 'Antarastriya momo pasta (3)', 'Shruthi'],
  ['2026-04-24', 'Antarastriya momo pasta (4)', 'Shruthi'],
  ['2026-04-24', 'shareat panipuri', 'Shruthi'],
  ['2026-04-24', 'Cafe Corner', 'Lalitha'],
  ['2026-04-24', 'Kavin Restaurant', 'Lalitha'],
  ['2026-04-24', 'The Shades', 'Lalitha'],
  ['2026-04-24', 'Bhojan Bhavan', 'Lalitha'],
  ['2026-04-24', 'Hasanamba Iyengers Cake Mane', 'Lalitha'],
  ['2026-04-24', 'Luv u Bhojan', 'Lalitha'],
  ['2026-04-24', 'MBS Mandi House [1]', 'Bareen'],
  ['2026-04-24', 'MBS Mandi House [2]', 'Bareen'],
  ['2026-04-24', 'MBS Mandi House [3]', 'Bareen'],
  ['2026-04-24', 'DirtyDogs [1]', 'Bareen'],
  ['2026-04-24', 'DirtyDogs [2]', 'Bareen'],
  ['2026-04-24', 'S M Bakery', 'Bareen'],
  ['2026-04-24', 'Yakshee Cafe', 'Bareen'],
].map(([date, restaurant, executive]) => ({ date, restaurant, executive }))

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

function matchesSearch(values: unknown[], search: string) {
  if (!search) return true
  return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(search))
}

function buildRows(): OnboardedRow[] {
  return ROWS.map((row) => ({
    brand_name: row.restaurant,
    converted_at: row.date,
    converted_at_label: formatDateLabel(row.date),
    changed_by: row.executive,
    source_sheet: SOURCE_NAME,
  }))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const selectedDate = (searchParams.get('date') || searchParams.get('from') || getDefaultYesterdayIST()).trim()
  const search = (searchParams.get('search') || '').trim().toLowerCase()

  const rows = buildRows()
  const allBrands = rows
    .map((row) => ({
      brand_name: row.brand_name,
      assigned_to: row.changed_by,
      source_sheet: row.source_sheet,
      last_updated: row.converted_at,
      last_updated_label: row.converted_at_label,
    }))
    .filter((row) => matchesSearch([row.brand_name, row.assigned_to, row.source_sheet], search))

  const dailyBrands = rows
    .filter((row) => row.converted_at === selectedDate)
    .filter((row) => matchesSearch([row.brand_name, row.changed_by, row.source_sheet], search))

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
    source: SOURCE_NAME,
  })
}

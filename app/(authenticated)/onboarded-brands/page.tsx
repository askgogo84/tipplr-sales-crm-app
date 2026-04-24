'use client'

import { useEffect, useState } from 'react'

type YesterdayBrand = {
  brand_name: string
  converted_at: string
  converted_at_label: string
  changed_by: string
  source_sheet: string
}

type AllBrand = {
  brand_name: string
  assigned_to: string
  source_sheet: string
  last_updated: string
  last_updated_label: string
}

type ApiResponse = {
  success: boolean
  summary: {
    fromDate: string
    toDate: string
    yesterdayCount: number
    totalBrandsTillDate: number
  }
  yesterdayBrands: YesterdayBrand[]
  allBrands: AllBrand[]
}

function getDefaultYesterday() {
  const now = new Date()
  now.setDate(now.getDate() - 1)
  return now.toISOString().slice(0, 10)
}

export default function OnboardedBrandsPage() {
  const yesterdayDefault = getDefaultYesterday()

  const [fromDate, setFromDate] = useState(yesterdayDefault)
  const [toDate, setToDate] = useState(yesterdayDefault)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)

  const [summary, setSummary] = useState({
    fromDate: yesterdayDefault,
    toDate: yesterdayDefault,
    yesterdayCount: 0,
    totalBrandsTillDate: 0,
  })

  const [yesterdayBrands, setYesterdayBrands] = useState<YesterdayBrand[]>([])
  const [allBrands, setAllBrands] = useState<AllBrand[]>([])

  async function loadData(currentFrom = fromDate, currentTo = toDate, currentSearch = search) {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (currentFrom) params.set('from', currentFrom)
      if (currentTo) params.set('to', currentTo)
      if (currentSearch.trim()) params.set('search', currentSearch.trim())

      const res = await fetch(`/api/onboarded-brands?${params.toString()}`, {
        cache: 'no-store',
      })

      const data: ApiResponse = await res.json()

      if (!res.ok || !data.success) {
        console.error('Onboarded brands API error:', data)
        setYesterdayBrands([])
        setAllBrands([])
        return
      }

      setSummary(data.summary)
      setYesterdayBrands(data.yesterdayBrands || [])
      setAllBrands(data.allBrands || [])
    } catch (error) {
      console.error('Failed to load onboarded brands', error)
      setYesterdayBrands([])
      setAllBrands([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(fromDate, toDate, search)
  }, [])

  function applyFilters() {
    loadData(fromDate, toDate, search)
  }

  function resetFilters() {
    const y = getDefaultYesterday()
    setFromDate(y)
    setToDate(y)
    setSearch('')
    setSearchInput('')
    loadData(y, y, '')
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    loadData(fromDate, toDate, searchInput)
  }

  function downloadRangeCsv() {
    const params = new URLSearchParams()
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    if (search.trim()) params.set('search', search.trim())
    window.open(`/api/onboarded-brands/export?type=range&${params.toString()}`, '_blank')
  }

  function downloadAllCsv() {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    window.open(`/api/onboarded-brands/export?type=all&${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          Onboarded Brands
        </h1>
        <p className="mt-1 sm:mt-2 text-sm text-slate-500">
          Filter brands by date range and download the exact result
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_180px_minmax(0,1fr)_auto_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <form onSubmit={handleSearchSubmit}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              type="text"
              placeholder="Search brand, sheet, changed by..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </form>

          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply Filter
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={downloadRangeCsv}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
            Brands in Selected Date Range
          </div>
          <div className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-semibold text-emerald-600">
            {summary.yesterdayCount}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {summary.fromDate} to {summary.toDate}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Onboarded Brands Till Date
              </div>
              <div className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-semibold text-slate-900">
                {summary.totalBrandsTillDate}
              </div>
            </div>

            <button
              onClick={downloadAllCsv}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Download All CSV
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Brands in Selected Date Range</h2>
        <p className="mt-1 text-sm text-slate-500">
          Based on activity log entries moved to Converted in the selected period
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Brand Name</div>
            <div>Converted At</div>
            <div>Changed By</div>
            <div>Source Sheet</div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-sm text-slate-500">Loading...</div>
          ) : yesterdayBrands.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">No brands found for selected date range.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {yesterdayBrands.map((brand, idx) => (
                <div key={`${brand.brand_name}-${idx}`} className="grid grid-cols-4 gap-4 px-4 py-4 text-sm">
                  <div className="font-medium text-slate-900">{brand.brand_name}</div>
                  <div className="text-slate-600">{brand.converted_at_label}</div>
                  <div className="text-slate-600">{brand.changed_by}</div>
                  <div className="text-slate-600">{brand.source_sheet}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">All Onboarded Brands Till Date</h2>
        <p className="mt-1 text-sm text-slate-500">
          All brands currently marked as Converted
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Brand Name</div>
            <div>Assigned To</div>
            <div>Source Sheet</div>
            <div>Last Updated</div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-sm text-slate-500">Loading...</div>
          ) : allBrands.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">No onboarded brands found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allBrands.map((brand, idx) => (
                <div key={`${brand.brand_name}-${idx}`} className="grid grid-cols-4 gap-4 px-4 py-4 text-sm">
                  <div className="font-medium text-slate-900">{brand.brand_name}</div>
                  <div className="text-slate-600">{brand.assigned_to}</div>
                  <div className="text-slate-600">{brand.source_sheet}</div>
                  <div className="text-slate-600">{brand.last_updated_label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

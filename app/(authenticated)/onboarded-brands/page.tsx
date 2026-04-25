'use client'

import { useEffect, useState } from 'react'

type DailyBrand = {
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
  last_updated: string | null
  last_updated_label: string
}

type OnboardedApiResponse = {
  success: boolean
  error?: string
  source?: string
  summary: {
    selectedDate?: string
    fromDate: string
    toDate: string
    yesterdayCount: number
    totalBrandsTillDate: number
  }
  yesterdayBrands: DailyBrand[]
  allBrands: AllBrand[]
}

function getDefaultYesterdayIST() {
  const now = new Date()
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  istDate.setDate(istDate.getDate() - 1)
  return istDate.toLocaleDateString('en-CA')
}

export default function OnboardedBrandsPage() {
  const defaultDate = getDefaultYesterdayIST()

  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [sourceName, setSourceName] = useState('Merchant Logs History')

  const [summary, setSummary] = useState({
    selectedDate: defaultDate,
    yesterdayCount: 0,
    totalBrandsTillDate: 0,
  })

  const [dailyBrands, setDailyBrands] = useState<DailyBrand[]>([])
  const [allBrands, setAllBrands] = useState<AllBrand[]>([])

  async function loadData(currentDate = selectedDate, currentSearch = search) {
    try {
      setLoading(true)
      setErrorText('')

      const params = new URLSearchParams()
      if (currentDate) params.set('date', currentDate)
      if (currentSearch.trim()) params.set('search', currentSearch.trim())

      const res = await fetch(`/api/onboarded-brands?${params.toString()}`, {
        cache: 'no-store',
      })

      const data: OnboardedApiResponse = await res.json()

      if (!res.ok || !data.success) {
        console.error('Onboarded brands API error:', data)
        setDailyBrands([])
        setAllBrands([])
        setSummary({
          selectedDate: currentDate,
          yesterdayCount: 0,
          totalBrandsTillDate: 0,
        })
        setErrorText(data?.error || 'Could not load onboarded brands.')
        return
      }

      setSourceName(data.source || 'Merchant Logs History')
      setDailyBrands(data.yesterdayBrands || [])
      setAllBrands((data.allBrands || []).slice(0, 100))
      setSummary({
        selectedDate: data.summary.selectedDate || data.summary.fromDate || currentDate,
        yesterdayCount: data.summary.yesterdayCount || 0,
        totalBrandsTillDate: data.summary.totalBrandsTillDate || 0,
      })
    } catch (error) {
      console.error('Failed to load onboarded brands', error)
      setDailyBrands([])
      setAllBrands([])
      setSummary({
        selectedDate: currentDate,
        yesterdayCount: 0,
        totalBrandsTillDate: 0,
      })
      setErrorText('Could not load onboarded brands. Please check the Merchant Logs History tab and redeploy if needed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedDate, search)
  }, [])

  function applyFilters() {
    setSearch(searchInput)
    loadData(selectedDate, searchInput)
  }

  function resetFilters() {
    const y = getDefaultYesterdayIST()
    setSelectedDate(y)
    setSearch('')
    setSearchInput('')
    loadData(y, '')
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    applyFilters()
  }

  function downloadDailyCsv() {
    const params = new URLSearchParams({ type: 'range' })
    if (selectedDate) params.set('date', selectedDate)
    if (search.trim()) params.set('search', search.trim())
    window.open(`/api/onboarded-brands/export?${params.toString()}`, '_blank')
  }

  function downloadAllCsv() {
    const params = new URLSearchParams({ type: 'all' })
    if (search.trim()) params.set('search', search.trim())
    window.open(`/api/onboarded-brands/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          Onboarded Brands
        </h1>
        <p className="mt-1 sm:mt-2 text-sm text-slate-500">
          Source of truth: {sourceName}. Select one date to see that day’s onboarded brands.
        </p>
      </div>

      {errorText && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorText}
        </div>
      )}

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_minmax(0,1fr)_auto_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Onboarded Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <form onSubmit={handleSearchSubmit}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              type="text"
              placeholder="Search brand or executive..."
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
              Apply
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
              onClick={downloadDailyCsv}
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
            Brands Onboarded On Selected Day
          </div>
          <div className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-semibold text-emerald-600">
            {summary.yesterdayCount}
          </div>
          <div className="mt-1 text-sm text-slate-500">{summary.selectedDate}</div>
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
        <h2 className="text-xl font-semibold text-slate-900">Brands Onboarded On Selected Day</h2>
        <p className="mt-1 text-sm text-slate-500">
          This table reads from {sourceName}: Date, Restaurant and Executives.
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Brand Name</div>
            <div>Onboarded Date</div>
            <div>Executive</div>
            <div>Source</div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-sm text-slate-500">Loading...</div>
          ) : dailyBrands.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">No brands onboarded on this day.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dailyBrands.map((brand, idx) => (
                <div key={`${brand.brand_name}-${brand.source_sheet}-${idx}`} className="grid grid-cols-4 gap-4 px-4 py-4 text-sm">
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
          Showing first 100 logged onboarded brands from {sourceName}. Use Download All CSV for the full export.
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Brand Name</div>
            <div>Executive</div>
            <div>Source</div>
            <div>Onboarded Date</div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-sm text-slate-500">Loading...</div>
          ) : allBrands.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">No onboarded brands found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allBrands.map((brand, idx) => (
                <div key={`${brand.brand_name}-${brand.source_sheet}-${idx}`} className="grid grid-cols-4 gap-4 px-4 py-4 text-sm">
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

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

type DailyApiResponse = {
  success: boolean
  summary: {
    selectedDate?: string
    fromDate: string
    toDate: string
    yesterdayCount: number
  }
  yesterdayBrands: DailyBrand[]
}

type RestaurantsApiResponse = {
  success: boolean
  data: Array<{
    restaurant_name: string | null
    assigned_to_name: string | null
    source_sheet: string | null
    updated_at: string | null
    synced_at?: string | null
  }>
  stats: {
    convertedTillDate: number
  }
  pagination: {
    total: number
  }
}

function getDefaultYesterdayIST() {
  const now = new Date()
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  istDate.setDate(istDate.getDate() - 1)
  return istDate.toLocaleDateString('en-CA')
}

function formatDateTimeIST(value: string | null | undefined) {
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

export default function OnboardedBrandsPage() {
  const defaultDate = getDefaultYesterdayIST()

  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')

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

      const dailyParams = new URLSearchParams()
      if (currentDate) dailyParams.set('date', currentDate)
      if (currentSearch.trim()) dailyParams.set('search', currentSearch.trim())

      const convertedParams = new URLSearchParams({
        status: 'Converted',
        page: '1',
        pageSize: '100',
      })
      if (currentSearch.trim()) convertedParams.set('search', currentSearch.trim())

      const [dailyRes, convertedRes] = await Promise.all([
        fetch(`/api/onboarded-brands?${dailyParams.toString()}`, { cache: 'no-store' }),
        fetch(`/api/restaurants?${convertedParams.toString()}`, { cache: 'no-store' }),
      ])

      const dailyData: DailyApiResponse = await dailyRes.json()
      const convertedData: RestaurantsApiResponse = await convertedRes.json()

      if (!dailyRes.ok || !dailyData.success) {
        console.error('Daily onboarded API error:', dailyData)
        setDailyBrands([])
      } else {
        setDailyBrands(dailyData.yesterdayBrands || [])
      }

      if (!convertedRes.ok || !convertedData.success) {
        console.error('Converted restaurants API error:', convertedData)
        setAllBrands([])
        setSummary({
          selectedDate: dailyData?.summary?.selectedDate || currentDate,
          yesterdayCount: dailyData?.summary?.yesterdayCount || 0,
          totalBrandsTillDate: 0,
        })
        setErrorText('Could not load total onboarded brands from Restaurants API.')
        return
      }

      const convertedRows = convertedData.data || []
      const mappedAllBrands = convertedRows.map((row) => ({
        brand_name: row.restaurant_name || '—',
        assigned_to: row.assigned_to_name || 'Unassigned',
        source_sheet: row.source_sheet || '—',
        last_updated: row.updated_at || row.synced_at || null,
        last_updated_label: formatDateTimeIST(row.updated_at || row.synced_at),
      }))

      setAllBrands(mappedAllBrands)
      setSummary({
        selectedDate: dailyData?.summary?.selectedDate || dailyData?.summary?.fromDate || currentDate,
        yesterdayCount: dailyData?.summary?.yesterdayCount || 0,
        totalBrandsTillDate:
          convertedData.stats?.convertedTillDate ?? convertedData.pagination?.total ?? mappedAllBrands.length,
      })
    } catch (error) {
      console.error('Failed to load onboarded brands', error)
      setDailyBrands([])
      setAllBrands([])
      setErrorText('Could not load onboarded brands. Please refresh after deployment completes.')
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
    const params = new URLSearchParams()
    if (selectedDate) params.set('date', selectedDate)
    if (search.trim()) params.set('search', search.trim())
    window.open(`/api/onboarded-brands/export?type=range&${params.toString()}`, '_blank')
  }

  function downloadAllCsv() {
    const params = new URLSearchParams({
      status: 'Converted',
    })
    if (search.trim()) params.set('search', search.trim())
    window.open(`/api/restaurants/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          Onboarded Brands
        </h1>
        <p className="mt-1 sm:mt-2 text-sm text-slate-500">
          Select one day to see brands newly onboarded on that day
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
          This table shows only brands whose status changed to Converted on the selected day.
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
          Showing first 100 currently converted brands. Use Download All CSV for the full export.
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

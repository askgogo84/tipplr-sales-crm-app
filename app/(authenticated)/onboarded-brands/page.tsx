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

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 break-words text-sm font-medium text-slate-700">{value || '—'}</div>
    </div>
  )
}

export default function OnboardedBrandsPage() {
  const defaultDate = getDefaultYesterdayIST()

  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [sourceName, setSourceName] = useState('Onboarding reports')

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

      const res = await fetch(`/api/onboarded-brands?${params.toString()}`, { cache: 'no-store' })
      const data: OnboardedApiResponse = await res.json()

      if (!res.ok || !data.success) {
        setDailyBrands([])
        setAllBrands([])
        setSummary({ selectedDate: currentDate, yesterdayCount: 0, totalBrandsTillDate: 0 })
        setErrorText(data?.error || 'Could not load onboarded brands.')
        return
      }

      setSourceName(data.source || 'Onboarding reports')
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
      setSummary({ selectedDate: currentDate, yesterdayCount: 0, totalBrandsTillDate: 0 })
      setErrorText('Could not load onboarded brands. Please refresh once deployment completes.')
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
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Onboarded Brands</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selected-day list shows only restaurant names from the verified onboarding report. Total uses CRM converted restaurants.
        </p>
      </div>

      {errorText && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorText}
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_minmax(0,1fr)_auto_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Onboarded Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <form onSubmit={handleSearchSubmit}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
            <input
              type="text"
              placeholder="Search restaurant name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </form>

          <div className="flex items-end"><button onClick={applyFilters} className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800">Apply</button></div>
          <div className="flex items-end"><button onClick={resetFilters} className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Reset</button></div>
          <div className="flex items-end"><button onClick={downloadDailyCsv} className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700">Download CSV</button></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Selected Day</div>
          <div className="mt-1 text-3xl font-semibold text-emerald-600 sm:text-4xl">{summary.yesterdayCount}</div>
          <div className="mt-1 text-xs text-slate-500 sm:text-sm">{summary.selectedDate}</div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="flex h-full flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Total Till Date</div>
              <div className="mt-1 text-3xl font-semibold text-slate-900 sm:text-4xl">{summary.totalBrandsTillDate}</div>
            </div>
            <button onClick={downloadAllCsv} className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800 sm:h-10 sm:px-4 sm:text-sm">Download All CSV</button>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Brands Onboarded On Selected Day</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Source: {sourceName}</p>

        <div className="mt-5 block space-y-3 sm:hidden">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 px-4 py-8 text-sm text-slate-500">Loading...</div>
          ) : dailyBrands.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 px-4 py-8 text-sm text-slate-500">No brands onboarded on this day.</div>
          ) : (
            dailyBrands.map((brand, idx) => (
              <div key={`${brand.brand_name}-${idx}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{idx + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="break-words text-base font-semibold leading-6 text-slate-900">{brand.brand_name}</div>
                  <div className="mt-1 text-xs text-slate-500">{brand.converted_at_label}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 sm:block">
          <div className="grid grid-cols-[80px_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>SL No</div><div>Restaurant Name</div>
          </div>
          {loading ? <div className="px-4 py-10 text-sm text-slate-500">Loading...</div> : dailyBrands.length === 0 ? <div className="px-4 py-10 text-sm text-slate-500">No brands onboarded on this day.</div> : (
            <div className="divide-y divide-slate-100">{dailyBrands.map((brand, idx) => (
              <div key={`${brand.brand_name}-${brand.source_sheet}-${idx}`} className="grid grid-cols-[80px_1fr] gap-4 px-4 py-4 text-sm">
                <div className="text-slate-500">{idx + 1}</div><div className="font-medium text-slate-900">{brand.brand_name}</div>
              </div>
            ))}</div>
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">All Onboarded Brands Till Date</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Showing first 100 converted brands from CRM. Use Download All CSV for the full export.</p>

        <div className="mt-5 block space-y-3 sm:hidden">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 px-4 py-8 text-sm text-slate-500">Loading...</div>
          ) : allBrands.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 px-4 py-8 text-sm text-slate-500">No onboarded brands found.</div>
          ) : (
            allBrands.map((brand, idx) => (
              <div key={`${brand.brand_name}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-base font-semibold leading-6 text-slate-900">{brand.brand_name}</div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <DetailPill label="Executive" value={brand.assigned_to} />
                  <DetailPill label="Source" value={brand.source_sheet} />
                  <DetailPill label="Last Updated" value={brand.last_updated_label} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 sm:block">
          <div className="grid grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Brand Name</div><div>Executive</div><div>Source</div><div>Last Updated</div>
          </div>
          {loading ? <div className="px-4 py-10 text-sm text-slate-500">Loading...</div> : allBrands.length === 0 ? <div className="px-4 py-10 text-sm text-slate-500">No onboarded brands found.</div> : (
            <div className="divide-y divide-slate-100">{allBrands.map((brand, idx) => (
              <div key={`${brand.brand_name}-${brand.source_sheet}-${idx}`} className="grid grid-cols-4 gap-4 px-4 py-4 text-sm">
                <div className="font-medium text-slate-900">{brand.brand_name}</div><div className="text-slate-600">{brand.assigned_to}</div><div className="text-slate-600">{brand.source_sheet}</div><div className="text-slate-600">{brand.last_updated_label}</div>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  )
}

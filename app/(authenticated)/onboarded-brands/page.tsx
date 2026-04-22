"use client"

import { useEffect, useMemo, useState } from "react"

type BrandRow = {
  brand_name: string
  source_sheet?: string
  changed_by?: string
  assigned_to_name?: string
  converted_at?: string | null
  updated_at?: string | null
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function OnboardedBrandsPage() {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [yesterdayBrands, setYesterdayBrands] = useState<BrandRow[]>([])
  const [allBrands, setAllBrands] = useState<BrandRow[]>([])
  const [yesterdayCount, setYesterdayCount] = useState(0)
  const [totalConvertedBrands, setTotalConvertedBrands] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch("/api/onboarded-brands", { cache: "no-store" })
        const data = await res.json()

        if (res.ok) {
          setYesterdayBrands(data.yesterdayBrands || [])
          setAllBrands(data.allBrands || [])
          setYesterdayCount(data.yesterdayCount || 0)
          setTotalConvertedBrands(data.totalConvertedBrands || 0)
        } else {
          console.error(data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredAllBrands = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allBrands
    return allBrands.filter((b) => b.brand_name.toLowerCase().includes(q))
  }, [search, allBrands])

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          Onboarded Brands
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Converted yesterday and all onboarded brands till date
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Brands Onboarded Yesterday
          </div>
          <div className="mt-2 text-4xl font-bold text-emerald-600">
            {yesterdayCount}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Onboarded Brands Till Date
          </div>
          <div className="mt-2 text-4xl font-bold text-slate-900">
            {totalConvertedBrands}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Brands Onboarded Yesterday
          </h2>
          <p className="text-sm text-slate-500">
            Based on real activity log entries moved to Converted yesterday
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : yesterdayBrands.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No brands were logged as converted yesterday.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>Brand Name</div>
              <div>Converted At</div>
              <div>Changed By</div>
              <div>Source Sheet</div>
            </div>
            {yesterdayBrands.map((brand, idx) => (
              <div
                key={`${brand.brand_name}-${idx}`}
                className="grid grid-cols-4 border-t border-slate-100 px-4 py-3 text-sm text-slate-700"
              >
                <div className="font-medium text-slate-900">{brand.brand_name}</div>
                <div>{formatDate(brand.converted_at)}</div>
                <div>{brand.changed_by || "—"}</div>
                <div>{brand.source_sheet || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              All Onboarded Brands Till Date
            </h2>
            <p className="text-sm text-slate-500">
              Search all brands currently marked as converted
            </p>
          </div>

          <input
            type="text"
            placeholder="Search brand name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full sm:w-[320px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
          />
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : filteredAllBrands.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No onboarded brands found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>Brand Name</div>
              <div>Assigned To</div>
              <div>Source Sheet</div>
              <div>Last Updated</div>
            </div>
            {filteredAllBrands.map((brand, idx) => (
              <div
                key={`${brand.brand_name}-${idx}`}
                className="grid grid-cols-4 border-t border-slate-100 px-4 py-3 text-sm text-slate-700"
              >
                <div className="font-medium text-slate-900">{brand.brand_name}</div>
                <div>{brand.assigned_to_name || "—"}</div>
                <div>{brand.source_sheet || "—"}</div>
                <div>{formatDate(brand.updated_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

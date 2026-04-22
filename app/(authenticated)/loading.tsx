export default function AuthenticatedLoading() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-pulse">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-10 w-64 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-40 rounded bg-slate-100" />
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="mt-4 h-12 w-28 rounded bg-slate-300" />
          <div className="mt-3 h-4 w-36 rounded bg-slate-100" />
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="mt-4 h-12 w-24 rounded bg-slate-300" />
          <div className="mt-3 h-4 w-48 rounded bg-slate-100" />
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="mt-4 h-12 w-20 rounded bg-slate-300" />
          <div className="mt-3 h-4 w-24 rounded bg-slate-100" />
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="mt-4 h-12 w-24 rounded bg-slate-300" />
          <div className="mt-3 h-4 w-32 rounded bg-slate-100" />
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
        <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="h-20 rounded-2xl bg-slate-100" />
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-44 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-60 rounded bg-slate-100" />
        <div className="mt-5 space-y-3">
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

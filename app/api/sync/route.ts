'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type SyncResult = {
  type: 'success' | 'error'
  message: string
  detail?: string
} | null

export default function SyncButton() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState<SyncResult>(null)

  async function handleSync() {
    setSyncing(true)
    setToast(null)

    try {
      // Your sync endpoint is GET, not POST
      const res = await fetch('/api/sync', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error(`Sync failed (status ${res.status})`)
      }

      const data = await res.json()

      if (data.success) {
        const errorCount =
          (data.rowErrors?.length || 0) + (data.batchErrors?.length || 0)

        setToast({
          type: 'success',
          message: `Synced ${data.synced} restaurants from "${data.sheet}"`,
          detail:
            errorCount > 0
              ? `${errorCount} row(s) had issues — check console`
              : undefined,
        })

        if (errorCount > 0) {
          console.warn('Sync completed with errors:', {
            rowErrors: data.rowErrors,
            batchErrors: data.batchErrors,
          })
        }

        // Refresh dashboard data without full page reload
        router.refresh()
      } else {
        setToast({
          type: 'error',
          message: data.error || 'Sync failed. Check the sheet and try again.',
        })
      }
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Network error during sync',
      })
    } finally {
      setSyncing(false)
      // Auto-hide toast after 6 seconds
      setTimeout(() => setToast(null), 6000)
    }
  }

  return (
    <>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <svg
          className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {syncing ? 'Syncing...' : 'Sync Sheets'}
      </button>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 left-6 sm:left-auto max-w-sm px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="font-medium flex items-start gap-2">
            <span className="flex-shrink-0">
              {toast.type === 'success' ? '✓' : '✕'}
            </span>
            <span>{toast.message}</span>
          </div>
          {toast.detail && (
            <div className="text-xs mt-1 opacity-80 ml-6">{toast.detail}</div>
          )}
        </div>
      )}
    </>
  )
}
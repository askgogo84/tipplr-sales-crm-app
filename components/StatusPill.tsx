type StatusConfig = {
  bg: string
  text: string
  border: string
  dot: string
}

// Exact statuses from your Sheet's "Status" column + default "Lead"
const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Positive / success
  Agreed: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  Converted: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },

  // Active / needs attention
  Followup: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  'Call Back': {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  Visit: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },

  // Warning
  "Couldn't Connect": {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  'Temporarily Closed': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },

  // Negative / dead
  'Not Interested': {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  'Incorrect Number': {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  'Wrong Number': {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  'Invalid Number': {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  'Permanently Closed': {
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    border: 'border-rose-300',
    dot: 'bg-rose-600',
  },

  // Default / neutral
  Lead: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
}

const DEFAULT_CONFIG: StatusConfig = {
  bg: 'bg-slate-100',
  text: 'text-slate-800',
  border: 'border-slate-200',
  dot: 'bg-slate-500',
}

type StatusPillProps = {
  status?: string | null
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
}

export default function StatusPill({
  status,
  size = 'md',
  showDot = true,
}: StatusPillProps) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
        —
      </span>
    )
  }

  const config = STATUS_CONFIG[status] || DEFAULT_CONFIG

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs sm:text-sm',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`}
        />
      )}
      {status}
    </span>
  )
}
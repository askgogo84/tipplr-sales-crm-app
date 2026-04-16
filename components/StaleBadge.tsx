type StaleBadgeProps = {
  updatedAt?: string | null
  status?: string | null
}

export default function StaleBadge({ updatedAt, status }: StaleBadgeProps) {
  const inactiveStatuses = [
    'Converted',
    'Agreed',
    'Not Interested',
    'Permanently Closed',
    'Invalid Number',
    'Incorrect Number',
    'Wrong Number',
  ]

  if (status && inactiveStatuses.includes(status)) {
    return null
  }

  if (!updatedAt) return null

  const now = new Date()
  const updated = new Date(updatedAt)

  if (isNaN(updated.getTime())) return null

  const diffMs = now.getTime() - updated.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  let label: string
  let colorClass: string

  if (diffMinutes < 1) {
    label = 'just now'
    colorClass = 'bg-green-50 text-green-700 border-green-200'
  } else if (diffMinutes < 60) {
    label = `${diffMinutes}m ago`
    colorClass = 'bg-green-50 text-green-700 border-green-200'
  } else if (diffHours < 24) {
    label = `${diffHours}h ago`
    colorClass = 'bg-green-50 text-green-700 border-green-200'
  } else if (diffDays <= 2) {
    label = `${diffDays}d ago`
    colorClass = 'bg-green-50 text-green-700 border-green-200'
  } else if (diffDays <= 5) {
    label = `${diffDays}d ago`
    colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200'
  } else if (diffDays <= 14) {
    label = `${diffDays}d ago`
    colorClass = 'bg-orange-50 text-orange-700 border-orange-200'
  } else {
    label = `${diffDays}d ago`
    colorClass = 'bg-red-50 text-red-700 border-red-200'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}
      title={`Last updated: ${updated.toLocaleString('en-IN')}`}
    >
      {label}
    </span>
  )
}
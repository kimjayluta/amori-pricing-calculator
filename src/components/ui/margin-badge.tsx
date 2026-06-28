import { getMarginStatus, type MarginStatus } from '@/lib/pricing-engine'
import { formatPercent, cn } from '@/lib/utils'

const PILL: Record<MarginStatus, string> = {
  danger:    'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  warning:   'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  good:      'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  great:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  excellent: 'bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-400',
}

const TEXT: Record<MarginStatus, string> = {
  danger:    'text-red-500',
  warning:   'text-amber-500',
  good:      'text-green-600',
  great:     'text-emerald-600',
  excellent: 'text-teal-500',
}

export function MarginBadge({
  margin,
  showLabel = false,
  variant = 'pill',
  className,
}: {
  margin: number
  showLabel?: boolean
  variant?: 'pill' | 'text'
  className?: string
}) {
  const status = getMarginStatus(margin)
  const label = formatPercent(margin)

  if (variant === 'text') {
    return (
      <span className={cn('font-medium tabular-nums', TEXT[status], className)}>
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        PILL[status],
        className,
      )}
    >
      {label}
      {showLabel && <span className="ml-1 opacity-70 capitalize">· {status}</span>}
    </span>
  )
}

export { PILL as MARGIN_PILL, TEXT as MARGIN_TEXT }
export type { MarginStatus }

import { useSupabaseSession } from '@/hooks/useAuth'
import { useQuota } from '@/hooks/useQuota'

/** "1 analysis" but "0 analyses" and "3 analyses". */
function analyses(count: number | undefined) {
  return count === 1 ? 'analysis' : 'analyses'
}

function formatReset(resetsAt: string | null | undefined) {
  if (!resetsAt) return null
  const date = new Date(resetsAt)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * "3 of 5 analyses left" — one allowance across every AI feature.
 *
 * A CBC analysis, a disease classification, and a breed identification each
 * spend one analysis from the same count, so this number means the same thing
 * wherever it is shown.
 *
 * Falls back to the plain rate while the count is in flight or if the endpoint
 * is unreachable — a missing number should never read as zero analyses left.
 */
export function QuotaBadge({
  className = '',
  /**
   * Name what the number counts. On a feature's own card header the
   * surrounding UI supplies that; standing alone — a global header, a
   * dashboard — "3 of 5 left" of what is anyone's guess.
   */
  withContext = false,
}: {
  className?: string
  withContext?: boolean
}) {
  const { data: quota, isError } = useQuota()
  const { session } = useSupabaseSession()

  // `authenticated` is the truth once it lands; until then the session keeps
  // the fallback from telling a signed-in user they have 2 free tries.
  const authed = quota?.authenticated ?? Boolean(session)
  const known = !isError && quota != null

  const noun = withContext ? ` ${analyses(quota?.remaining)}` : ''
  const label = known
    ? `${quota.remaining} of ${quota.limit}${noun} left`
    : authed
      ? `5${withContext ? ' analyses' : ''} per 5 hrs`
      : withContext
        ? '2 free analyses'
        : '2 free tries'

  const tone = !known
    ? 'bg-blue-100 text-blue-700'
    : quota.remaining === 0
      ? 'bg-rose-100 text-rose-700'
      : quota.remaining <= 1
        ? 'bg-amber-100 text-amber-800'
        : 'bg-blue-100 text-blue-700'

  const resetLabel = formatReset(quota?.resets_at)
  const note = authed
    ? 'Shared across CBC Analyzer, Classify Disease, and Classify Breed.'
    : 'Free analyses — sign in for more.'
  const title = known
    ? [
        `${quota.remaining} of ${quota.limit} ${analyses(quota.remaining)} left`,
        resetLabel ? `Resets at ${resetLabel}.` : null,
        note,
      ]
        .filter(Boolean)
        .join(' · ')
    : note

  return (
    <span
      title={title}
      aria-live="polite"
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone} ${className}`}
    >
      {label}
    </span>
  )
}

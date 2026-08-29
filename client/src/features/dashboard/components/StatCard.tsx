import type { ComponentType, SVGProps } from 'react'

type StatCardProps = {
  label: string
  value: number | undefined
  loading: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Percent change against the previous window, when the API supplies one. */
  change?: number | null
  /** How to read a positive change — abnormal results going up is not good news. */
  changeIntent?: 'more-is-good' | 'more-is-bad' | 'neutral'
  hint?: string
  accent?: 'blue' | 'emerald' | 'amber' | 'slate'
}

const ACCENTS = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-slate-500',
} as const

export function StatCard({
  label,
  value,
  loading,
  icon: Icon,
  change,
  changeIntent = 'neutral',
  hint,
  accent = 'slate',
}: StatCardProps) {
  const hasChange = !loading && change !== null && change !== undefined
  const positive = (change ?? 0) >= 0

  const changeTone =
    changeIntent === 'neutral'
      ? 'text-slate-500'
      : (changeIntent === 'more-is-good') === positive
        ? 'text-emerald-600'
        : 'text-red-500'

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ACCENTS[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3.5 flex items-baseline gap-2">
        {loading ? (
          <span className="inline-block h-8 w-14 animate-pulse rounded bg-slate-100" />
        ) : (
          <span className="text-[30px] leading-none font-extrabold tabular-nums text-slate-900">
            {value ?? 0}
          </span>
        )}
        {hasChange ? (
          <span className={`text-[12.5px] font-bold ${changeTone}`}>
            {positive ? '+' : '−'}
            {Math.abs(change)}%
          </span>
        ) : null}
      </div>

      {hint ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

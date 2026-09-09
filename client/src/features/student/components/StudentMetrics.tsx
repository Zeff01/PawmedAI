import type { ComponentType, ReactNode } from 'react'
import { Flag, Flame, LineChart, Trophy } from 'lucide-react'

import { useStudentProgress } from '../hooks/useAcademy'

type IconProps = { className?: string }

const STREAK_MILESTONES = [7, 14, 30, 60, 100]

function nextMilestone(days: number) {
  return STREAK_MILESTONES.find((mark) => mark > days) ?? null
}

function MetricCard({
  label,
  icon: Icon,
  children,
  aside,
}: {
  label: string
  icon: ComponentType<IconProps>
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
          {label}
        </p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">{children}</div>
        {aside}
      </div>
    </div>
  )
}

function Figure({
  value,
  unit,
  loading,
}: {
  value: string
  unit?: string
  loading: boolean
}) {
  if (loading) {
    return (
      <span className="block h-8 w-16 animate-pulse rounded bg-slate-100" />
    )
  }
  return (
    <div className="text-[30px] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums">
      {value}
      {unit ? (
        <span className="ml-1.5 text-[14px] font-normal text-slate-500">
          {unit}
        </span>
      ) : null}
    </div>
  )
}

function Chip({
  tone = 'blue',
  children,
}: {
  tone?: 'blue' | 'slate' | 'amber' | 'emerald'
  children: ReactNode
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  } as const
  return (
    <span
      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function StudentMetrics() {
  const { data, isLoading, isError } = useStudentProgress()
  const loading = isLoading || (isError && !data)

  const milestone = nextMilestone(data?.streak_days ?? 0)

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Points earned" icon={Trophy}>
        <Figure
          value={String(data?.points ?? 0)}
          unit="pts"
          loading={loading}
        />
        {!loading && data ? (
          <Chip>
            {data.stages_answered} stage
            {data.stages_answered === 1 ? '' : 's'} answered
          </Chip>
        ) : null}
      </MetricCard>

      <MetricCard label="Diagnostic accuracy" icon={LineChart}>
        <Figure
          value={data?.accuracy === null ? '—' : `${data?.accuracy ?? 0}%`}
          loading={loading}
        />
        {!loading && data ? (
          <Chip tone={data.accuracy === null ? 'slate' : 'blue'}>
            {data.accuracy === null
              ? 'Answer a stage to start scoring'
              : 'Right first time'}
          </Chip>
        ) : null}
      </MetricCard>

      <MetricCard label="Learning streak" icon={Flame}>
        <Figure
          value={String(data?.streak_days ?? 0)}
          unit="days"
          loading={loading}
        />
        {!loading && data ? (
          <span className="mt-2 flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <Flag className="size-3 text-slate-400" />
            {milestone ? (
              <>
                Next milestone:{' '}
                <strong className="font-bold text-slate-700">
                  {milestone} days
                </strong>
              </>
            ) : (
              <strong className="font-bold text-slate-700">
                Longest streak yet
              </strong>
            )}
          </span>
        ) : null}
      </MetricCard>
    </section>
  )
}

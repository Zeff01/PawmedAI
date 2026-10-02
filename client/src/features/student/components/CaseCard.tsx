import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { CheckCircle2, Clock, Layers, Stethoscope, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { DIFFICULTY_LABEL, relativeTime, speciesMeta } from '../caseMeta'
import type { CaseDifficulty, CaseSummary } from '../api/academy'

const DIFFICULTY_DOT: Record<CaseDifficulty, string> = {
  beginner: 'bg-emerald-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-violet-500',
}

/** One segment per stage: cleared, the one being worked on, or still ahead. */
function StageTrack({
  cleared,
  total,
  completed,
  label,
}: {
  cleared: number
  total: number
  completed: boolean
  label: string
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={cleared}
      aria-valuemin={0}
      aria-valuemax={total}
      className="flex gap-1"
    >
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors duration-500',
            index < cleared
              ? completed
                ? 'bg-emerald-500'
                : 'bg-blue-600'
              : index === cleared
                ? 'bg-blue-200'
                : 'bg-slate-200',
          )}
        />
      ))}
    </div>
  )
}

export function CaseCard({ summary }: { summary: CaseSummary }) {
  const { progress } = summary
  const species = speciesMeta(summary.species)
  const lastActive = relativeTime(progress.last_active)
  const inProgress = progress.started && !progress.completed

  return (
    <article className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow,transform] duration-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-200 hover:-translate-y-px hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5">
      <div className="flex gap-4 p-4 sm:p-5">
        <img
          src={species.photo}
          alt={species.photoAlt}
          loading="lazy"
          decoding="async"
          className="hidden size-20 shrink-0 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-900/5 sm:block"
        />

        <div className="min-w-0 flex-1">
          {/* Classification + status */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
              <span className="truncate">
                {species.adjective} · {summary.discipline}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-0.5 font-semibold text-slate-700">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    DIFFICULTY_DOT[summary.difficulty],
                  )}
                />
                {DIFFICULTY_LABEL[summary.difficulty]}
              </span>
            </div>

            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
                progress.completed
                  ? 'bg-emerald-50 text-emerald-700'
                  : inProgress
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-100 text-slate-600',
              )}
            >
              {progress.completed ? (
                <>
                  <Trophy className="size-3" />
                  {progress.points_earned} pts earned
                </>
              ) : inProgress ? (
                <>
                  <Clock className="size-3" />
                  {lastActive ? `Active ${lastActive}` : 'In progress'}
                </>
              ) : (
                'Not started'
              )}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-[15.5px] leading-snug font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-700">
            {summary.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-600">
            {summary.presentation}
          </p>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
            <li className="inline-flex items-center gap-1.5">
              <Stethoscope className="size-3.5 text-slate-400" />
              {summary.body_system}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Layers className="size-3.5 text-slate-400" />
              {progress.total_stages} stages
            </li>
            {!progress.completed && (
              <li className="inline-flex items-center gap-1.5">
                <Trophy className="size-3.5 text-slate-400" />
                {summary.total_points} pts
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Progress + action */}
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-[12px]">
            <p className="min-w-0 truncate font-semibold text-slate-800">
              <span className="font-medium text-slate-500">
                {progress.completed
                  ? 'Completed'
                  : inProgress
                    ? 'Up next:'
                    : 'Starts with:'}
              </span>{' '}
              {progress.completed
                ? 'every stage cleared'
                : (progress.current_stage_title ?? 'the first stage')}
            </p>
            {progress.started && (
              <span
                className={cn(
                  'shrink-0 text-[11px] font-semibold tabular-nums',
                  progress.completed ? 'text-emerald-700' : 'text-slate-500',
                )}
              >
                {progress.cleared_stages}/{progress.total_stages}
              </span>
            )}
          </div>
          {progress.started && (
            <StageTrack
              cleared={progress.cleared_stages}
              total={progress.total_stages}
              completed={progress.completed}
              label={`${summary.title}: ${progress.cleared_stages} of ${progress.total_stages} stages cleared`}
            />
          )}
        </div>

        {/* The ::after stretches the link over the card, so the whole card opens the case */}
        <Link
          to="/academy/$slug"
          params={{ slug: summary.slug }}
          className={cn(
            'inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-[12.5px] font-semibold transition-colors after:absolute after:inset-0 after:content-[""] focus-visible:outline-none sm:w-auto',
            progress.completed
              ? 'border border-slate-200 bg-white text-slate-700 group-hover:border-blue-200 group-hover:text-blue-700'
              : 'bg-blue-600 text-white shadow-sm group-hover:bg-blue-700',
          )}
        >
          {progress.completed
            ? 'Review findings'
            : inProgress
              ? 'Continue case'
              : 'Start case'}
          {progress.completed ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          )}
        </Link>
      </div>
    </article>
  )
}

import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { CheckCircle2, Clock, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { DIFFICULTY_TONE, relativeTime, speciesMeta } from '../caseMeta'
import type { CaseSummary } from '../api/academy'

export function CaseCard({ summary }: { summary: CaseSummary }) {
  const { progress } = summary
  const species = speciesMeta(summary.species)
  const lastActive = relativeTime(progress.last_active)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md md:p-6">
      {/* Classification row */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11.5px] font-semibold text-blue-700">
            {species.adjective} · {summary.discipline}
          </span>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-wide uppercase',
              DIFFICULTY_TONE[summary.difficulty],
            )}
          >
            {summary.difficulty}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-400">
          {progress.completed ? (
            <>
              <Trophy className="size-3.5 text-emerald-500" />
              Completed · {progress.points_earned} pts
            </>
          ) : lastActive ? (
            <>
              <Clock className="size-3.5" />
              Last active {lastActive}
            </>
          ) : (
            <>
              <Clock className="size-3.5" />
              Not started · {summary.total_points} pts on offer
            </>
          )}
        </span>
      </div>

      {/* Presentation */}
      <div className="mt-4 flex flex-col items-start gap-4 md:flex-row">
        <img
          src={species.photo}
          alt={species.photoAlt}
          loading="lazy"
          decoding="async"
          className="h-28 w-full shrink-0 rounded-xl bg-slate-100 object-cover md:w-36"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-[16px] leading-snug font-bold text-slate-900">
            {summary.title}
          </h3>
          <p className="text-[13px] leading-relaxed text-slate-600">
            {summary.presentation}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-0.5 text-[11.5px]">
            <span className="text-slate-400">
              System:{' '}
              <strong className="font-semibold text-slate-700">
                {summary.body_system}
              </strong>
            </span>
            <span className="text-slate-400">
              Stage:{' '}
              <span
                className={cn(
                  'font-semibold',
                  progress.completed ? 'text-emerald-600' : 'text-blue-600',
                )}
              >
                {progress.completed
                  ? 'All stages cleared'
                  : (progress.current_stage_title ?? 'Ready to start')}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress + action */}
      <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row">
        <div className="w-full space-y-1.5 sm:max-w-xs">
          <div className="flex justify-between text-[11px] font-medium text-slate-500">
            <span>
              Progress: {progress.cleared_stages} of {progress.total_stages}{' '}
              stages
            </span>
            <span
              className={cn(
                'font-bold',
                progress.completed ? 'text-emerald-600' : 'text-blue-600',
              )}
            >
              {progress.percent}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`${summary.title} progress`}
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                progress.completed ? 'bg-emerald-500' : 'bg-blue-600',
              )}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <Link
          to="/academy/$slug"
          params={{ slug: summary.slug }}
          className={cn(
            'inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-colors sm:w-auto',
            progress.completed
              ? 'bg-white text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white'
              : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
          )}
        >
          {progress.completed
            ? 'Review findings'
            : progress.started
              ? 'Continue case'
              : 'Start case'}
          {progress.completed ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <ArrowRightIcon className="h-4 w-4" />
          )}
        </Link>
      </div>
    </article>
  )
}

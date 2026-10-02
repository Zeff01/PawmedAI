import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { CheckCircle2, Clock, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { DIFFICULTY_LABEL, relativeTime, speciesMeta } from '../caseMeta'
import type { CaseSummary } from '../api/academy'

export function CaseCard({ summary }: { summary: CaseSummary }) {
  const { progress } = summary
  const species = speciesMeta(summary.species)
  const lastActive = relativeTime(progress.last_active)

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5">
      <div className="p-4 sm:p-5">
        {/* Classification row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              {species.adjective} · {summary.discipline}
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
              {DIFFICULTY_LABEL[summary.difficulty]}
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-600">
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
        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
          <img
            src={species.photo}
            alt={species.photoAlt}
            loading="lazy"
            decoding="async"
            className="h-40 w-full shrink-0 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-900/5 sm:h-24 sm:w-24"
          />

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-[16px] leading-snug font-bold tracking-tight text-slate-900">
              {summary.title}
            </h3>
            <p className="text-[11.5px] text-slate-600">
              <span className="font-medium">Body system:</span>{' '}
              {summary.body_system}
            </p>
            <p className="text-[13px] leading-relaxed text-slate-700">
              {summary.presentation}
            </p>
          </div>
        </div>
      </div>

      {/* Progress + action */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-100 px-4 py-3 sm:flex-row sm:gap-5 sm:px-5">
        <div className="w-full min-w-0 flex-1 space-y-2">
          <p className="text-[12px] font-semibold text-slate-900">
            <span className="mr-1 font-medium text-slate-600">
              {progress.completed ? 'Completed:' : 'Next step:'}
            </span>{' '}
            {progress.completed
              ? 'All stages cleared'
              : (progress.current_stage_title ?? 'Start the first stage')}
          </p>
          <div className="flex justify-between gap-3 text-[11px] font-medium text-slate-600">
            <span>
              {progress.cleared_stages} of {progress.total_stages} stages
              cleared
            </span>
            <span
              className={cn(
                'font-bold',
                progress.completed ? 'text-emerald-700' : 'text-blue-700',
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
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-300"
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
            'inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto',
            progress.completed
              ? 'bg-white text-blue-700 shadow-sm hover:bg-blue-600 hover:text-white'
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

import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { relativeTime, speciesMeta } from '../caseMeta'
import { useCases, useStudentProgress } from '../hooks/useAcademy'
import type { CaseSummary } from '../api/academy'

/** How many unfinished cases the card lists before it stops and counts. */
const SHOWN = 3

/** Most recently touched first; a case never opened sorts last. */
function byLastActive(a: CaseSummary, b: CaseSummary) {
  const left = a.progress.last_active
    ? Date.parse(a.progress.last_active)
    : -Infinity
  const right = b.progress.last_active
    ? Date.parse(b.progress.last_active)
    : -Infinity
  return right - left
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function ResumeRow({ summary }: { summary: CaseSummary }) {
  const { progress } = summary
  const species = speciesMeta(summary.species)
  const lastActive = relativeTime(progress.last_active)

  return (
    <li>
      <Link
        to="/academy/$slug"
        params={{ slug: summary.slug }}
        className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-blue-50"
      >
        <img
          src={species.photo}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="h-11 w-11 shrink-0 rounded-lg bg-slate-100 object-cover"
        />

        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[12.5px] font-semibold text-slate-900">
              {summary.title}
            </span>
            <span className="shrink-0 text-[11px] font-bold text-blue-600 tabular-nums">
              {progress.percent}%
            </span>
          </span>

          <span className="block truncate text-[11.5px] text-slate-500">
            Next: {progress.current_stage_title ?? 'Ready to start'}
          </span>

          <ProgressBar
            percent={progress.percent}
            label={`${summary.title} progress`}
          />

          <span className="flex items-center gap-1 text-[10.5px] text-slate-400">
            <Clock className="size-3" />
            {lastActive
              ? `Last active ${lastActive}`
              : `${summary.total_points} pts on offer`}
            <span aria-hidden>·</span>
            {progress.cleared_stages}/{progress.total_stages} stages
          </span>
        </span>
      </Link>
    </li>
  )
}

function StartRow({ summary }: { summary: CaseSummary }) {
  const species = speciesMeta(summary.species)

  return (
    <Link
      to="/academy/$slug"
      params={{ slug: summary.slug }}
      className="group flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-blue-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-white">
        <PlayCircle className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-slate-900">
          {summary.title}
        </span>
        <span className="block truncate text-[11.5px] text-slate-500">
          {species.adjective} · {summary.discipline} · {summary.total_points}{' '}
          pts
        </span>
      </span>
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500" />
    </Link>
  )
}

export function ContinueCasesCard() {
  const { data: cases, isLoading, isError } = useCases()
  const { data: progress } = useStudentProgress()

  const unfinished = (cases ?? [])
    .filter((item) => item.progress.started && !item.progress.completed)
    .sort(byLastActive)

  const nextUp = (cases ?? []).find((item) => !item.progress.started) ?? null
  const hidden = Math.max(unfinished.length - SHOWN, 0)

  const available = progress?.cases_available ?? cases?.length ?? 0

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900">
            Pick up where you left off
          </h3>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Cases you've opened but not yet closed.
          </p>
        </div>
        {unfinished.length > 0 ? (
          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 tabular-nums">
            {unfinished.length}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <ul className="space-y-2">
          {[0, 1].map((row) => (
            <li key={row} className="flex items-start gap-3 p-2.5">
              <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <p className="rounded-xl bg-slate-50 px-3 py-4 text-[11.5px] text-slate-500">
          Your case progress couldn't be loaded just now. Reload the page to try
          again.
        </p>
      ) : unfinished.length > 0 ? (
        <>
          <ul className="space-y-1">
            {unfinished.slice(0, SHOWN).map((summary) => (
              <ResumeRow key={summary.slug} summary={summary} />
            ))}
          </ul>
          {hidden > 0 ? (
            <p className="px-2.5 text-[11px] text-slate-400">
              +{hidden} more case{hidden === 1 ? '' : 's'} in progress below.
            </p>
          ) : null}
        </>
      ) : nextUp ? (
        <div className="space-y-2">
          <p className="text-[11.5px] text-slate-500">
            Nothing half-finished — start a fresh one:
          </p>
          <StartRow summary={nextUp} />
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-3">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <p className="text-[11.5px] font-semibold text-emerald-800">
            {available
              ? 'Every case in the library is cleared. New ones land each block.'
              : 'No cases published yet — check back soon.'}
          </p>
        </div>
      )}
    </div>
  )
}

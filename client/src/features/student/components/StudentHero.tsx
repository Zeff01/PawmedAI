import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from '@heroicons/react/24/solid'

import { useMe } from '@/hooks/useAuth'
import { useCases, useStudentProgress } from '../hooks/useAcademy'

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function StudentHero() {
  const { data: me } = useMe()
  const { data: progress } = useStudentProgress()
  const { data: cases } = useCases()

  const inProgress = cases
    ?.filter((item) => item.progress.started && !item.progress.completed)
    .sort((a, b) => b.progress.percent - a.progress.percent)[0]
  const fresh = cases?.find((item) => !item.progress.started)
  const nextCase = inProgress ?? fresh ?? null

  const firstName = me ? me.first_name.trim() || me.username : null

  return (
    <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 via-slate-50 p-6 md:p-8">
      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-slate-900 md:text-[32px]">
            {greeting(new Date().getHours())}
            {firstName ? `, ${firstName}` : ', future veterinarian'}.
          </h1>

          <p className="max-w-2xl text-[14px] leading-relaxed text-slate-600 md:text-[15px]">
            {progress && progress.stages_answered > 0 ? (
              <>
                You've banked{' '}
                <span className="font-semibold text-blue-600">
                  {progress.points} points
                </span>{' '}
                across {progress.cases_completed} completed case
                {progress.cases_completed === 1 ? '' : 's'}.
              </>
            ) : (
              <>
                Work a case the way you would work a patient: history, then
                diagnostics, then differentials, then a diagnosis you commit to.
              </>
            )}{' '}
            {nextCase ? (
              <>
                Next up:{' '}
                <span className="font-medium text-slate-900">
                  {nextCase.title}
                </span>
                .
              </>
            ) : cases?.length ? (
              <span className="font-medium text-slate-900">
                Every case in the library is complete — well done.
              </span>
            ) : null}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {nextCase ? (
              <Link
                to="/academy/$slug"
                params={{ slug: nextCase.slug }}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[13.5px] font-bold text-white transition-all duration-150 hover:-translate-y-px hover:bg-blue-700 hover:shadow-md active:translate-y-0"
              >
                {nextCase.progress.started ? 'Continue case' : 'Start a case'}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              to="/classify"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13.5px] font-bold text-slate-800 transition-colors hover:bg-slate-50"
            >
              Open Classify Disease
            </Link>
          </div>
        </div>

        <img
          src="/images/pawmed-character/student-mascot-vet-dog.png"
          alt=""
          aria-hidden
          decoding="async"
          className="pointer-events-none -mb-6 hidden h-44 w-auto shrink-0 self-end select-none drop-shadow-xl md:-mb-8 lg:block xl:h-52"
        />

        {/* Points badge */}
        {/* <div className="hidden shrink-0 items-center justify-center lg:flex">
          <div className="flex h-44 w-44 flex-col items-center justify-center rounded-2xl bg-white/80 p-4 text-center backdrop-blur-md">
            <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              {progress && progress.points > 0 ? (
                <Trophy className="size-7" />
              ) : (
                <PawPrint className="size-8" />
              )}
            </span>
            <span className="text-[26px] leading-none font-extrabold text-slate-900 tabular-nums">
              {progress?.points ?? 0}
            </span>
            <span className="mt-1 text-[11px] font-bold tracking-widest text-blue-600 uppercase">
              Points
            </span>
            <span className="mt-1 text-[11px] text-slate-500">
              {progress
                ? `${progress.cases_completed} of ${progress.cases_available} cases`
                : 'Case academy'}
            </span>
          </div>
        </div> */}
      </div>
    </section>
  )
}

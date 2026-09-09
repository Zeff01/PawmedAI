import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2, RotateCcw, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StageCard } from './components/StageCard'
import { DIFFICULTY_TONE, speciesMeta } from './caseMeta'
import { useAnswerStage, useCase, useResetCase } from './hooks/useAcademy'
import type { AnswerResult } from './api/academy'

/**
 * Working one case, stage by stage.
 *
 * The stage the student is on is whichever one they have not cleared; earlier
 * stages stay on screen with their model answers, later ones stay locked. All
 * of that is the server's judgement, not this component's — it only renders it.
 */
export function CaseWorkspaceView({ slug }: { slug: string }) {
  const caseQuery = useCase(slug)
  const answerMutation = useAnswerStage(slug)
  const resetMutation = useResetCase(slug)

  // Which stage each transient piece of feedback belongs to. `mutation.variables`
  // would nearly do, but it is typed as always-present and is stale the moment a
  // second stage is submitted.
  const [lastResult, setLastResult] = React.useState<{
    stageId: number
    result: AnswerResult
  } | null>(null)
  const [pendingStageId, setPendingStageId] = React.useState<number | null>(
    null,
  )
  const [stageError, setStageError] = React.useState<{
    stageId: number
    message: string
  } | null>(null)
  const [activeStageId, setActiveStageId] = React.useState<number | null>(null)

  const detail = caseQuery.data

  const currentStage = React.useMemo(
    () => detail?.stages.find((stage) => !stage.student.cleared) ?? null,
    [detail],
  )

  // Scroll the newly opened stage into view once the previous one is cleared.
  React.useEffect(() => {
    if (!activeStageId || activeStageId === currentStage?.id) return
    setActiveStageId(currentStage?.id ?? null)
    const node = document.getElementById(`stage-${currentStage?.id}`)
    node?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    })
  }, [currentStage?.id, activeStageId])

  React.useEffect(() => {
    if (activeStageId === null && currentStage)
      setActiveStageId(currentStage.id)
  }, [activeStageId, currentStage])

  if (caseQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (caseQuery.isError || !detail) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <p className="text-[15px] font-bold text-slate-900">
          This case could not be opened
        </p>
        <p className="mt-1 text-[13px] text-slate-500">
          {caseQuery.error?.message ?? 'Please try again.'}
        </p>
        <Button
          asChild
          className="mt-5 rounded-full bg-blue-600 px-5 text-white"
        >
          <Link to="/">Back to the dashboard</Link>
        </Button>
      </div>
    )
  }

  const species = speciesMeta(detail.species)
  const { progress } = detail

  return (
    <section className="min-h-full bg-slate-50 px-5 pt-6 pb-16 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="size-4" />
          All cases
        </Link>

        {/* ── Case header ─────────────────────────────────────────────── */}
        <header className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11.5px] font-semibold text-blue-700">
              {species.adjective} · {detail.discipline}
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-wide uppercase',
                DIFFICULTY_TONE[detail.difficulty],
              )}
            >
              {detail.difficulty}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-bold text-slate-600">
              {detail.total_points} points on offer
            </span>
          </div>

          <h1 className="mt-3 text-[20px] leading-snug font-extrabold tracking-tight text-slate-900 md:text-[24px]">
            {detail.title}
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
            {detail.presentation}
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[11.5px] font-medium text-slate-500">
                {progress.completed
                  ? 'Case complete'
                  : progress.current_stage_title
                    ? `Up next: ${progress.current_stage_title}`
                    : 'Not started'}
              </span>
              <span className="text-[12.5px] font-bold text-blue-600 tabular-nums">
                {progress.cleared_stages} of {progress.total_stages} stages ·{' '}
                {progress.points_earned} pts
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Case progress"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
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
        </header>

        {/* ── Completion banner ───────────────────────────────────────── */}
        {progress.completed ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600">
                <Trophy className="size-5" />
              </span>
              <div>
                <p className="text-[14px] font-bold text-emerald-900">
                  Case complete — {progress.points_earned} points
                </p>
                <p className="text-[12px] text-emerald-800/80">
                  Every stage is cleared. The model answers stay below for
                  revision.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLastResult(null)
                setStageError(null)
                setActiveStageId(null)
                resetMutation.mutate()
              }}
              disabled={resetMutation.isPending}
              className="rounded-full border-emerald-300 bg-white px-4 text-[12.5px] font-bold text-emerald-800 hover:bg-emerald-100"
            >
              {resetMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Run it again
            </Button>
          </div>
        ) : null}

        {/* ── Stages ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {detail.stages.map((stage, index) => (
            <div
              key={stage.id}
              id={`stage-${stage.id}`}
              className="scroll-mt-24"
            >
              <StageCard
                stage={stage}
                index={index + 1}
                total={detail.stages.length}
                isCurrent={stage.id === currentStage?.id}
                lastResult={
                  lastResult?.stageId === stage.id ? lastResult.result : null
                }
                isSubmitting={pendingStageId === stage.id}
                error={
                  stageError?.stageId === stage.id ? stageError.message : null
                }
                onSubmit={(selectedOptionIds) => {
                  setPendingStageId(stage.id)
                  setStageError(null)
                  answerMutation.mutate(
                    { stageId: stage.id, selectedOptionIds },
                    {
                      onSuccess: (result) =>
                        setLastResult({ stageId: stage.id, result }),
                      onError: (mutationError) =>
                        setStageError({
                          stageId: stage.id,
                          message: mutationError.message,
                        }),
                      onSettled: () => setPendingStageId(null),
                    },
                  )
                }}
              />
            </div>
          ))}
        </div>

        {resetMutation.isError ? (
          <p role="alert" className="text-center text-[12.5px] text-rose-600">
            {resetMutation.error.message}
          </p>
        ) : null}
      </div>
    </section>
  )
}

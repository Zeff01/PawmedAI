import * as React from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleDotDashed,
  Eye,
  Loader2,
  Lock,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { AnswerResult, CaseStage } from '../api/academy'

/** Mirrors `TRIES_BEFORE_REVEAL` in academy/scoring.py. */
const TRIES_BEFORE_REVEAL = 3

const KIND_LABEL: Record<CaseStage['kind'], string> = {
  history: 'History & signalment',
  diagnostics: 'Diagnostic plan',
  differential: 'Differential ranking',
  diagnosis: 'Final diagnosis',
}

/**
 * One stage of a case: the clinical briefing, the question, and the options.
 *
 * A cleared stage collapses to its verdict and teaching point — the student
 * scrolls past it on the way to the one they are on, and the model answer stays
 * visible for revision.
 */
export function StageCard({
  stage,
  index,
  total,
  isCurrent,
  lastResult,
  onSubmit,
  isSubmitting,
  error,
}: {
  stage: CaseStage
  index: number
  total: number
  isCurrent: boolean
  /** The verdict from this session's submission, for the points callout. */
  lastResult: AnswerResult | null
  onSubmit: (selected: Array<number>) => void
  isSubmitting: boolean
  error: string | null
}) {
  const [selected, setSelected] = React.useState<Array<number>>([])
  const multi = stage.select_mode === 'multi'
  const { student } = stage

  // A cleared stage shows what the student actually chose; an open one shows
  // what they are choosing now.
  const shown = student.cleared ? student.selected_option_ids : selected
  const correctIds = student.correct_option_ids

  // An open stage with points on it was answered part right — on this visit
  // (`lastResult`) or on an earlier one, which is all the reloaded state says.
  const partlyRight =
    !student.cleared &&
    (lastResult?.partial_credit || student.points_earned > 0)
  // The server sends this back with a submission; after a reload there is no
  // submission to read, so count it from the tries the stage has recorded.
  const triesLeft =
    lastResult?.tries_left ?? Math.max(0, TRIES_BEFORE_REVEAL - student.tries)

  const toggle = (id: number) => {
    if (student.cleared || isSubmitting) return
    setSelected((current) =>
      multi
        ? current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id]
        : [id],
    )
  }

  if (stage.locked) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Lock className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-500">
              {index}. {stage.title}
            </p>
            <p className="text-[11.5px] text-slate-400">
              Clear the stage above to release these findings.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'rounded-2xl border bg-white p-5 md:p-6',
        isCurrent ? 'border-blue-300 shadow-sm' : 'border-slate-200',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
              student.is_correct
                ? 'bg-emerald-100 text-emerald-700'
                : student.revealed
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-600 text-white',
            )}
          >
            {student.cleared ? <Check className="size-3.5" /> : index}
          </span>
          <div>
            <p className="text-[15px] leading-tight font-bold text-slate-900">
              {stage.title}
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              {KIND_LABEL[stage.kind]} · stage {index} of {total}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
          {student.cleared || student.points_earned > 0
            ? `${student.points_earned} / ${stage.points} pts`
            : `${stage.points} pts`}
        </span>
      </header>

      {stage.briefing ? (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-1.5 text-[10.5px] font-bold tracking-[0.1em] text-slate-400 uppercase">
            Clinical findings
          </p>
          <p className="text-[13px] leading-relaxed whitespace-pre-line text-slate-700">
            {stage.briefing}
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-[13.5px] font-semibold text-slate-900">
        {stage.prompt}
      </p>
      <p className="mt-0.5 text-[11.5px] text-slate-400">
        {multi
          ? 'Select every option that applies — each right one earns marks, each wrong one cancels a right one out.'
          : 'Select one option.'}
      </p>

      <ul className="mt-3 space-y-2">
        {stage.options.map((option) => {
          const picked = shown.includes(option.id)
          const isRight = correctIds?.includes(option.id) ?? false
          const graded = student.cleared

          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => toggle(option.id)}
                disabled={graded || isSubmitting}
                aria-pressed={picked}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                  graded
                    ? isRight
                      ? 'border-emerald-200 bg-emerald-50'
                      : picked
                        ? 'border-rose-200 bg-rose-50'
                        : 'border-slate-200 bg-white opacity-60'
                    : picked
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-4.5 shrink-0 items-center justify-center border',
                    multi ? 'rounded-[5px]' : 'rounded-full',
                    graded
                      ? isRight
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : picked
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-slate-300'
                      : picked
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300',
                  )}
                >
                  {graded && !isRight && picked ? (
                    <X className="size-3" />
                  ) : picked || (graded && isRight) ? (
                    <Check className="size-3" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-slate-900">
                    {option.label}
                  </span>
                  {/* The rationale is a hint, so it only appears once the
                      stage is settled and can no longer give the answer away. */}
                  {graded && option.detail ? (
                    <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-500">
                      {option.detail}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Verdict */}
      {student.cleared ? (
        <div
          className={cn(
            'mt-4 rounded-xl border p-4',
            student.is_correct
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50',
          )}
        >
          <p
            className={cn(
              'flex items-center gap-1.5 text-[12.5px] font-bold',
              student.is_correct ? 'text-emerald-800' : 'text-amber-800',
            )}
          >
            {student.is_correct ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            {student.is_correct
              ? student.tries === 1
                ? `Correct first time — ${student.points_earned} points`
                : `Correct on try ${student.tries} — ${student.points_earned} points`
              : student.points_earned > 0
                ? `Answer shown — you keep the ${student.points_earned} points your part-right answers earned`
                : 'Answer shown — no points for this stage'}
          </p>
          {student.explanation ? (
            <p
              className={cn(
                'mt-2 text-[12.5px] leading-relaxed',
                student.is_correct
                  ? 'text-emerald-900/80'
                  : 'text-amber-900/80',
              )}
            >
              {student.explanation}
            </p>
          ) : null}
          {lastResult?.completion_bonus ? (
            <p className="mt-2 text-[12.5px] font-bold text-emerald-800">
              Case complete — {lastResult.completion_bonus} bonus points for a
              clean run.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {student.answered ? (
            <p
              className={cn(
                'mt-4 flex items-start gap-1.5 rounded-xl border px-3.5 py-2.5 text-[12.5px]',
                partlyRight
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800',
              )}
            >
              {partlyRight ? (
                <CircleDotDashed className="mt-0.5 size-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              )}
              <span>
                {partlyRight
                  ? `Part right — ${student.points_earned} of ${stage.points} points banked so far. Something is missing, or something you picked does not belong.`
                  : 'Not quite.'}{' '}
                {triesLeft} attempt{triesLeft === 1 ? '' : 's'} left before the
                answer is shown — a second try is worth half marks.
              </span>
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[11.5px] text-slate-400">
              {selected.length > 0
                ? `${selected.length} selected`
                : 'Nothing selected yet'}
            </p>
            <Button
              type="button"
              onClick={() => onSubmit(selected)}
              disabled={selected.length === 0 || isSubmitting}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking…
                </>
              ) : (
                'Submit answer'
              )}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

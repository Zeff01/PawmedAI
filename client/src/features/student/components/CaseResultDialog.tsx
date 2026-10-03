import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, RotateCcw, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/ui/confetti'
import type { ConfettiRef } from '@/components/ui/confetti'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

/** Share of a case's points that counts as a pass. */
export const PASS_MARK = 0.6

export type CaseResult = { points: number; total: number }

const MASCOT = {
  passed: '/images/pawmed-character/student-mascot-waving.webp',
  failed: '/images/pawmed-character/student-mascot-thinking.webp',
}

/**
 * The moment a case is finished: the score, whether it passed, and where to go
 * next. Confetti only for a pass — celebrating a fail would read as mockery.
 */
export function CaseResultDialog({
  result,
  caseTitle,
  onClose,
  onRetry,
  retrying,
}: {
  result: CaseResult | null
  caseTitle: string
  onClose: () => void
  onRetry: () => void
  retrying: boolean
}) {
  const open = result !== null
  const percent = result
    ? Math.round((result.points / Math.max(result.total, 1)) * 100)
    : 0
  const passed = result ? percent >= PASS_MARK * 100 : false

  return (
    <>
      {open && passed && <Celebration />}

      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <div
            className={cn(
              'flex justify-center px-6 pt-6',
              passed ? 'bg-emerald-50' : 'bg-slate-50',
            )}
          >
            <img
              src={passed ? MASCOT.passed : MASCOT.failed}
              alt=""
              aria-hidden
              className="-mb-px h-32 w-auto select-none"
            />
          </div>

          <div className="px-6 pt-5 pb-6 text-center">
            <p
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
                passed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {passed && <Trophy className="size-3.5" />}
              {passed ? 'Case passed' : 'Case complete'}
            </p>

            <DialogTitle className="mt-3 text-[20px] font-bold tracking-tight text-slate-900">
              {passed ? 'Well reasoned!' : 'Not quite a pass this time'}
            </DialogTitle>
            <DialogDescription className="mt-1 line-clamp-2 text-[12.5px]">
              {caseTitle}
            </DialogDescription>

            <p className="mt-5 flex items-baseline justify-center gap-1.5">
              <span className="text-[40px] leading-none font-extrabold text-slate-900 tabular-nums">
                {result?.points ?? 0}
              </span>
              <span className="text-[14px] font-semibold text-slate-500 tabular-nums">
                / {result?.total ?? 0} pts
              </span>
            </p>

            {/* Score against the pass line */}
            <div className="mx-auto mt-4 max-w-xs">
              <div
                role="meter"
                aria-label="Case score"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="relative h-2 rounded-full bg-slate-200"
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-700',
                    passed ? 'bg-emerald-500' : 'bg-blue-600',
                  )}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
                <span
                  aria-hidden
                  className="absolute -top-1 h-4 w-0.5 rounded-full bg-slate-500"
                  style={{ left: `${PASS_MARK * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-500 tabular-nums">
                <span>{percent}%</span>
                <span>Pass mark {PASS_MARK * 100}%</span>
              </div>
            </div>

            <p className="mx-auto mt-4 max-w-xs text-[12.5px] leading-relaxed text-slate-600">
              {passed
                ? 'The model answers stay on the page — worth a skim for anything you got on a second try.'
                : `You need ${Math.ceil(PASS_MARK * (result?.total ?? 0))} points to pass. Read the model answers, then run the case again.`}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              {passed ? (
                <Button
                  asChild
                  className="h-10 flex-1 rounded-lg bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-700"
                >
                  <Link to="/">
                    <ArrowLeft className="size-4" />
                    Back to cases
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onRetry}
                  disabled={retrying}
                  className="h-10 flex-1 rounded-lg bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-700"
                >
                  <RotateCcw className="size-4" />
                  Try again
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 flex-1 rounded-lg text-[13px] font-semibold"
              >
                <BookOpen className="size-4" />
                Review answers
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** A full-screen burst from both sides, above the dialog and click-through. */
function Celebration() {
  const confettiRef = React.useRef<ConfettiRef>(null)

  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
    const burst = (x: number, angle: number) =>
      void confettiRef.current?.fire({
        particleCount: 80,
        spread: 70,
        startVelocity: 55,
        angle,
        origin: { x, y: 0.7 },
        colors,
      })
    burst(0, 60)
    burst(1, 120)
    const timer = setTimeout(() => {
      burst(0.2, 70)
      burst(0.8, 110)
    }, 350)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Confetti
      ref={confettiRef}
      manualstart
      className="pointer-events-none fixed inset-0 z-[60] size-full"
    />
  )
}

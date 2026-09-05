import { Link } from '@tanstack/react-router'
import {
  Camera,
  Check,
  ChevronRight,
  HeartPulse,
  History,
  MapPin,
  PawPrint,
  Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useQuota } from '@/hooks/useQuota'
import type { CompanionPrompt, LastCompanionQuery } from '../types'

const PROMPT_ICONS: Record<
  CompanionPrompt['icon'],
  ComponentType<{ className?: string }>
> = {
  camera: Camera,
  symptom: HeartPulse,
  breed: PawPrint,
  vet: MapPin,
}

const PROMPT_ROW =
  'group h-auto w-full items-center justify-between gap-2 border border-slate-200/80 bg-white p-3 ' +
  'text-left text-xs font-semibold whitespace-normal text-slate-800 shadow-fp-subtle transition ' +
  'hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-fp-brand-500/30'

export function AiCompanion({
  petName,
  prompts,
  lastQuery,
  onUnavailable,
}: {
  ownerName: string
  petName: string
  prompts: Array<CompanionPrompt>
  lastQuery: LastCompanionQuery | null
  onUnavailable: (label: string) => void
}) {
  const { data: quota, isError } = useQuota()

  const remaining = quota && !isError ? quota.remaining : null
  const limit = quota && !isError ? quota.limit : null
  const percent =
    remaining !== null && limit ? Math.round((remaining / limit) * 100) : null

  return (
    <Card className="gap-0 rounded-xl border border-fp-brand-200/80 p-5">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">
              Pawmed AI Companion
            </h2>
            <p className="text-[11px] font-medium text-fp-brand-700">
              Shared across every AI feature
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          <span className="size-1.5 rounded-full bg-emerald-600 motion-safe:animate-pulse" />
          Always on
        </span>
      </header>

      <div className="mt-4 rounded-lg border border-slate-200/70 bg-white p-3 shadow-fp-subtle">
        <div className="mb-1.5 flex justify-between gap-2 text-xs font-semibold">
          <span className="text-slate-600">Daily free analyses</span>
          <span className="text-fp-brand-800">
            {remaining !== null && limit !== null
              ? `${remaining} of ${limit} left`
              : 'Checking…'}
          </span>
        </div>
        <div
          role={percent === null ? undefined : 'meter'}
          aria-label={percent === null ? undefined : 'AI analyses remaining'}
          aria-valuenow={percent ?? undefined}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500',
              remaining !== null && remaining <= 1
                ? 'bg-rose-500'
                : 'bg-fp-brand-600',
            )}
            style={{ width: `${percent ?? 0}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Ask anything about{' '}
          <strong className="text-slate-800">{petName}</strong>: nutrition,
          weird coughs, or safe table scraps.
        </p>
      </div>

      {lastQuery ? (
        <div className="mt-3 rounded-xl border border-slate-200/70 bg-white p-3 shadow-fp-subtle">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-fp-brand-700 uppercase">
              <History className="size-3" />
              Last question
            </span>
            <span className="text-[10px] text-slate-400">
              {lastQuery.askedLabel}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-800">
            “{lastQuery.question}”
          </p>
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500">
            <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
            {lastQuery.answer}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <Button
          asChild
          className="h-auto w-full items-center justify-between gap-2 bg-fp-brand-500 p-3 text-xs font-semibold text-white shadow-fp-subtle transition hover:bg-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/40"
        >
          <Link to="/classify" className="group">
            <span className="flex items-center gap-2">
              <Zap className="size-4 text-emerald-300" />
              Start an AI symptom checkup
            </span>
            <ChevronRight className="size-3.5 text-emerald-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>

        {prompts.map((prompt) => {
          const PromptIcon = PROMPT_ICONS[prompt.icon]
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <PromptIcon className="size-4 shrink-0 text-slate-500 transition-colors group-hover:text-fp-brand-700" />
                <span className="min-w-0 flex-1">{prompt.label}</span>
              </span>
              {prompt.to ? (
                <ChevronRight className="size-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-slate-600" />
              ) : (
                <span className="shrink-0 rounded bg-fp-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-fp-brand-700">
                  Soon
                </span>
              )}
            </>
          )

          return prompt.to ? (
            <Button
              key={prompt.label}
              asChild
              variant="ghost"
              className={PROMPT_ROW}
            >
              <Link to={prompt.to}>{content}</Link>
            </Button>
          ) : (
            <Button
              key={prompt.label}
              variant="ghost"
              onClick={() => onUnavailable(prompt.label)}
              className={PROMPT_ROW}
            >
              {content}
            </Button>
          )
        })}
      </div>
    </Card>
  )
}

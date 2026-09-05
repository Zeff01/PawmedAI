import { ArrowRight, ChevronRight, ScanEye } from 'lucide-react'

import { CardAction, CareCard, EmptyState, Inset, Pill } from './primitives'
import type { ScreeningRecord } from '../types'

export function ScreeningsCard({
  screening,
  petName,
  onViewHistory,
}: {
  screening: ScreeningRecord | null
  petName: string
  onViewHistory: () => void
}) {
  return (
    <CareCard
      icon={ScanEye}
      iconTone="primary"
      title="Photo checkups"
      subtitle="What our AI saw in the photos you sent"
      status={
        screening ? (
          <Pill tone="primary">{screening.confidence}</Pill>
        ) : (
          <Pill>None yet</Pill>
        )
      }
      footer={
        screening ? (
          <CardAction onClick={onViewHistory}>
            See past checkups ({screening.totalScans})
            <ChevronRight className="size-3.5 text-slate-500" />
          </CardAction>
        ) : (
          <CardAction to="/classify">
            Try your first photo checkup
            <ArrowRight className="size-3.5 text-slate-500" />
          </CardAction>
        )
      }
    >
      {screening ? (
        <Inset className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-wider text-fp-brand-700 uppercase">
              {screening.title}
            </span>
            <span className="text-[10px] text-slate-400">{screening.date}</span>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-xs text-slate-700 italic">
              “{screening.summary}”
            </p>
            <p className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
              {screening.recommendation}
            </p>
          </div>
        </Inset>
      ) : (
        <EmptyState title={`No photo checkups for ${petName} yet`}>
          A clear photo of a sore patch, a red eye, or a bad tooth is enough to
          get a first opinion.
        </EmptyState>
      )}
    </CareCard>
  )
}

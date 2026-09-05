import * as React from 'react'
import { ChevronDown, Clock } from 'lucide-react'

import { DOT_TONES } from './care-tones'
import { TextAction } from './primitives'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { CareEvent } from '../types'

export function CareTimeline({
  events,
  initialCount = 3,
}: {
  events: Array<CareEvent>
  initialCount?: number
}) {
  const [expanded, setExpanded] = React.useState(false)
  const collapsible = events.length > initialCount
  const visible =
    expanded || !collapsible ? events : events.slice(0, initialCount)

  return (
    <Card
      className="gap-0 rounded-xl border border-fp-border bg-white p-5 shadow-fp-card"
      id="timeline"
    >
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-fp-brand-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Recent care history
          </h2>
        </div>
        {collapsible ? (
          <TextAction onClick={() => setExpanded((open) => !open)}>
            {expanded ? 'Show less' : `View all (${events.length})`}
            <ChevronDown
              className={cn(
                'size-3 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </TextAction>
        ) : null}
      </header>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-500">
          Nothing here yet. Saving a weight, a dose, or a file adds the first
          entry.
        </p>
      ) : (
        <ol className="flex flex-col">
          {visible.map((event, index) => (
            <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
              {index < visible.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-3.5 bottom-0 left-1.25 w-0.5 rounded-full bg-slate-200"
                />
              ) : null}

              <span
                aria-hidden
                className={cn(
                  'relative mt-0.5 size-3 shrink-0 rounded-full',
                  index === 0
                    ? 'bg-fp-brand-600 shadow-fp-subtle'
                    : DOT_TONES[event.tone],
                )}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <h3 className="font-bold text-slate-800">{event.title}</h3>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {event.timeLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {event.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

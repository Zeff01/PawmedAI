import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'

import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DashboardNotice =
  | { kind: 'success'; message: string }
  | { kind: 'unavailable'; label: string }
  | { kind: 'error'; message: string }

const TONES = {
  success: {
    surface: 'border-emerald-200/80 bg-emerald-50/70',
    text: 'text-emerald-900',
    icon: 'text-emerald-600',
    hover: 'hover:bg-emerald-100/70',
  },
  unavailable: {
    surface: 'border-amber-200/80 bg-amber-50/60',
    text: 'text-amber-900',
    icon: 'text-amber-600',
    hover: 'hover:bg-amber-100/70',
  },
  error: {
    surface: 'border-rose-200/80 bg-rose-50/70',
    text: 'text-rose-900',
    icon: 'text-rose-600',
    hover: 'hover:bg-rose-100/70',
  },
} as const

const ICONS = {
  success: CircleCheck,
  unavailable: Info,
  error: TriangleAlert,
} as const

function copy(notice: DashboardNotice): string {
  switch (notice.kind) {
    case 'success':
      return `${notice.message}.`
    case 'error':
      return `${notice.message}. Please try again — nothing was changed.`
    case 'unavailable':
      return (
        `${notice.label} is still being built. Meanwhile, an AI checkup and ` +
        `the vet finder are ready to use.`
      )
  }
}

export function FeatureNotice({
  notice,
  onDismiss,
}: {
  notice: DashboardNotice
  onDismiss: () => void
}) {
  const tone = TONES[notice.kind]
  const Icon = ICONS[notice.kind]

  return (
    <Alert
      role={notice.kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'items-start rounded-xl border px-4 py-3 shadow-fp-subtle',
        tone.surface,
      )}
    >
      <Icon className={cn('mt-0.5', tone.icon)} />
      <AlertDescription className={cn('text-xs', tone.text)}>
        {copy(notice)}
      </AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cn('rounded-md', tone.icon, tone.hover)}
        >
          <X />
        </Button>
      </AlertAction>
    </Alert>
  )
}

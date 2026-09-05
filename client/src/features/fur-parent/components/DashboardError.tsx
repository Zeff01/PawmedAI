import { RefreshCw, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DashboardError({
  message,
  onRetry,
  retrying = false,
}: {
  message: string
  onRetry: () => void
  retrying?: boolean
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Alert
        variant="destructive"
        className="flex flex-col items-center gap-4 rounded-2xl border border-fp-border bg-white px-6 py-12 text-center shadow-fp-card"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
          <TriangleAlert className="size-6" />
        </span>

        <div className="flex max-w-md flex-col gap-1.5">
          <AlertTitle className="text-lg font-bold tracking-tight text-slate-900">
            We couldn’t load your pets
          </AlertTitle>
          <AlertDescription className="text-xs text-slate-500">
            {message}
          </AlertDescription>
        </div>

        <Button
          onClick={onRetry}
          disabled={retrying}
          className="h-auto gap-1.5 rounded-xl bg-fp-brand-800 px-4 py-2.5 text-xs font-semibold text-white shadow-fp-subtle transition hover:bg-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/40"
        >
          <RefreshCw className={cn('size-3.5', retrying && 'animate-spin')} />
          {retrying ? 'Retrying…' : 'Try again'}
        </Button>
      </Alert>
    </div>
  )
}

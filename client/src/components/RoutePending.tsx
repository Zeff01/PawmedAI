import { Loader2 } from 'lucide-react'

export function RoutePending() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-blue-500" />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Loading
      </p>
    </div>
  )
}

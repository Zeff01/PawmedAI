import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function RecordDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  pendingLabel,
  error,
  pending,
  onSubmit,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  pendingLabel: string
  error?: string | null
  pending: boolean
  onSubmit: (event: React.FormEvent) => void
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-fp-border bg-white font-fp-sans shadow-fp-elevated">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-4">
          {children}

          {error ? (
            <Alert
              variant="destructive"
              className="border border-rose-200/80 bg-rose-50/70"
            >
              <TriangleAlert className="text-rose-600" />
              <AlertDescription className="text-xs text-rose-800">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="mt-1 flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-auto w-full px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-auto w-full bg-fp-brand-800 px-4 py-2.5 text-xs font-semibold text-white shadow-fp-subtle transition hover:bg-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/40 sm:w-auto"
            >
              {pending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const controlStyles =
  'h-10 border-slate-200 bg-white font-fp-sans text-xs text-slate-800 ' +
  'shadow-inner placeholder:text-slate-400 ' +
  'focus-visible:border-fp-brand-500 focus-visible:ring-1 focus-visible:ring-fp-brand-500/40'

export const labelStyles = 'font-fp-sans text-xs font-semibold text-slate-700'

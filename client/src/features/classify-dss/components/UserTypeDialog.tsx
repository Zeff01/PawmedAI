import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useUserTypeStore, type UserType } from '@/stores/userTypeStore'

type UserTypeOption = {
  value: UserType
  title: string
  description: string
  badge?: string
}

type UserTypeDialogProps = {
  title?: string
  description?: string
  options?: UserTypeOption[]
}

const DEFAULT_OPTIONS: UserTypeOption[] = [
  {
    value: 'student',
    title: 'Veterinary Student',
    description:
      'Guided explanations with learning focus, visual cues, and study topics.',
    badge: 'Learning mode',
  },
  {
    value: 'professional',
    title: 'Veterinary Professional',
    description:
      'Concise, protocol-driven output designed for clinical scanning.',
    badge: 'Clinical mode',
  },
]

export function UserTypeDialog({
  title = 'Choose your profile',
  description = 'This tailors the results to the level of clinical detail you need.',
  options = DEFAULT_OPTIONS,
}: UserTypeDialogProps) {
  const userType = useUserTypeStore((state) => state.userType)
  const dialogOpen = useUserTypeStore((state) => state.dialogOpen)
  const openDialog = useUserTypeStore((state) => state.openDialog)
  const closeDialog = useUserTypeStore((state) => state.closeDialog)
  const setUserType = useUserTypeStore((state) => state.setUserType)

  const open = dialogOpen || !userType
  const disableClose = dialogOpen

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      openDialog()
      return
    }
    if (!disableClose) closeDialog()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (disableClose) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (disableClose) event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-5 grid gap-3">
          {options.map((option) => {
            const selected = option.value === userType
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setUserType(option.value)}
                className={cn(
                  'flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-blue-500 bg-blue-50 shadow-[0_12px_30px_rgba(37,99,235,0.18)]'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    {option.title}
                  </p>
                  {option.badge ? (
                    <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                      {option.badge}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-600">{option.description}</p>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUserTypeStore } from '@/stores/userTypeStore'
import type { UserType } from '@/types/auth'
import { useMe, useSetUserType, useSupabaseSession } from '@/hooks/useAuth'

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
  {
    value: 'fur_parent',
    title: 'Fur Parent',
    description:
      'Simple, reassuring guidance for pet owners, focusing on observation and safe actions.',
    badge: 'Pet Owner mode',
  },
]

export function UserTypeDialog({
  title = 'Choose your profile',
  description = 'This tailors the results to the level of clinical detail you need.',
  options = DEFAULT_OPTIONS,
}: UserTypeDialogProps) {
  const userType = useUserTypeStore((state) => state.userType)
  const dialogOpen = useUserTypeStore((state) => state.dialogOpen)
  const lockSelection = useUserTypeStore((state) => state.lockSelection)
  const openDialog = useUserTypeStore((state) => state.openDialog)
  const closeDialog = useUserTypeStore((state) => state.closeDialog)
  const setUserType = useUserTypeStore((state) => state.setUserType)
  const clearUserType = useUserTypeStore((state) => state.clearUserType)
  const setLockSelection = useUserTypeStore((state) => state.setLockSelection)
  const { session, isLoading: isSessionLoading } = useSupabaseSession()
  const isAuthed = Boolean(session)
  const { data: me, isLoading: isMeLoading } = useMe({ enabled: isAuthed })
  const { mutateAsync: setUserTypeRemote, isPending: isSaving } =
    useSetUserType()
  const [showDisclaimer, setShowDisclaimer] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const open = dialogOpen || (lockSelection && !userType)
  const disableClose = lockSelection

  React.useEffect(() => {
    if (isSessionLoading) return
    if (!isAuthed) return
    if (isMeLoading || !me) return

    if (me.user_type) {
      setUserType(me.user_type)
      setLockSelection(true)
      closeDialog()
      return
    }

    setLockSelection(true)
    clearUserType({ openDialog: true })
  }, [
    isAuthed,
    isSessionLoading,
    isMeLoading,
    me,
    me?.user_type,
    setUserType,
    setLockSelection,
    clearUserType,
    closeDialog,
  ])

  const persistSelection = async (nextType: UserType) => {
    if (!isAuthed) {
      setUserType(nextType)
      return
    }

    if (me?.user_type) return

    try {
      setErrorMessage(null)
      const updated = await setUserTypeRemote(nextType)
      if (updated.user_type) {
        setUserType(updated.user_type)
      } else {
        setUserType(nextType)
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save profile type.'
      setErrorMessage(message)
      return
    }
  }

  const handleSelect = (nextType: UserType) => {
    if (nextType === 'fur_parent') {
      setShowDisclaimer(true)
      return
    }
    void persistSelection(nextType)
  }

  const handleDisclaimerConfirm = () => {
    void persistSelection('fur_parent')
    setShowDisclaimer(false)
  }

  const handleDisclaimerCancel = () => {
    setShowDisclaimer(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (!lockSelection) openDialog()
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
          <DialogTitle>
            {showDisclaimer ? 'Fur Parent disclaimer' : title}
          </DialogTitle>
          <DialogDescription>
            {showDisclaimer
              ? 'Please read carefully before continuing.'
              : description}
          </DialogDescription>
        </DialogHeader>
        {showDisclaimer ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Important:</p>
              <p className="mt-2 text-sm">
                Pawmed AI provides possible results and general guidance only.
                It does not replace a professional veterinary diagnosis or
                treatment plan.
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {[
                  'Consult a licensed veterinarian for any diagnosis or treatment.',
                  'If your pet is in distress or worsening, seek urgent care immediately.',
                  'Do not delay professional care based on these results.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleDisclaimerCancel}>
                Go back
              </Button>
              <Button onClick={handleDisclaimerConfirm} disabled={isSaving}>
                I understand, continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {options.map((option) => {
              const selected = option.value === userType
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={isSaving}
                  className={cn(
                    'flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition',
                    selected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40',
                    isSaving ? 'cursor-not-allowed opacity-70' : null,
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
                  <p className="text-xs text-slate-600">
                    {option.description}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

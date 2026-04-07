import * as React from 'react'
import { useState, useCallback } from 'react'
import LoginView from '@/features/auth/LoginView'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type AuthModalProps = {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showGuestOption?: boolean
  onGuestContinue?: () => void
}

export function AuthModal({
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  showGuestOption = false,
  onGuestContinue,
}: AuthModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Use external open state if provided, otherwise fall back to internal
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      externalOnOpenChange?.(next)
    },
    [isControlled, externalOnOpenChange],
  )

  const handlePendingChange = useCallback((pending: boolean) => {
    setIsSigningIn(pending)
  }, [])

  const handleLoginSuccess = useCallback(() => {
    setIsSigningIn(false)
    setOpen(false)
  }, [setOpen])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isSigningIn) return
        setOpen(next)
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className="border border-slate-200 bg-white p-6 sm:p-7"
        onInteractOutside={(e) => {
          if (isSigningIn) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isSigningIn) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Sign in
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Use your trusted provider to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <LoginView
            variant="modal"
            showTitle={false}
            onPendingChange={handlePendingChange}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
        {showGuestOption && !isSigningIn && (
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={onGuestContinue}
          >
            Continue as guest
          </Button>
        )}
        <p className="mt-3 text-center text-[12px] text-slate-500">
          By logging in, you can classify disease up to 5 times every 5 hours.
        </p>
        <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400">
          <span className="h-px flex-1 bg-slate-100" />
          <span>Secure OAuth sign-in</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
        {!isSigningIn && (
          <DialogClose asChild>
            <Button variant="ghost" className="mt-2 w-full">
              Close
            </Button>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  )
}

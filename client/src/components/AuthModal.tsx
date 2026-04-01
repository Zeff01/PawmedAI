import * as React from 'react'
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
}

export function AuthModal({ trigger, open, onOpenChange }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Continue with Google or GitHub to access Pawmed AI.
          </DialogDescription>
        </DialogHeader>
        <LoginView variant="modal" />
        <DialogClose asChild>
          <Button variant="ghost" className="mt-2 w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

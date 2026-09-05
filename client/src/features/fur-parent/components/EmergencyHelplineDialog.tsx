import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MapPin, Phone, Siren } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const RED_FLAGS = [
  'Struggling to breathe, choking, or collapsing',
  'Repeated vomiting, bloating, or a rigid abdomen',
  'Seizures, sudden weakness, or unresponsiveness',
  'Heavy bleeding, a suspected fracture, or a road accident',
  'Swallowed chocolate, medication, antifreeze, or a foreign object',
]

export function EmergencyHelplineDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-fp-border bg-white font-fp-sans shadow-fp-elevated">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            Urgent help for your pet
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            If any of these describe your pet right now, go straight to a
            veterinarian — do not wait for an AI result.
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-4 flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/60 p-4">
          {RED_FLAGS.map((flag) => (
            <li
              key={flag}
              className="flex items-start gap-2 text-xs font-medium text-red-500"
            >
              • {flag}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/nearby-vets"
            onClick={() => onOpenChange(false)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold text-white bg-red-500 transition hover:from-rose-500 hover:to-rose-600"
          >
            <MapPin className="size-4" />
            Find the nearest vet
          </Link>
          <a
            href="tel:+639773440291"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Phone className="size-4 text-slate-500" />
            Call Pawmed support
          </a>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Pawmed support is a product line, not a veterinary triage service. For
          medical advice, speak to a licensed veterinarian.
        </p>
      </DialogContent>
    </Dialog>
  )
}

const HELPLINE_VARIANTS = {
  header:
    'hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 hover:text-white active:scale-95',
  banner:
    'inline-flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 hover:text-red-100',
  menu: 'flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-700 transition hover:bg-red-50 sm:hidden',
} as const

export function HelplineButton({
  variant,
  label = 'Urgent help',
}: {
  variant: keyof typeof HELPLINE_VARIANTS
  label?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className={HELPLINE_VARIANTS[variant]}
      >
        <Siren className="size-3.5" />
        {label}
      </Button>
      <EmergencyHelplineDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

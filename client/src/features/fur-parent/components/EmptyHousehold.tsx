import { PawPrint, Plus, ScanEye } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyHousehold({ onAddPet }: { onAddPet: () => void }) {
  return (
    <Card className="rounded-2xl border border-fp-border bg-white shadow-fp-card">
      <CardContent className="flex flex-col items-center gap-5 px-6 py-14 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl border border-fp-brand-200 bg-fp-brand-50 text-fp-brand-700">
          <PawPrint className="size-8" />
        </span>

        <div className="flex max-w-md flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Let’s start with your first pet
          </h2>
          <p className="text-sm text-slate-500">
            Add them once and this page becomes their record — vaccines, doses,
            weights, vet visits and the papers you would otherwise hunt for in
            email.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button
            onClick={onAddPet}
            className="h-auto gap-1.5 rounded-xl bg-fp-brand-800 px-4 py-2.5 text-xs font-semibold text-white shadow-fp-subtle transition hover:bg-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/40"
          >
            <Plus className="size-3.5" />
            Add my first pet
          </Button>

          <Button
            asChild
            variant="ghost"
            className="h-auto gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-fp-brand-700"
          >
            <Link to="/classify">
              <ScanEye className="size-3.5 text-slate-500" />
              Run an AI checkup first
            </Link>
          </Button>
        </div>

        <p className="max-w-sm text-[11px] text-slate-400">
          A checkup works without a profile — adding a pet is what lets Pawmed
          keep the result.
        </p>
      </CardContent>
    </Card>
  )
}

import { useEffect, useState } from 'react'
import { ArrowLeftRight, Cat, Dog, Heart, PawPrint, Zap } from 'lucide-react'
import type { ComponentType } from 'react'

import { Pill } from './primitives'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FurParentPet } from '../types'

const SPECIES_GLYPHS: Record<
  FurParentPet['species'],
  ComponentType<{ className?: string }>
> = {
  dog: Dog,
  cat: Cat,
  other: PawPrint,
}

const SPECIES_LABELS: Record<FurParentPet['species'], string> = {
  dog: 'Canine',
  cat: 'Feline',
  other: 'Companion',
}

export function PetCard({
  pet,
  active,
  onSelect,
  onViewProfile,
  onScan,
  onToggleFavourite,
  className,
}: {
  pet: FurParentPet
  active: boolean
  onSelect: () => void
  onViewProfile: () => void
  onScan: () => void
  onToggleFavourite: (favourite: boolean) => void
  className?: string
}) {
  const [favourite, setFavourite] = useState(pet.favourite)
  const Glyph = SPECIES_GLYPHS[pet.species]

  useEffect(() => setFavourite(pet.favourite), [pet.favourite])

  const toggleFavourite = () => {
    const next = !favourite
    setFavourite(next)
    onToggleFavourite(next)
  }

  return (
    <Card
      className={cn(
        'group relative flex flex-col justify-between gap-0 rounded-xl bg-white p-5 transition',
        active
          ? 'border border-emerald-500'
          : 'border border-fp-border hover:border-slate-300',
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-fp-brand-200 bg-fp-brand-50 text-fp-brand-700">
                {pet.photoUrl ? (
                  <img
                    src={pet.photoUrl}
                    alt={`${pet.name}, a ${pet.breed}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Glyph className="size-8" />
                )}
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleFavourite}
                aria-pressed={favourite}
                aria-label={
                  favourite
                    ? `Remove ${pet.name} from favourites`
                    : `Add ${pet.name} to favourites`
                }
                className={cn(
                  'absolute -right-1 -bottom-1 size-5 rounded-full border border-slate-100 bg-white shadow-fp-subtle transition hover:bg-white',
                  favourite
                    ? 'text-rose-500 hover:text-rose-600'
                    : 'text-slate-300 hover:text-rose-500',
                )}
              >
                <Heart className={cn('size-3', favourite && 'fill-current')} />
              </Button>
            </div>

            <div className="min-w-0">
              <span className="inline-block rounded bg-fp-brand-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-fp-brand-700 uppercase">
                {SPECIES_LABELS[pet.species]} • {pet.breed}
              </span>
              <h3 className="mt-0.5 truncate text-base font-bold text-slate-900">
                {pet.name}
              </h3>
              <p className="truncate text-xs text-slate-500">{pet.ageLabel}</p>
            </div>
          </div>

          {active ? (
            <Pill tone="primary">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Active
            </Pill>
          ) : (
            <Pill>Standing by</Pill>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <InfoChip label="Current weight" value={pet.weightValue} />
          <InfoChip label="Last checkup" value={pet.lastCheckupLabel} />
        </dl>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        {active ? (
          <>
            <Button
              onClick={onViewProfile}
              className="h-auto flex-1 rounded-lg bg-fp-brand-500 py-2 text-xs font-semibold text-white transition hover:bg-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/40"
            >
              View health profile
            </Button>
            <Button
              variant="ghost"
              onClick={onScan}
              title={`Start a photo checkup for ${pet.name}`}
              className="h-auto gap-1 rounded-lg border border-fp-brand-200/60 bg-fp-brand-50 px-3 py-2 text-xs font-semibold text-fp-brand-800 transition hover:bg-fp-brand-100 hover:text-fp-brand-800 focus-visible:ring-2 focus-visible:ring-fp-brand-500/30"
            >
              <Zap className="size-3.5 text-fp-brand-600" />
              Checkup
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            onClick={onSelect}
            className="h-auto w-full gap-1.5 border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/30"
          >
            <ArrowLeftRight className="size-3.5" />
            Inspect {pet.name}
          </Button>
        )}
      </div>
    </Card>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
      <dt className="block text-[10px] tracking-wide text-slate-400 uppercase">
        {label}
      </dt>
      <dd className="truncate font-semibold text-slate-700">{value}</dd>
    </div>
  )
}

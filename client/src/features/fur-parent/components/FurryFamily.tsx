import * as React from 'react'
import { ChevronDown, Plus } from 'lucide-react'

import { AddPetCard } from './AddPetCard'
import { PetCard } from './PetCard'
import { CardAction, PrimaryButton, SectionHeading } from './primitives'
import { cn } from '@/lib/utils'
import type { FurParentPet } from '../types'

const COLLAPSED_ON_PHONE = 1
const COLLAPSED = 2

export function FurryFamily({
  pets,
  activePetId,
  onSelectPet,
  onAddPet,
  onViewProfile,
  onScan,
  onToggleFavourite,
}: {
  pets: Array<FurParentPet>
  activePetId: string
  onSelectPet: (petId: string) => void
  onAddPet: () => void
  onViewProfile: (petId: string) => void
  onScan: (petId: string) => void
  onToggleFavourite: (petId: string, favourite: boolean) => void
}) {
  const [expanded, setExpanded] = React.useState(false)

  const foldClass = (index: number) => {
    if (expanded || index < COLLAPSED_ON_PHONE) return ''
    if (index < COLLAPSED) return 'hidden sm:flex'
    return 'hidden'
  }

  const hidesSomething = pets.length > COLLAPSED_ON_PHONE
  const hidesSomethingWide = pets.length > COLLAPSED

  return (
    <section className="flex flex-col gap-4" id="my-pets">
      <SectionHeading
        title="My furry family"
        count={`${pets.length} active`}
        action={
          <PrimaryButton onClick={onAddPet}>
            <Plus className="size-3.5" />
            Add new pet
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {pets.map((pet, index) => (
          <PetCard
            key={pet.id}
            pet={pet}
            active={pet.id === activePetId}
            onSelect={() => onSelectPet(pet.id)}
            onViewProfile={() => onViewProfile(pet.id)}
            onScan={() => onScan(pet.id)}
            onToggleFavourite={(favourite) =>
              onToggleFavourite(pet.id, favourite)
            }
            className={foldClass(index)}
          />
        ))}

        {expanded || !hidesSomething ? <AddPetCard onClick={onAddPet} /> : null}
      </div>

      {hidesSomething ? (
        <CardAction
          onClick={() => setExpanded((open) => !open)}
          className={cn(
            'justify-center',
            hidesSomethingWide ? '' : 'sm:hidden',
          )}
        >
          {expanded
            ? 'Show fewer'
            : `Show all ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'}`}
          <ChevronDown
            className={cn(
              'size-3.5 text-slate-500 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </CardAction>
      ) : null}
    </section>
  )
}

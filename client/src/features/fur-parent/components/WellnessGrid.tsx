import { RefreshCw } from 'lucide-react'

import { MedicationsCard } from './MedicationsCard'
import { PassportCard } from './PassportCard'
import { VaccinationsCard } from './VaccinationsCard'
import { VitalsCard } from './VitalsCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FurParentPet, PetWellness } from '../types'

export function WellnessGrid({
  pet,
  wellness,
  refreshing = false,
  onRefresh,
  onLogWeight,
  onUpload,
  onAddMedication,
  onAddVaccination,
  onError,
}: {
  pet: FurParentPet
  wellness: PetWellness
  refreshing?: boolean
  onRefresh: () => void
  onLogWeight: () => void
  onUpload: () => void
  onAddMedication: () => void
  onAddVaccination: () => void
  onError: (message: string) => void
}) {
  const petName = pet.name

  return (
    <section className="flex flex-col gap-6" id="wellness">
      <header className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
            <span className="text-emerald-500">{petName}’s</span> health &amp;
            daily care
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{wellness.syncedLabel}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh these records"
            aria-label="Refresh these records"
            className="rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <VitalsCard
          vitals={wellness.vitals}
          petName={petName}
          onLogWeight={onLogWeight}
        />
        <MedicationsCard
          medications={wellness.medications}
          onAddMedication={onAddMedication}
          onError={onError}
        />
        <VaccinationsCard
          vaccinations={wellness.vaccinations}
          pet={pet}
          syncedLabel={wellness.syncedLabel}
          onAddVaccination={onAddVaccination}
          onError={onError}
        />
        <PassportCard passport={wellness.passport} onUpload={onUpload} />
      </div>
    </section>
  )
}

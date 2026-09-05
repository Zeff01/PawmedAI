import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'

import { AiCompanion } from './components/AiCompanion'
import { AddMedicationDialog } from './components/AddMedicationDialog'
import { AddPetDialog } from './components/AddPetDialog'
import { AddVaccinationDialog } from './components/AddVaccinationDialog'
import { AttentionPanel } from './components/AttentionPanel'
import { CareTimeline } from './components/CareTimeline'
import { DashboardError } from './components/DashboardError'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { EmptyHousehold } from './components/EmptyHousehold'
import { FurryFamily } from './components/FurryFamily'
import { LogWeightDialog } from './components/LogWeightDialog'
import { UploadDocumentDialog } from './components/UploadDocumentDialog'
import { WelcomeBanner } from './components/WelcomeBanner'
import { WellnessGrid } from './components/WellnessGrid'
import { summariseHighlights, summariseHousehold } from './care-priorities'
import { useFurParentDashboard, useUpdatePet } from './hooks/usePetProfiles'
import { COMPANION_PROMPTS } from './companion-prompts'
import { FadeIn } from '@/components/motion/FadeIn'
import { FP_CONTAINER, useFurParentActions } from '@/components/FurParentShell'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'
import { useMe } from '@/hooks/useAuth'

export function FurParentDashboard() {
  const navigate = useNavigate()
  const { data: me } = useMe()
  const { data, isLoading, isError, error, isFetching, refetch } =
    useFurParentDashboard()

  const [activePetId, setActivePetId] = React.useState<string | null>(null)
  const [addingPet, setAddingPet] = React.useState(false)
  const [loggingWeight, setLoggingWeight] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [addingMedication, setAddingMedication] = React.useState(false)
  const [addingVaccination, setAddingVaccination] = React.useState(false)

  const reportSuccess = (message: string) => toast.success(message)

  const reportError = (message: string) =>
    toast.error(message, {
      description: 'Nothing was changed — please try again.',
    })

  const reportUnavailable = (label: string) =>
    toast(`${label} is still being built`, {
      description: 'Meanwhile, an AI checkup and the vet finder are ready.',
    })

  const { mutate: patchPet } = useUpdatePet()

  // Held by the shell, because a phone reaches them from the account drawer
  // instead of the banner — see `useFurParentActions`.
  const { editProfile, shareRecords } = useFurParentActions()

  const firstName = me?.first_name.trim() || me?.username || 'there'
  const pets = data?.pets ?? []

  const activePet = pets.find((pet) => pet.id === activePetId) ?? pets.at(0)
  const wellness = activePet && data ? data.wellness[activePet.id] : undefined

  const inspectPet = (petId: string) => {
    setActivePetId(petId)
    requestAnimationFrame(() => {
      document
        .getElementById('wellness')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const toggleFavourite = (petId: string, favourite: boolean) => {
    patchPet(
      { petId, favourite },
      { onError: (requestError) => reportError(requestError.message) },
    )
  }

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <DashboardError
        message={
          error instanceof Error
            ? error.message
            : 'Something went wrong reaching Pawmed.'
        }
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    )
  }

  const summaries = data ? summariseHousehold(pets, data.wellness) : []
  const highlights = summariseHighlights(pets, data?.wellness ?? {})

  return (
    <div className="relative">
      <div className={cn(FP_CONTAINER, 'flex flex-col gap-6 py-6')}>
        <FadeIn trigger="mount" distance={12}>
          <WelcomeBanner
            firstName={firstName}
            petCount={pets.length}
            highlights={highlights}
            onEditProfile={editProfile}
            onShareRecords={shareRecords}
          />

          {activePet && (
            <AttentionPanel
              summaries={summaries}
              activePetId={activePet.id}
              onSelectPet={setActivePetId}
            />
          )}
        </FadeIn>

        {!activePet || !wellness ? (
          <FadeIn trigger="mount" delay={0.05} distance={12}>
            <EmptyHousehold onAddPet={() => setAddingPet(true)} />
          </FadeIn>
        ) : (
          <>
            <div className="mt-2 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              <div className="flex min-w-0 flex-col gap-8 lg:col-span-8">
                <FadeIn trigger="mount" delay={0.1} distance={12}>
                  <FurryFamily
                    pets={pets}
                    activePetId={activePet.id}
                    onSelectPet={setActivePetId}
                    onAddPet={() => setAddingPet(true)}
                    onViewProfile={inspectPet}
                    onScan={() => navigate({ to: '/classify' })}
                    onToggleFavourite={toggleFavourite}
                  />
                </FadeIn>

                <FadeIn trigger="scroll" distance={12}>
                  <WellnessGrid
                    pet={activePet}
                    wellness={wellness}
                    refreshing={isFetching}
                    onRefresh={() => void refetch()}
                    onLogWeight={() => setLoggingWeight(true)}
                    onUpload={() => setUploading(true)}
                    onAddMedication={() => setAddingMedication(true)}
                    onAddVaccination={() => setAddingVaccination(true)}
                    onError={reportError}
                  />
                </FadeIn>
              </div>

              <aside
                aria-label="AI companion and recent activity"
                className="flex flex-col gap-6 lg:sticky lg:top-20 lg:col-span-4"
              >
                <FadeIn trigger="mount" delay={0.15} distance={12}>
                  <AiCompanion
                    ownerName={firstName}
                    petName={activePet.name}
                    prompts={COMPANION_PROMPTS}
                    lastQuery={null}
                    onUnavailable={reportUnavailable}
                  />
                </FadeIn>

                <FadeIn trigger="mount" delay={0.2} distance={12}>
                  <CareTimeline events={data?.timeline ?? []} />
                </FadeIn>
              </aside>
            </div>
          </>
        )}
      </div>

      <AddPetDialog
        open={addingPet}
        onOpenChange={setAddingPet}
        onAdded={() => reportSuccess('Your new pet was added to the household')}
      />

      {activePet ? (
        <>
          <LogWeightDialog
            open={loggingWeight}
            onOpenChange={setLoggingWeight}
            petId={activePet.id}
            petName={activePet.name}
          />
          <UploadDocumentDialog
            open={uploading}
            onOpenChange={setUploading}
            petId={activePet.id}
            petName={activePet.name}
          />
          <AddMedicationDialog
            open={addingMedication}
            onOpenChange={setAddingMedication}
            petId={activePet.id}
            petName={activePet.name}
            onAdded={(name) =>
              reportSuccess(`${name} was added to ${activePet.name}’s routine`)
            }
          />
          <AddVaccinationDialog
            open={addingVaccination}
            onOpenChange={setAddingVaccination}
            petId={activePet.id}
            petName={activePet.name}
            onAdded={(name) =>
              reportSuccess(`${name} was added to ${activePet.name}’s record`)
            }
          />
        </>
      ) : null}
    </div>
  )
}

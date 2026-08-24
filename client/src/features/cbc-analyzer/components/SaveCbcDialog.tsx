import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NewPetForm, NewPetSubmitButton } from './NewPetForm'
import { useCreatePet, usePets, useSaveMedicalLog } from '../hooks/useCbc'
import type { NewPetFormValues } from '../patientSchema'
import { formatAge } from '../utils/format'
import type { CbcAnalysis, MedicalLogDetail, Pet } from '../types'

type Step =
  | 'connect-choice'
  | 'pick-pet'
  | 'new-pet'
  | 'keep-choice'
  | 'discard-confirm'
  | 'success'

const STEP_META: Record<Step, { caption: string; progress: number }> = {
  'connect-choice': { caption: 'Link or standalone', progress: 1 },
  'pick-pet': { caption: 'Select a patient', progress: 2 },
  'new-pet': { caption: 'New patient', progress: 2 },
  'keep-choice': { caption: 'Keep or remove', progress: 2 },
  'discard-confirm': { caption: 'Confirm removal', progress: 3 },
  success: { caption: 'All set', progress: 3 },
}

type SaveCbcDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: CbcAnalysis
  prefilled?: Array<string>
  onDiscard: () => void
  onSaved: (log: MedicalLogDetail) => void
  vetName?: string
}

export function SaveCbcDialog({
  open,
  onOpenChange,
  analysis,
  prefilled = [],
  onDiscard,
  onSaved,
  vetName = '',
}: SaveCbcDialogProps) {
  const [step, setStep] = React.useState<Step>('connect-choice')
  const [selectedPetId, setSelectedPetId] = React.useState<number | null>(null)
  const [search, setSearch] = React.useState('')
  const [savedLog, setSavedLog] = React.useState<MedicalLogDetail | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const petsQuery = usePets('', { enabled: open })
  const saveMutation = useSaveMedicalLog()
  const createPetMutation = useCreatePet()

  const resetFlow = React.useCallback(() => {
    setStep('connect-choice')
    setSelectedPetId(null)
    setSearch('')
    setSavedLog(null)
    setErrorMessage(null)
    saveMutation.reset()
    createPetMutation.reset()
  }, [saveMutation, createPetMutation])
  const resetFlowRef = React.useRef(resetFlow)
  resetFlowRef.current = resetFlow

  React.useEffect(() => {
    if (open) resetFlowRef.current()
  }, [open])

  const pets = petsQuery.data ?? []
  const filteredPets = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return pets
    return pets.filter((pet) =>
      [pet.name, pet.owner_name, pet.breed]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    )
  }, [pets, search])

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null
  const isBusy = saveMutation.isPending || createPetMutation.isPending

  const persist = async (petId: number | null) => {
    setErrorMessage(null)
    try {
      const log = await saveMutation.mutateAsync({ analysis, petId, vetName })
      setSavedLog(log)
      setStep('success')
      onSaved(log)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The record could not be saved. Please try again.',
      )
    }
  }

  const handleCreatePet = async (draft: NewPetFormValues) => {
    setErrorMessage(null)
    try {
      const pet = await createPetMutation.mutateAsync({
        name: draft.name.trim(),
        species: draft.species,
        speciesLabel: draft.speciesLabel.trim(),
        breed: draft.breed.trim(),
        ageYears: draft.ageYears.trim() === '' ? null : Number(draft.ageYears),
        sex: draft.sex,
        neuterStatus: draft.neuterStatus,
        ownerName: draft.ownerName.trim(),
      })
      setSelectedPetId(pet.id)
      await persist(pet.id)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The patient profile could not be created.',
      )
    }
  }

  const meta = STEP_META[step]
  const danger = step === 'discard-confirm'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isBusy) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md p-0">
        <div className="px-6 pb-2 pt-6">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Save CBC result</DialogTitle>
            <DialogDescription className="text-[11.5px]">
              {meta.caption}
            </DialogDescription>
          </DialogHeader>

          {/* Progress rail */}
          <div className="mt-4 flex gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((segment) => (
              <span
                key={segment}
                className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                  segment <= meta.progress
                    ? danger
                      ? 'bg-red-500'
                      : 'bg-blue-600'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 pt-3">
          {errorMessage ? (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11.5px] text-red-700"
            >
              <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          ) : null}

          {step === 'connect-choice' ? (
            <StepConnectChoice
              onConnect={() => setStep('pick-pet')}
              onSkip={() => setStep('keep-choice')}
            />
          ) : null}

          {step === 'pick-pet' ? (
            <StepPickPet
              pets={filteredPets}
              totalPets={pets.length}
              isLoading={petsQuery.isLoading}
              loadError={petsQuery.error?.message ?? null}
              search={search}
              onSearchChange={setSearch}
              selectedPetId={selectedPetId}
              onSelect={setSelectedPetId}
              onAddNew={() => setStep('new-pet')}
              onKeepStandalone={() => setStep('keep-choice')}
              onBack={() => setStep('connect-choice')}
              onBind={() => selectedPetId !== null && persist(selectedPetId)}
              isSaving={saveMutation.isPending}
            />
          ) : null}

          {step === 'new-pet' ? (
            <NewPetForm
              analysis={analysis}
              hasPrefill={prefilled.length > 0}
              onSubmit={handleCreatePet}
              isSaving={isBusy}
              footer={(submit) => (
                <StepFooter
                  onBack={() => setStep('pick-pet')}
                  primary={
                    <NewPetSubmitButton onClick={submit} isSaving={isBusy} />
                  }
                />
              )}
            />
          ) : null}

          {step === 'keep-choice' ? (
            <StepKeepChoice
              onKeep={() => persist(null)}
              onDiscard={() => setStep('discard-confirm')}
              onBack={() => setStep('connect-choice')}
              isSaving={saveMutation.isPending}
            />
          ) : null}

          {step === 'discard-confirm' ? (
            <StepDiscardConfirm
              onBack={() => setStep('keep-choice')}
              onConfirm={() => {
                onDiscard()
                onOpenChange(false)
              }}
            />
          ) : null}

          {step === 'success' && savedLog ? (
            <StepSuccess
              log={savedLog}
              linkedPetName={selectedPet?.name ?? savedLog.pet_name}
              onDone={() => onOpenChange(false)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Step: connect or not ─────────────────────────────────────────────────── */

function StepConnectChoice({
  onConnect,
  onSkip,
}: {
  onConnect: () => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[14.5px] font-extrabold text-slate-900">
          Connect this result to a pet?
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          Linking to a profile keeps the bloodwork history in one place. You can
          also keep it standalone.
        </p>
      </div>
      <div className="space-y-2">
        <ChoiceRow
          icon={<LinkIcon className="h-4 w-4" />}
          title="Connect to a pet profile"
          description="Attach to an existing patient and build their timeline."
          onClick={onConnect}
        />
        <ChoiceRow
          icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
          title="Don't connect"
          description="Decide whether to keep it as a log or discard it."
          onClick={onSkip}
        />
      </div>
    </div>
  )
}

/* ── Step: pick a patient ─────────────────────────────────────────────────── */

function StepPickPet({
  pets,
  totalPets,
  isLoading,
  loadError,
  search,
  onSearchChange,
  selectedPetId,
  onSelect,
  onAddNew,
  onKeepStandalone,
  onBack,
  onBind,
  isSaving,
}: {
  pets: Array<Pet>
  totalPets: number
  isLoading: boolean
  loadError: string | null
  search: string
  onSearchChange: (next: string) => void
  selectedPetId: number | null
  onSelect: (id: number) => void
  onAddNew: () => void
  onKeepStandalone: () => void
  onBack: () => void
  onBind: () => void
  isSaving: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[14.5px] font-extrabold text-slate-900">
          Which pet is this for?
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          Pick a profile to bind this CBC result to.
        </p>
      </div>

      {totalPets > 0 ? (
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or owner…"
            aria-label="Search your patients"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12.5px] font-medium text-slate-800 transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>
      ) : null}

      {isLoading ? (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-6 text-[12px] font-semibold text-slate-500">
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          Loading your patients…
        </p>
      ) : loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[11.5px] text-red-700">
          {loadError}
        </p>
      ) : totalPets === 0 ? (
        /* The decision tree's "is a pet profile available? → no" branch. */
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600">
            <UserPlusIcon className="h-4.5 w-4.5" />
          </div>
          <p className="mt-2.5 text-[12.5px] font-bold text-slate-800">
            No patient profiles yet
          </p>
          <p className="mx-auto mt-1 max-w-64 text-[11.5px] leading-relaxed text-slate-500">
            Create one now to start this patient's bloodwork history, or keep
            the result as a standalone log.
          </p>
          <div className="mt-3.5 flex flex-col gap-2">
            <Button
              type="button"
              onClick={onAddNew}
              className="h-10 rounded-lg bg-blue-600 text-[12.5px] font-bold text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Add a new patient
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onKeepStandalone}
              className="h-9 rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Keep it as a log instead
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-0.5">
            {pets.map((pet) => {
              const selected = pet.id === selectedPetId
              return (
                <li key={pet.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(pet.id)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold uppercase ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {pet.species_display.slice(0, 3)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-bold text-slate-900">
                        {pet.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {[
                          pet.owner_name ? `Owner: ${pet.owner_name}` : null,
                          pet.breed || null,
                          pet.age_years ? formatAge(pet.age_years) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || pet.species_display}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 rounded-full border-2 transition ${
                        selected
                          ? 'border-blue-600 bg-blue-600 ring-2 ring-inset ring-white'
                          : 'border-slate-300'
                      }`}
                    />
                  </button>
                </li>
              )
            })}
            {pets.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-[11.5px] text-slate-500">
                No patient matches “{search}”.
              </li>
            ) : null}
          </ul>

          <button
            type="button"
            onClick={onAddNew}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-2 text-[11.5px] font-bold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add a new patient
          </button>
        </>
      )}

      {totalPets > 0 ? (
        <StepFooter
          onBack={onBack}
          primary={
            <Button
              type="button"
              onClick={onBind}
              disabled={selectedPetId === null || isSaving}
              className="h-10 rounded-lg bg-blue-600 px-4 text-[12.5px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Binding…
                </>
              ) : (
                'Bind to selected pet'
              )}
            </Button>
          }
        />
      ) : (
        <StepFooter onBack={onBack} />
      )}
    </div>
  )
}

/* ── Step: keep or discard ────────────────────────────────────────────────── */

function StepKeepChoice({
  onKeep,
  onDiscard,
  onBack,
  isSaving,
}: {
  onKeep: () => void
  onDiscard: () => void
  onBack: () => void
  isSaving: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[14.5px] font-extrabold text-slate-900">
          Save as a medical log, or discard?
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          A medical log stays in your records without being tied to a patient
          profile — useful for walk-ins and one-offs.
        </p>
      </div>
      <div className="space-y-2">
        <ChoiceRow
          icon={<ClipboardDocumentListIcon className="h-4 w-4" />}
          title="Save as a medical log"
          description="Stored with your other records in the cloud."
          onClick={onKeep}
          busy={isSaving}
        />
        <ChoiceRow
          icon={<TrashIcon className="h-4 w-4" />}
          title="Discard data"
          description="Remove this result entirely. Can't be undone."
          onClick={onDiscard}
          tone="danger"
        />
      </div>
      <StepFooter onBack={onBack} />
    </div>
  )
}

/* ── Step: confirm discard ────────────────────────────────────────────────── */

function StepDiscardConfirm({
  onBack,
  onConfirm,
}: {
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <TrashIcon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-[14.5px] font-extrabold text-slate-900">
          Discard this CBC result?
        </h3>
        <p className="mx-auto mt-1 max-w-72 text-[12px] leading-relaxed text-slate-500">
          The analysed panel will be permanently removed. There's no way to
          bring it back.
        </p>
      </div>
      <StepFooter
        onBack={onBack}
        primary={
          <Button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-lg bg-red-600 px-4 text-[12.5px] font-bold text-white hover:bg-red-700"
          >
            Yes, discard it
          </Button>
        }
      />
    </div>
  )
}

/* ── Step: success ────────────────────────────────────────────────────────── */

function StepSuccess({
  log,
  linkedPetName,
  onDone,
}: {
  log: MedicalLogDetail
  linkedPetName: string
  onDone: () => void
}) {
  const connected = log.pet_id !== null

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircleIcon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-[14.5px] font-extrabold text-slate-900">
          {connected ? 'Saved & connected' : 'Saved as medical log'}
        </h3>
        <p className="mx-auto mt-1 max-w-72 text-[12px] leading-relaxed text-slate-500">
          {connected
            ? `${linkedPetName || 'This patient'}'s CBC is now part of their medical history.`
            : 'Stored in your medical logs without a linked pet.'}
        </p>
        <p className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10.5px] font-bold text-slate-600">
          {log.record_id}
        </p>
      </div>
      <div className="flex flex-col-reverse items-center gap-2 sm:flex-row sm:justify-between">
        <Link
          to="/medical-log/$recordId"
          params={{ recordId: log.record_id }}
          onClick={onDone}
          className="text-[12px] font-bold text-blue-600 underline-offset-2 hover:underline"
        >
          Open this record
        </Link>
        <Button
          type="button"
          onClick={onDone}
          className="h-10 w-full rounded-lg bg-blue-600 px-5 text-[12.5px] font-bold text-white hover:bg-blue-700 sm:w-auto"
        >
          Done
        </Button>
      </div>
    </div>
  )
}

/* ── Shared bits ──────────────────────────────────────────────────────────── */

function ChoiceRow({
  icon,
  title,
  description,
  onClick,
  tone = 'default',
  busy = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  tone?: 'default' | 'danger'
  busy?: boolean
}) {
  const danger = tone === 'danger'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
        danger
          ? 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
          danger
            ? 'bg-red-50 text-red-600'
            : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
        }`}
      >
        {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[12.5px] font-extrabold ${
            danger ? 'text-red-700' : 'text-slate-900'
          }`}
        >
          {title}
        </span>
        <span className="block text-[11.5px] leading-relaxed text-slate-500">
          {description}
        </span>
      </span>
      <ChevronRightIcon
        className={`h-4 w-4 shrink-0 ${
          danger ? 'text-red-300' : 'text-slate-300'
        }`}
      />
    </button>
  )
}

function StepFooter({
  onBack,
  primary,
}: {
  onBack: () => void
  primary?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Back
      </button>
      {primary}
    </div>
  )
}

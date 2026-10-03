import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  CircleCheck,
  CircleHelp,
  Frown,
  Loader2,
  Meh,
  Pencil,
  Smile,
} from 'lucide-react'

import { sendClassificationFeedback } from '../api/sendFeedback'
import type {
  ClassificationFeedbackPayload,
  FeedbackConfirmedBy,
  FeedbackVerdict,
} from '../api/sendFeedback'
import type { UserType } from '@/types/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const VERDICTS: Array<{
  value: FeedbackVerdict
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: string
}> = [
  {
    value: 'correct',
    label: 'Correct',
    icon: Smile,
    active: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  },
  {
    value: 'partly',
    label: 'Partly',
    icon: Meh,
    active: 'border-amber-500 bg-amber-50 text-amber-700',
  },
  {
    value: 'incorrect',
    label: 'Incorrect',
    icon: Frown,
    active: 'border-rose-500 bg-rose-50 text-rose-700',
  },
  {
    value: 'unsure',
    label: 'Not sure yet',
    icon: CircleHelp,
    active: 'border-slate-500 bg-slate-100 text-slate-700',
  },
]

/** How a verdict was reached, worded for who is giving it. */
const CONFIRMED_BY: Record<
  UserType,
  Array<{ value: FeedbackConfirmedBy; label: string }>
> = {
  fur_parent: [
    { value: 'vet_exam', label: 'My vet examined my pet' },
    { value: 'lab_test', label: 'Lab or test results' },
    { value: 'own_judgement', label: 'My own observation' },
  ],
  student: [
    { value: 'instructor', label: 'My instructor' },
    { value: 'vet_exam', label: 'A vet examined the patient' },
    { value: 'lab_test', label: 'Lab or test results' },
    { value: 'own_judgement', label: 'My own judgement' },
  ],
  professional: [
    { value: 'vet_exam', label: 'Clinical examination' },
    { value: 'lab_test', label: 'Lab or test results' },
    { value: 'own_judgement', label: 'Clinical judgement' },
  ],
}

/** For a breed, what settles it is paperwork more than an examination. */
const BREED_CONFIRMED_BY: Array<{ value: FeedbackConfirmedBy; label: string }> =
  [
    { value: 'papers', label: 'Pedigree papers or a DNA test' },
    { value: 'records', label: 'Breeder or shelter records' },
    { value: 'vet_exam', label: 'A vet told me' },
    { value: 'own_judgement', label: 'My own judgement' },
  ]

const COPY = {
  disease: {
    title: 'Was this result right?',
    actual: 'What was it actually?',
    placeholder: 'e.g. Sarcoptic mange',
  },
  breed: {
    title: 'Was this breed right?',
    actual: 'What breed is it actually?',
    placeholder: 'e.g. Beagle cross',
  },
}

/**
 * "Was this right?" under a classification result.
 *
 * The verdict is always saved without the photo or notes. Those go along only
 * when the user ticks the share box — the request leaves them out otherwise.
 * A pet owner who can't say yet may ask to be reminded after the vet visit.
 */
export function ClassificationFeedback({
  feedbackId,
  kind = 'disease',
  userType,
  imageUrl,
  notes,
  suggestions,
  onSaved,
}: {
  feedbackId: string
  kind?: 'disease' | 'breed'
  userType: UserType
  imageUrl: string | null
  notes: string
  /** Other answers the AI considered — one-tap answers for "what was it?". */
  suggestions: Array<string>
  /** Called once the feedback is stored, e.g. to leave a follow-up page. */
  onSaved?: () => void
}) {
  const [verdict, setVerdict] = React.useState<FeedbackVerdict | null>(null)
  const [actualDiagnosis, setActualDiagnosis] = React.useState('')
  const [confirmedBy, setConfirmedBy] = React.useState<
    FeedbackConfirmedBy | ''
  >('')
  const [share, setShare] = React.useState(false)
  const [remindMe, setRemindMe] = React.useState(false)
  const [editing, setEditing] = React.useState(true)

  const mutation = useMutation<void, Error, ClassificationFeedbackPayload>({
    mutationFn: (payload) => sendClassificationFeedback(feedbackId, payload),
    onSuccess: () => {
      setEditing(false)
      onSaved?.()
    },
  })

  const wrong = verdict === 'partly' || verdict === 'incorrect'
  const settled = verdict !== null && verdict !== 'unsure'
  const hasInputs = Boolean(imageUrl) || notes.trim().length > 0
  const isFurParent = userType === 'fur_parent'
  const copy = COPY[kind]
  const confirmedOptions =
    kind === 'breed' ? BREED_CONFIRMED_BY : CONFIRMED_BY[userType]
  // Waiting on a vet visit is a pet owner's situation with a health result.
  const canRemind = isFurParent && kind === 'disease'
  const reminding = canRemind && verdict === 'unsure' && remindMe

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!verdict) return
    mutation.mutate({
      verdict,
      actual_diagnosis: wrong ? actualDiagnosis.trim() : '',
      confirmed_by: settled ? confirmedBy : '',
      share,
      image_url: imageUrl ?? undefined,
      notes: notes.trim() || undefined,
      remind_me: reminding,
    })
  }

  if (!editing) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-800">
          <CircleCheck className="size-4" />
          Thanks — your feedback was saved.
          {reminding ? (
            <span className="font-normal text-emerald-700">
              We'll remind you in 3 days to tell us what the vet said.
            </span>
          ) : share ? (
            <span className="font-normal text-emerald-700">
              {imageUrl && notes.trim()
                ? 'The photo and notes were shared with it.'
                : imageUrl
                  ? 'The photo was shared with it.'
                  : 'The notes were shared with it.'}
            </span>
          ) : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="text-emerald-800 hover:bg-emerald-100"
        >
          <Pencil className="size-3.5" />
          Change answer
        </Button>
      </section>
    )
  }

  return (
    <form
      onSubmit={submit}
      aria-labelledby="feedback-title"
      className="rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-6"
    >
      <h2 id="feedback-title" className="text-[15px] font-bold text-slate-900">
        {copy.title}
      </h2>
      <p className="mt-0.5 text-[12.5px] text-slate-500">
        Your answer helps us measure how accurate PawMed AI really is.
      </p>

      <div
        role="radiogroup"
        aria-labelledby="feedback-title"
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {VERDICTS.map(({ value, label, icon: Icon, active }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            role="radio"
            aria-checked={verdict === value}
            onClick={() => setVerdict(value)}
            className={cn(
              'h-11 justify-center rounded-xl border-2 text-[13px] font-semibold text-slate-600',
              verdict === value && active,
            )}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </div>

      {verdict === 'unsure' && !canRemind && (
        <p className="mt-3 text-[12.5px] text-slate-500">
          That's fine — an unconfirmed answer still tells us something.
        </p>
      )}

      {verdict === 'unsure' && canRemind && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-3">
          <Checkbox
            id="remind-me"
            checked={remindMe}
            onCheckedChange={(checked) => setRemindMe(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="remind-me"
            className="block text-[12.5px] leading-relaxed font-normal text-slate-600"
          >
            <span className="font-semibold text-slate-800">
              Remind me in 3 days
            </span>{' '}
            to tell you what the vet said. This saves the result to your account
            so we can remind you.
          </Label>
        </div>
      )}

      {verdict && (
        <div className="mt-5 space-y-4">
          {wrong && (
            <div className="space-y-2">
              <Label
                htmlFor="actual-diagnosis"
                className="text-[12.5px] font-semibold text-slate-700"
              >
                {copy.actual}{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </Label>
              <Input
                id="actual-diagnosis"
                value={actualDiagnosis}
                onChange={(event) => setActualDiagnosis(event.target.value)}
                maxLength={240}
                placeholder={copy.placeholder}
                className="h-10 rounded-lg"
              />
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, 4).map((name) => (
                    <Button
                      key={name}
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setActualDiagnosis(name)}
                      className="rounded-full text-[11.5px] font-medium text-slate-600"
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {settled && (
            <div className="space-y-2">
              <Label className="text-[12.5px] font-semibold text-slate-700">
                How do you know?{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </Label>
              <Select
                value={confirmedBy}
                onValueChange={(value) =>
                  setConfirmedBy(value as FeedbackConfirmedBy)
                }
              >
                <SelectTrigger
                  aria-label="How the result was confirmed"
                  className="h-10 w-full rounded-lg sm:w-72"
                >
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  {confirmedOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasInputs && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
              <Checkbox
                id="share-inputs"
                checked={share}
                onCheckedChange={(checked) => setShare(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="share-inputs"
                className="block text-[12.5px] leading-relaxed font-normal text-slate-600"
              >
                <span className="font-semibold text-slate-800">
                  Share{' '}
                  {imageUrl && notes.trim()
                    ? 'the photo and notes'
                    : imageUrl
                      ? 'the photo'
                      : 'the notes'}{' '}
                  with this feedback
                </span>{' '}
                to help improve PawMed AI. Leave it unticked and only your
                answer is saved.
              </Label>
            </div>
          )}

          {mutation.isError && (
            <p role="alert" className="text-[12.5px] text-rose-600">
              {mutation.error.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-10 w-full rounded-lg bg-blue-600 px-5 text-[13px] font-semibold text-white hover:bg-blue-700 sm:w-auto"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Send feedback
          </Button>
        </div>
      )}
    </form>
  )
}

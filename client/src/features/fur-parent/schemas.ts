import { z } from 'zod'

const optionalDate = z
  .string()
  .refine((value) => value === '' || !Number.isNaN(Date.parse(value)), {
    message: 'Use a real date.',
  })

const notInFuture = (value: string) =>
  value === '' || new Date(value) <= new Date(new Date().toDateString())

export const petDraftSchema = z.object({
  name: z.string().trim().min(1, 'Your pet needs a name.').max(120),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string().trim().max(120).optional(),
  sex: z.enum(['male', 'female', 'unknown']),
  neuterStatus: z.enum(['intact', 'neutered', 'spayed', 'unknown']),
  birthDate: optionalDate.refine(notInFuture, {
    message: 'A birthday cannot be in the future.',
  }),
  idealWeightKg: z
    .string()
    .refine((value) => value === '' || Number(value) > 0, {
      message: 'A target weight has to be above zero.',
    })
    .refine((value) => value === '' || Number(value) <= 200, {
      message: 'That looks too heavy for a household pet.',
    }),
})

export type PetDraftValues = z.infer<typeof petDraftSchema>

export const weightEntrySchema = z.object({
  weightKg: z
    .string()
    .min(1, 'Enter what the scale said.')
    .refine((value) => Number(value) > 0, {
      message: 'A weight has to be above zero.',
    })
    .refine((value) => Number(value) <= 200, {
      message: 'That looks too heavy for a household pet — check the units.',
    }),
  recordedOn: optionalDate.refine(notInFuture, {
    message: 'You cannot log a future weigh-in.',
  }),
  note: z.string().trim().max(200).optional(),
})

export type WeightEntryValues = z.infer<typeof weightEntrySchema>

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024

export const documentSchema = z.object({
  label: z.string().trim().min(1, 'Give the document a label.').max(200),
  kind: z.enum(['lab', 'insurance', 'certificate', 'other']),
  note: z.string().trim().max(250).optional(),
  file: z
    .instanceof(File, { message: 'Choose a file to upload.' })
    .refine((file) => file.size <= MAX_DOCUMENT_BYTES, {
      message: 'That file is larger than 25 MB.',
    }),
})

export type DocumentValues = z.infer<typeof documentSchema>

export const displayNameSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Tell us what to call you.')
    .max(30, 'That is longer than a greeting can carry.'),
  lastName: z.string().trim().max(30).optional(),
})

export type DisplayNameValues = z.infer<typeof displayNameSchema>

export const medicationDraftSchema = z.object({
  name: z.string().trim().min(1, 'Name the medication.').max(160),
  detail: z.string().trim().max(250).optional(),
  form: z.enum(['pill', 'chew', 'topical', 'liquid']),
  cadence: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'as_needed']),
  nextDueOn: optionalDate,
})

export type MedicationDraftValues = z.infer<typeof medicationDraftSchema>

export const rescheduleSchema = z.object({
  startsAt: z
    .string()
    .min(1, 'Pick the new date and time.')
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Use a real date and time.',
    })
    .refine((value) => new Date(value) > new Date(), {
      message: 'A visit can only be moved to a time still ahead.',
    }),
})

export type RescheduleValues = z.infer<typeof rescheduleSchema>

export const vaccinationDraftSchema = z
  .object({
    name: z.string().trim().min(1, 'Name the vaccine.').max(160),
    administeredOn: optionalDate.refine(notInFuture, {
      message: 'A shot cannot have been given in the future.',
    }),
    dueOn: optionalDate,
    clinic: z.string().trim().max(160).optional(),
  })
  .refine((values) => values.administeredOn !== '' || values.dueOn !== '', {
    message: 'Record when it was given, when it is due, or both.',
    path: ['dueOn'],
  })

export type VaccinationDraftValues = z.infer<typeof vaccinationDraftSchema>

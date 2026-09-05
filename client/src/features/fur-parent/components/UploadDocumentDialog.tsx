import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { RecordDialog, controlStyles, labelStyles } from './RecordDialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUploadDocument } from '../hooks/usePetProfiles'
import { documentSchema } from '../schemas'
import type { DocumentValues } from '../schemas'

const KINDS = [
  { value: 'lab', label: 'Lab or test result' },
  { value: 'insurance', label: 'Insurance policy' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Something else' },
] as const

export function UploadDocumentDialog({
  open,
  onOpenChange,
  petId,
  petName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  petId: string
  petName: string
}) {
  const form = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    mode: 'onTouched',
    defaultValues: { label: '', kind: 'lab', note: '' },
  })
  const { mutate, isPending, error, reset } = useUploadDocument()

  React.useEffect(() => {
    if (open) {
      form.reset({ label: '', kind: 'lab', note: '' })
      reset()
    }
  }, [open, form, reset])

  const submit = form.handleSubmit((values) => {
    mutate({ petId, ...values }, { onSuccess: () => onOpenChange(false) })
  })

  return (
    <RecordDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Add a document for ${petName}`}
      description="Lab panels, policies, clinic letters — anything you would otherwise dig out of email."
      submitLabel="Upload"
      pendingLabel="Uploading…"
      pending={isPending}
      error={error?.message ?? null}
      onSubmit={(event) => void submit(event)}
    >
      <Form {...form}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>File</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf,image/*"
                    className={`${controlStyles} file:mr-3 file:rounded-lg file:bg-fp-brand-50 file:px-3 file:text-xs file:font-semibold file:text-fp-brand-700`}
                    onChange={(event) => {
                      const chosen = event.target.files?.[0]
                      field.onChange(chosen)
                      if (chosen && !form.getValues('label').trim()) {
                        form.setValue(
                          'label',
                          chosen.name.replace(/\.[^.]+$/, ''),
                          { shouldValidate: true },
                        )
                      }
                    }}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-500">
                  PDF or image, up to 25 MB.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Label</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Annual blood chemistry panel"
                    className={controlStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Kind</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className={controlStyles}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KINDS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </RecordDialog>
  )
}

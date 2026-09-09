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
import { UploadCareComponent } from '@/components/UploadCareComponent'
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
                  <UploadCareComponent
                    accept="application/pdf,image/*"
                    sourceList="local, camera, url"
                    maxSizeMb={25}
                    onUploadOne={(uploaded) => {
                      field.onChange(uploaded)
                      // Save the reader naming a file they just named on disk:
                      // the filename is a good first draft of the label.
                      if (!form.getValues('label').trim()) {
                        form.setValue(
                          'label',
                          uploaded.name.replace(/\.[^.]+$/, ''),
                          { shouldValidate: true },
                        )
                      }
                    }}
                    onClear={() => field.onChange(undefined)}
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

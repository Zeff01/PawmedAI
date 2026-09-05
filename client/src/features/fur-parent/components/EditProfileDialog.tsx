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
import { useUpdateProfile } from '@/hooks/useAuth'
import { displayNameSchema } from '../schemas'
import type { DisplayNameValues } from '../schemas'

export function EditProfileDialog({
  open,
  onOpenChange,
  firstName,
  lastName,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  firstName: string
  lastName: string
  onSaved: () => void
}) {
  const form = useForm<DisplayNameValues>({
    resolver: zodResolver(displayNameSchema),
    mode: 'onTouched',
    defaultValues: { firstName, lastName },
  })
  const { mutate, isPending, error, reset } = useUpdateProfile()

  React.useEffect(() => {
    if (open) {
      form.reset({ firstName, lastName })
      reset()
    }
  }, [open, firstName, lastName, form, reset])

  const submit = form.handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        onSaved()
      },
    })
  })

  return (
    <RecordDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit your profile"
      description="Your name is what the dashboard greets you by, and what shared records are signed with."
      submitLabel="Save profile"
      pendingLabel="Saving…"
      pending={isPending}
      error={error?.message ?? null}
      onSubmit={(event) => void submit(event)}
    >
      <Form {...form}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>First name</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    autoComplete="given-name"
                    placeholder="Jan"
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
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Last name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="family-name"
                    placeholder="Dela Cruz"
                    className={controlStyles}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-500">
                  Optional — only the first name appears in the greeting.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </RecordDialog>
  )
}

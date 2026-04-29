import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Flag, Loader2, Send, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
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
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { submitBugReport } from '../api/submitBugReport'
import type { BugReportSeverity } from '../api/submitBugReport'

const severityOptions: Array<{ label: string; value: BugReportSeverity }> = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
]

const bugReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(255, 'Title must be 255 characters or fewer.'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    required_error: 'Choose a severity.',
    invalid_type_error: 'Choose a severity.',
  }),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters.')
    .max(3000, 'Description must be 3000 characters or fewer.'),
})

type BugReportFormValues = z.infer<typeof bugReportSchema>

const initialForm: BugReportFormValues = {
  title: '',
  description: '',
  severity: 'MEDIUM',
}

export function BugReportWidget() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: initialForm,
  })

  const resetForm = () => {
    form.reset(initialForm)
    setStatus('idle')
    setMessage('')
  }

  const handleSubmit = async (values: BugReportFormValues) => {
    setIsSubmitting(true)
    setStatus('idle')
    setMessage('')

    try {
      await submitBugReport({
        title: values.title,
        description: values.description,
        severity: values.severity,
      })
      setStatus('success')
      setMessage('Thanks, your report was sent.')
      form.reset(initialForm)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to send your bug report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          resetForm()
        }
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <div className="fixed bottom-5 right-5 z-40 sm:bottom-8 sm:right-8">
            <DialogTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="bug-report-button-pulse size-12 rounded-full bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] hover:bg-blue-700 focus-visible:ring-blue-300"
                  aria-label="Report a bug"
                >
                  <Flag className="size-4 stroke-[2.25]" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
            </DialogTrigger>
          </div>
          <TooltipContent side="top" align="center" className="px-3 py-2 text-sm">
            Report a bug
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="rounded-xl border-blue-100 p-0 sm:max-w-md">
        <div className="relative overflow-hidden rounded-xl">
          <div className="border-b border-slate-100 bg-blue-50 px-5 py-4">
            <DialogHeader className="pr-10">
              <DialogTitle>Report a bug</DialogTitle>
              <DialogDescription>
                Tell us what went wrong so we can take a look.
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close bug report"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>

          <Form {...form}>
            <form
              className="space-y-4 bg-white p-5"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800">Title</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11 rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100"
                        maxLength={255}
                        placeholder="Short summary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800">Severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100">
                          <SelectValue placeholder="Choose severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {severityOptions.map((option) => (
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-32 resize-y rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100"
                        placeholder="What happened? What were you trying to do?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {message && (
                <p
                  className={
                    status === 'success'
                      ? 'rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700'
                      : 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'
                  }
                  role={status === 'error' ? 'alert' : 'status'}
                >
                  {message}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:ring-blue-200"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                {isSubmitting ? 'Sending' : 'Submit report'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

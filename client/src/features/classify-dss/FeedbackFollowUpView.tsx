import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { ClassificationFeedback } from './components/ClassificationFeedback'
import { useForgetReminders, useReminder } from './hooks/useFeedbackReminders'
import { Button } from '@/components/ui/button'

const DATE = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  day: 'numeric',
})

/** Where a "how did the vet visit go?" reminder lands. */
export function FeedbackFollowUpView({ id }: { id: string }) {
  const { data: reminder, isLoading, isError, error } = useReminder(id)
  const forget = useForgetReminders()

  return (
    <section className="mx-auto max-w-2xl px-5 pt-6 pb-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-blue-600" />
        </div>
      ) : isError ? (
        <p role="alert" className="mt-8 text-center text-sm text-rose-600">
          {error.message}
        </p>
      ) : !reminder ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-[15px] font-bold text-slate-900">
            Already taken care of
          </p>
          <p className="mt-1 text-[13px] text-slate-600">
            This result has been answered or the reminder was dismissed.
          </p>
          <Button asChild className="mt-5 rounded-lg bg-blue-600 text-white">
            <Link to="/">Back to dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
            <p className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase">
              Your result from {DATE.format(new Date(reminder.classified_at))}
            </p>
            <p className="mt-1.5 text-[18px] font-bold text-slate-900">
              {reminder.diagnosis || 'Your pet’s result'}
            </p>
            <p className="mt-1 text-[13px] text-slate-600">
              PawMed AI suggested this
              {reminder.animal_type ? ` for your ${reminder.animal_type}` : ''}.
              Now that you've seen the vet, was it right?
            </p>
          </div>

          <ClassificationFeedback
            feedbackId={reminder.id}
            kind={reminder.kind}
            userType="fur_parent"
            // The photo and notes weren't kept, so there is nothing to share.
            imageUrl={null}
            notes=""
            suggestions={[]}
            onSaved={() => void forget()}
          />
        </div>
      )}
    </section>
  )
}

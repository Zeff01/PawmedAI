import { Link } from '@tanstack/react-router'
import { ChevronRight, Stethoscope, X } from 'lucide-react'

import {
  useDismissReminder,
  useDueReminders,
} from '../hooks/useFeedbackReminders'
import { Button } from '@/components/ui/button'

const DATE = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
})

/**
 * "How did the vet visit go?" — results the owner asked to be reminded about.
 * Renders nothing until a reminder has come due.
 */
export function FeedbackReminderCard() {
  const { data: reminders = [] } = useDueReminders()
  const dismiss = useDismissReminder()

  if (reminders.length === 0) return null

  return (
    <section
      aria-labelledby="feedback-reminders-title"
      className="rounded-xl border border-blue-100 bg-blue-50/60 p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
          <Stethoscope className="size-4" />
        </span>
        <div>
          <h2
            id="feedback-reminders-title"
            className="text-sm font-semibold text-slate-900"
          >
            How did the vet visit go?
          </h2>
          <p className="text-xs text-slate-600">
            You asked us to check back. Telling us what the vet said helps
            PawMed AI get better.
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {reminders.map((reminder) => (
          <li
            key={reminder.id}
            className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white py-1 pr-1 pl-3"
          >
            <Link
              to="/classify/feedback/$id"
              params={{ id: reminder.id }}
              className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-slate-800">
                  {reminder.diagnosis || 'Your pet’s result'}
                </span>
                <span className="block text-[11px] text-slate-500">
                  Checked {DATE.format(new Date(reminder.classified_at))}
                  {reminder.animal_type ? ` · ${reminder.animal_type}` : ''}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-blue-700">
                Tell us
                <ChevronRight className="size-3.5" />
              </span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Dismiss the reminder about ${reminder.diagnosis || 'this result'}`}
              disabled={dismiss.isPending}
              onClick={() => dismiss.mutate(reminder.id)}
              className="shrink-0 text-slate-400 hover:text-slate-700"
            >
              <X className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

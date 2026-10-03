import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  dismissReminder,
  fetchDueReminders,
  fetchReminder,
} from '../api/feedbackReminders'

export const reminderKeys = {
  due: ['feedback-reminders', 'due'] as const,
  one: (id: string) => ['feedback-reminders', id] as const,
}

export function useDueReminders(enabled = true) {
  return useQuery({
    queryKey: reminderKeys.due,
    queryFn: fetchDueReminders,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useReminder(id: string) {
  return useQuery({
    queryKey: reminderKeys.one(id),
    queryFn: () => fetchReminder(id),
  })
}

/** Dismissing or answering a reminder takes it off the dashboard. */
export function useForgetReminders() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ['feedback-reminders'] })
}

export function useDismissReminder() {
  const forget = useForgetReminders()
  return useMutation({
    mutationFn: dismissReminder,
    onSuccess: () => forget(),
  })
}

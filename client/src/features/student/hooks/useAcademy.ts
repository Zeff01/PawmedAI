import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  answerStage,
  fetchCase,
  fetchCases,
  fetchProgress,
  resetCase,
} from '../api/academy'
import type { AnswerResult, CaseDetail, StudentProgress } from '../api/academy'

export const academyKeys = {
  cases: ['academy', 'cases'] as const,
  case: (slug: string) => ['academy', 'case', slug] as const,
  progress: ['academy', 'progress'] as const,
}

export function useCases() {
  return useQuery({
    queryKey: academyKeys.cases,
    queryFn: fetchCases,
    staleTime: 30_000,
  })
}

export function useCase(slug: string) {
  return useQuery({
    queryKey: academyKeys.case(slug),
    queryFn: () => fetchCase(slug),
    enabled: Boolean(slug),
  })
}

export function useStudentProgress() {
  return useQuery<StudentProgress>({
    queryKey: academyKeys.progress,
    queryFn: fetchProgress,
    staleTime: 30_000,
  })
}

/**
 * Submit one stage answer.
 *
 * The result is the only place the model answer and the explanation appear, so
 * it is written straight into the cached case rather than being thrown away and
 * re-fetched — a refetch would return the same thing a beat later, and the
 * student would watch the answer they just earned flicker.
 */
export function useAnswerStage(slug: string) {
  const queryClient = useQueryClient()

  return useMutation<
    AnswerResult,
    Error,
    { stageId: number; selectedOptionIds: Array<number> }
  >({
    mutationFn: ({ stageId, selectedOptionIds }) =>
      answerStage({ slug, stageId, selectedOptionIds }),
    onSuccess: (result, { stageId, selectedOptionIds }) => {
      queryClient.setQueryData<CaseDetail>(academyKeys.case(slug), (current) =>
        current
          ? applyAnswer(current, stageId, selectedOptionIds, result)
          : current,
      )
      // The dashboard's tiles and the case list both move on every answer.
      void queryClient.invalidateQueries({ queryKey: academyKeys.progress })
      void queryClient.invalidateQueries({ queryKey: academyKeys.cases })
    },
  })
}

function applyAnswer(
  current: CaseDetail,
  stageId: number,
  selectedOptionIds: Array<number>,
  result: AnswerResult,
): CaseDetail {
  const stages = current.stages.map((stage) =>
    stage.id === stageId
      ? {
          ...stage,
          student: {
            answered: true,
            is_correct: result.is_correct,
            revealed: result.revealed,
            cleared: result.cleared,
            tries: result.tries,
            points_earned: result.points_earned,
            selected_option_ids: selectedOptionIds,
            correct_option_ids: result.correct_option_ids,
            explanation: result.explanation,
          },
        }
      : stage,
  )

  // Clearing a stage opens the next one; recompute rather than waiting for the
  // server to say so on the next fetch.
  const clearedOrders = new Set(
    stages.filter((stage) => stage.student.cleared).map((stage) => stage.order),
  )
  const unlocked = stages.map((stage) => ({
    ...stage,
    locked: stages.some(
      (earlier) =>
        earlier.order < stage.order && !clearedOrders.has(earlier.order),
    ),
  }))

  return {
    ...current,
    stages: unlocked,
    progress: {
      ...current.progress,
      started: true,
      completed: result.progress.completed,
      cleared_stages: result.progress.cleared_stages,
      total_stages: result.progress.total_stages,
      percent: result.progress.percent,
      points_earned: result.case_points,
      current_stage_title:
        unlocked.find((stage) => !stage.student.cleared)?.title ?? null,
    },
  }
}

export function useResetCase(slug: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: () => resetCase(slug),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academyKeys.case(slug) })
      void queryClient.invalidateQueries({ queryKey: academyKeys.cases })
      void queryClient.invalidateQueries({ queryKey: academyKeys.progress })
    },
  })
}

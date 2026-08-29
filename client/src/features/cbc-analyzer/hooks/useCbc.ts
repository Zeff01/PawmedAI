import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { analyzeCbc } from '../api/analyzeCbc'
import {
  amendMedicalLog,
  deleteMedicalLog,
  fetchMedicalLog,
  fetchMedicalLogSummary,
  fetchMedicalLogs,
  saveMedicalLog,
} from '../api/medicalLogs'
import { createPet, fetchPets } from '../api/pets'
import { useMe, useSupabaseSession } from '@/hooks/useAuth'
import { useRefreshQuota } from '@/hooks/useQuota'
import type { AnalyzeCbcPayload } from '../api/analyzeCbc'
import type {
  MedicalLogAmendment,
  SaveMedicalLogPayload,
} from '../api/medicalLogs'
import type {
  CbcAnalysis,
  MedicalLogDetail,
  MedicalLogFilters,
  MedicalLogListItem,
  MedicalLogSummary,
  Paginated,
  Pet,
  PetDraft,
} from '../types'

export const cbcKeys = {
  all: ['cbc'] as const,
  pets: (search: string) => ['cbc', 'pets', search] as const,
  logs: (filters: MedicalLogFilters) => ['cbc', 'logs', filters] as const,
  log: (recordId: string) => ['cbc', 'log', recordId] as const,
  summary: (filters: MedicalLogFilters) => ['cbc', 'summary', filters] as const,
}

export function useIsVeterinaryProfessional() {
  const { session, isLoading: isSessionLoading } = useSupabaseSession()
  const isAuthed = Boolean(session)
  const { data: me, isLoading: isMeLoading } = useMe({ enabled: isAuthed })

  return {
    isAuthed,
    isProfessional: me?.user_type === 'professional',
    userType: me?.user_type ?? null,
    me,
    isLoading: isSessionLoading || (isAuthed && isMeLoading),
  }
}

export function useAnalyzeCbc() {
  const refreshQuota = useRefreshQuota()
  return useMutation<CbcAnalysis, Error, AnalyzeCbcPayload>({
    mutationFn: analyzeCbc,
    // A run spends from the shared AI allowance whether it succeeds or comes
    // back throttled. Refreshing here rather than at the call site means a new
    // caller cannot forget to.
    onSettled: () => refreshQuota(),
  })
}

export function usePets(search = '', options?: { enabled?: boolean }) {
  return useQuery<Array<Pet>, Error>({
    queryKey: cbcKeys.pets(search),
    queryFn: () => fetchPets(search),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60,
  })
}

export function useCreatePet() {
  const queryClient = useQueryClient()
  return useMutation<Pet, Error, PetDraft>({
    mutationFn: createPet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cbc', 'pets'] })
    },
  })
}

export function useMedicalLogs(
  filters: MedicalLogFilters,
  options?: { enabled?: boolean },
) {
  return useQuery<Paginated<MedicalLogListItem>, Error>({
    queryKey: cbcKeys.logs(filters),
    queryFn: () => fetchMedicalLogs(filters),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  })
}

export function useMedicalLog(
  recordId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<MedicalLogDetail, Error>({
    queryKey: cbcKeys.log(recordId),
    queryFn: () => fetchMedicalLog(recordId),
    enabled: (options?.enabled ?? true) && Boolean(recordId),
    retry: false,
  })
}

export function useMedicalLogSummary(
  filters: MedicalLogFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery<MedicalLogSummary, Error>({
    queryKey: cbcKeys.summary(filters),
    queryFn: () => fetchMedicalLogSummary(filters),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  })
}

export function useSaveMedicalLog() {
  const queryClient = useQueryClient()
  return useMutation<MedicalLogDetail, Error, SaveMedicalLogPayload>({
    mutationFn: saveMedicalLog,
    onSuccess: (log) => {
      queryClient.setQueryData(cbcKeys.log(log.record_id), log)
      void queryClient.invalidateQueries({ queryKey: ['cbc', 'logs'] })
      void queryClient.invalidateQueries({ queryKey: ['cbc', 'summary'] })
      void queryClient.invalidateQueries({ queryKey: ['cbc', 'pets'] })
    },
  })
}

export function useAmendMedicalLog(recordId: string) {
  const queryClient = useQueryClient()
  return useMutation<MedicalLogDetail, Error, MedicalLogAmendment>({
    mutationFn: (amendment) => amendMedicalLog(recordId, amendment),
    onSuccess: (log) => {
      queryClient.setQueryData(cbcKeys.log(log.record_id), log)
      void queryClient.invalidateQueries({ queryKey: ['cbc', 'logs'] })
    },
  })
}

export function useDeleteMedicalLog() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: deleteMedicalLog,
    onSuccess: (_data, recordId) => {
      queryClient.removeQueries({ queryKey: cbcKeys.log(recordId) })
      void queryClient.invalidateQueries({ queryKey: ['cbc', 'logs'] })
      void queryClient.invalidateQueries({ queryKey: ['cbc', 'summary'] })
    },
  })
}

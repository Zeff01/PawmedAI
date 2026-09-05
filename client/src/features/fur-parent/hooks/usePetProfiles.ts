import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addMedication,
  addVaccination,
  createPet,
  deletePet,
  fetchDashboard,
  logMedicationDose,
  logWeight,
  rescheduleAppointment,
  updatePet,
  uploadDocument,
} from '../api/petProfiles'
import { useSupabaseSession } from '@/hooks/useAuth'
import type { FurParentDashboardData } from '../types'

export const petKeys = {
  all: ['pet-profiles'] as const,
  dashboard: () => ['pet-profiles', 'dashboard'] as const,
}

export function useFurParentDashboard() {
  const { session, isLoading: isSessionLoading } = useSupabaseSession()

  const query = useQuery<FurParentDashboardData>({
    queryKey: petKeys.dashboard(),
    queryFn: fetchDashboard,
    enabled: Boolean(session),
    staleTime: 30_000,
  })

  return {
    ...query,
    isLoading: isSessionLoading || (Boolean(session) && query.isLoading),
  }
}

function useDashboardMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: petKeys.dashboard() }),
  })
}

export function useCreatePet() {
  return useDashboardMutation(createPet)
}

export function useDeletePet() {
  return useDashboardMutation(deletePet)
}

export function useLogMedicationDose() {
  return useDashboardMutation(
    ({ medicationId, note }: { medicationId: string; note?: string }) =>
      logMedicationDose(medicationId, note),
  )
}

export function useLogWeight() {
  return useDashboardMutation(logWeight)
}

export function useUploadDocument() {
  return useDashboardMutation(uploadDocument)
}

export function useAddVaccination() {
  return useDashboardMutation(addVaccination)
}

export function useUpdatePet() {
  return useDashboardMutation(updatePet)
}

export function useAddMedication() {
  return useDashboardMutation(addMedication)
}

export function useRescheduleAppointment() {
  return useDashboardMutation(rescheduleAppointment)
}

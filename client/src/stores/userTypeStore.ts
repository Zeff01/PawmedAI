import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserType } from '@/types/auth'

type UserTypeState = {
  userType: UserType | null
  dialogOpen: boolean
  lockSelection: boolean
  setUserType: (userType: UserType) => void
  clearUserType: (options?: { openDialog?: boolean }) => void
  setLockSelection: (locked: boolean) => void
  openDialog: () => void
  closeDialog: () => void
}

export const useUserTypeStore = create<UserTypeState>()(
  persist(
    (set) => ({
      userType: null,
      dialogOpen: false,
      lockSelection: false,
      setUserType: (userType) =>
        set({
          userType,
          dialogOpen: false,
        }),
      clearUserType: (options) =>
        set({
          userType: null,
          dialogOpen: options?.openDialog ?? false,
        }),
      setLockSelection: (locked) => set({ lockSelection: locked }),
      openDialog: () => set({ dialogOpen: true }),
      closeDialog: () => set({ dialogOpen: false }),
    }),
    {
      name: 'pawmedai-user-type',
      partialize: (state) => ({ userType: state.userType }),
    },
  ),
)

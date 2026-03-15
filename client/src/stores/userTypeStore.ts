import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserType = 'student' | 'professional'

type UserTypeState = {
  userType: UserType | null
  dialogOpen: boolean
  setUserType: (userType: UserType) => void
  openDialog: () => void
  closeDialog: () => void
  resetUserType: () => void
}

export const useUserTypeStore = create<UserTypeState>()(
  persist(
    (set) => ({
      userType: null,
      dialogOpen: false,
      setUserType: (userType) =>
        set({
          userType,
          dialogOpen: false,
        }),
      openDialog: () => set({ dialogOpen: true }),
      closeDialog: () => set({ dialogOpen: false }),
      resetUserType: () =>
        set({
          userType: null,
          dialogOpen: true,
        }),
    }),
    {
      name: 'pawmedai-user-type',
      partialize: (state) => ({ userType: state.userType }),
    },
  ),
)

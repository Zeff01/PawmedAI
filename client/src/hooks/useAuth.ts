import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import apiClient from '../lib/apiClient'
import type {
  OAuthCallbackPayload,
  OAuthProvider,
  UserProfile,
} from '../types/auth'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const authKeys = {
  me: ['auth', 'me'] as const,
}

// ─── Fetch current Django user ────────────────────────────────────────────────

async function fetchMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/auth/me/')
  return data
}

export function useMe() {
  return useQuery<UserProfile, Error>({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Initiate OAuth login ─────────────────────────────────────────────────────

export function useOAuthLogin() {
  return useMutation<void, Error, OAuthProvider>({
    mutationFn: async (provider: OAuthProvider): Promise<void> => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw new Error(error.message)
    },
  })
}

// ─── Sync session with Django after OAuth redirect ────────────────────────────

async function postOAuthCallback(
  payload: OAuthCallbackPayload,
): Promise<UserProfile> {
  const { data } = await apiClient.post<UserProfile>('/auth/callback/', payload)
  return data
}

export function useOAuthCallback() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, OAuthCallbackPayload>({
    mutationFn: postOAuthCallback,
    onSuccess: (user: UserProfile) => {
      queryClient.setQueryData<UserProfile>(authKeys.me, user)
    },
  })
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.me })
    },
  })
}

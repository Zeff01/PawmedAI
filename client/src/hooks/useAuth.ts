import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import apiClient from '../lib/apiClient'
import type {
  OAuthCallbackPayload,
  OAuthProvider,
  UserProfile,
  UserType,
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

export function useMe(options?: { enabled?: boolean }) {
  return useQuery<UserProfile, Error>({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    enabled: options?.enabled ?? true,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null)
        setIsLoading(false)
      }
    })
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        setIsLoading(false)
      },
    )
    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return { session, isLoading }
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

// ─── Google direct OAuth: exchange code → id_token → Supabase + Django sync ──

interface GoogleCodePayload {
  code: string
  redirectUri: string
}

export function useGoogleSignIn() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, GoogleCodePayload>({
    mutationFn: async ({ code, redirectUri }: GoogleCodePayload): Promise<UserProfile> => {
      // 1. Send auth code to Django backend to exchange for id_token
      const exchangeResp = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/api/user/auth/google/exchange/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: redirectUri }),
        },
      )
      if (!exchangeResp.ok) {
        const err = await exchangeResp.json().catch(() => null)
        throw new Error(err?.detail ?? 'Failed to exchange Google auth code')
      }
      const { id_token: idToken } = await exchangeResp.json()

      // 2. Sign into Supabase with the id_token (records user in Supabase)
      const { data: authData, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })
      if (error) throw new Error(error.message)
      if (!authData.session) throw new Error('No session returned')

      // 3. Sync with Django
      const { data } = await apiClient.post<UserProfile>('/auth/callback/', {
        access_token: authData.session.access_token,
      })
      return data
    },
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
      queryClient.setQueryData(authKeys.me, undefined)
      queryClient.removeQueries({ queryKey: authKeys.me })
    },
  })
}

export function useSetUserType() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, UserType>({
    mutationFn: async (userType: UserType): Promise<UserProfile> => {
      const { data } = await apiClient.post<UserProfile>('/auth/user-type/', {
        user_type: userType,
      })
      return data
    },
    onSuccess: (user) => {
      queryClient.setQueryData<UserProfile>(authKeys.me, user)
    },
  })
}

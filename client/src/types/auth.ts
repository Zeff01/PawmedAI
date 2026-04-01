import type { Provider } from '@supabase/supabase-js'

export type OAuthProvider = Extract<Provider, 'google' | 'github'>

export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface OAuthCallbackPayload {
  access_token: string
}

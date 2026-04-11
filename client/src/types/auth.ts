import type { Provider } from '@supabase/supabase-js'

export type OAuthProvider = Extract<Provider, 'github'>

export type UserType = 'student' | 'professional' | 'fur_parent'

export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: UserType | null
}

export interface OAuthCallbackPayload {
  access_token: string
}

import { redirect } from '@tanstack/react-router'
import { supabase } from './supabase'

export async function requireAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession()

  if (!data.session) {
    throw redirect({
      to: '/',
      search: { signin: 'required' },
      replace: true,
    })
  }
}

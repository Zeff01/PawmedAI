import { createFileRoute } from '@tanstack/react-router'

import GoogleCallbackPage from '@/features/auth/components/GoogleCallback'

export const Route = createFileRoute('/auth/google/callback')({
  component: GoogleCallbackPage,
})

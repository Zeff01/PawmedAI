import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { registerSW } from 'virtual:pwa-register'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { authKeys } from '@/hooks/useAuth'
import { UserTypeDialog } from '@/features/classify-dss/components/UserTypeDialog'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

const queryClient = new QueryClient()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function AuthSync() {
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          queryClient.setQueryData(authKeys.me, null)
          queryClient.removeQueries({ queryKey: authKeys.me })
          return
        }
        queryClient.invalidateQueries({ queryKey: authKeys.me })
      },
    )

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  return null
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  registerSW({ immediate: true })
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <UserTypeDialog />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

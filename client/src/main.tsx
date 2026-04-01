import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { registerSW } from 'virtual:pwa-register'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { authKeys } from '@/hooks/useAuth'

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
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    })

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
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

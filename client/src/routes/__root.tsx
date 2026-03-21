import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import '../styles.css'
import { Header } from '#/components/Header'
import { SiteStructuredData } from '#/components/SiteStructuredData'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <SiteStructuredData />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700 focus:shadow"
      >
        Skip to content
      </a>
      <Header />

      <main id="main-content" className="min-h-[calc(100vh-120px)]">
        <Outlet />
      </main>

      <footer className="border-t border-slate-100 bg-white/60 px-5 py-6 text-center text-xs text-slate-400">
        <p>Pawmed AI • Veterinary diagnostics</p>
      </footer>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  )
}

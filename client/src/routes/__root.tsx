import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import '../styles.css'
import { AnalyticsTracker } from '@/components/AnalyticsTracker'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProfessionalShell } from '@/components/ProfessionalShell'
import { FurParentShell } from '@/components/FurParentShell'
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt'
import { Toaster } from '@/components/ui/sonner'
import { SiteStructuredData } from '@/components/SiteStructuredData'
import { BugReportWidget } from '@/features/bug-report/components/BugReportWidget'
import { useUserType } from '@/hooks/useUserType'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { isProfessional, isFurParent } = useUserType()

  return (
    <>
      <SiteStructuredData />
      <AnalyticsTracker />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700 focus:shadow"
      >
        Skip to content
      </a>

      {isProfessional ? (
        <ProfessionalShell>
          <Outlet />
        </ProfessionalShell>
      ) : isFurParent ? (
        <FurParentShell>
          <Outlet />
        </FurParentShell>
      ) : (
        <>
          <Header />

          <main id="main-content" className="min-h-[calc(100vh-120px)]">
            <Outlet />
          </main>

          <Footer />
        </>
      )}

      <NotificationPermissionPrompt />
      {isFurParent ? null : <BugReportWidget />}
      <Toaster />
      {import.meta.env.DEV && (
        <TanStackDevtools
          config={{ position: 'bottom-left' }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      )}
    </>
  )
}

import * as React from 'react'
import { useLocation } from '@tanstack/react-router'

import { QuotaBadge } from './QuotaBadge'
import { ProfessionalSidebar } from './ProfessionalSidebar'
import { Separator } from './ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './ui/sidebar'
import { useLogout } from '@/hooks/useAuth'

const PAGE_TITLES: Array<{ path: string; title: string }> = [
  { path: '/cbc-analyzer', title: 'CBC Analyzer' },
  { path: '/classify-breed', title: 'Classify Breed' },
  { path: '/classify', title: 'Classify Disease' },
  { path: '/medical-log', title: 'Medical Log' },
  { path: '/nearby-vets', title: 'Nearby Vets' },
  { path: '/lifecycle', title: 'Lifecycle' },
  { path: '/animals', title: 'Animals' },
]

function resolveTitle(pathname: string) {
  if (pathname === '/') return 'Dashboard'
  const match = PAGE_TITLES.find(
    (entry) => pathname === entry.path || pathname.startsWith(entry.path + '/'),
  )
  return match?.title ?? 'Pawmed AI'
}

function readSidebarCookie() {
  if (typeof document === 'undefined') return true
  const match = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/)
  return match ? match[1] === 'true' : true
}

export function ProfessionalShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { mutate: logout, isPending: logoutPending } = useLogout()
  const [signingOut, setSigningOut] = React.useState(false)
  const defaultOpen = React.useMemo(readSidebarCookie, [])

  const handleSignOut = () => {
    setSigningOut(true)
    logout(undefined, {
      onSuccess: () => window.location.reload(),
      onError: () => setSigningOut(false),
    })
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <ProfessionalSidebar
        onSignOut={handleSignOut}
        signOutPending={logoutPending}
      />

      <SidebarInset id="main-content" className="min-w-0 bg-white">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-100 bg-white/80 px-4 backdrop-blur-lg">
          <SidebarTrigger className="-ml-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" />
          <Separator orientation="vertical" className="mr-1 h-4 bg-slate-200" />
          <h1 className="truncate text-[14px] font-semibold tracking-tight text-slate-900">
            {resolveTitle(location.pathname)}
          </h1>

          {/* One allowance across every AI feature, so it belongs in the
              chrome rather than on any single feature's page. */}
          <QuotaBadge withContext className="ml-auto shrink-0" />
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </SidebarInset>

      {signingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />
          <div className="relative flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-6 py-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Signing you out…
            </p>
            <p className="text-xs text-slate-500">
              Please keep this window open.
            </p>
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}

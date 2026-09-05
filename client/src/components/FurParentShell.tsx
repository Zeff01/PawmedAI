import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  ChevronDown,
  House,
  LogOut,
  MapPin,
  Menu,
  PawPrint,
  ScanEye,
  X,
  Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { HelplineButton } from '@/features/fur-parent/components/EmergencyHelplineDialog'
import { cn } from '@/lib/utils'
import { useLogout, useMe } from '@/hooks/useAuth'
import { useQuota } from '@/hooks/useQuota'

type NavItem = {
  to: '/' | '/classify' | '/classify-breed' | '/nearby-vets'
  label: string
  short: string
  icon: ComponentType<{ className?: string }>
}

const NAV: Array<NavItem> = [
  { to: '/', label: 'Home', short: 'Home', icon: House },
  { to: '/classify', label: 'AI Checkup', short: 'Checkup', icon: ScanEye },
  { to: '/classify-breed', label: 'Breed ID', short: 'Breed', icon: PawPrint },
  { to: '/nearby-vets', label: 'Nearby Vets', short: 'Vets', icon: MapPin },
]

export const FP_CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'

export function FurParentShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { data: me } = useMe()
  const { mutate: logout, isPending: logoutPending } = useLogout()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const firstName = me?.first_name.trim() || me?.username || 'there'

  React.useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    document.documentElement.dataset.profile = 'fur-parent'
    return () => {
      delete document.documentElement.dataset.profile
    }
  }, [])

  const isActive = (to: NavItem['to']) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <div className="flex min-h-screen flex-col bg-fp-canvas font-fp-sans text-slate-800 antialiased">
      <header className="sticky top-0 z-40 border-b border-fp-border bg-white/95 backdrop-blur-md">
        <div
          className={cn(
            FP_CONTAINER,
            'flex items-center justify-between gap-4 py-3',
          )}
        >
          <div className="flex min-w-0 items-center gap-6">
            <Link
              to="/"
              className="group flex shrink-0 items-center gap-2.5"
              aria-label="Pawmed AI home"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-fp-brand-800 text-white shadow-fp-subtle transition group-hover:scale-105">
                <PawPrint className="size-5" />
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xl font-bold tracking-tight text-slate-900">
                  Pawmed<span className="text-fp-brand-600">.ai</span>
                </span>
                <span className="block text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  Caregiver Health OS
                </span>
              </span>
            </Link>

            <nav
              className="hidden items-center rounded-full border border-slate-200/70 bg-slate-100/90 p-1 lg:flex"
              aria-label="Primary"
            >
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs transition',
                    isActive(item.to)
                      ? 'bg-white font-semibold text-fp-brand-800 shadow-fp-subtle'
                      : 'font-medium text-slate-600 hover:text-slate-900',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <AllowanceChip />

            <HelplineButton variant="header" label="Emergency help" />

            <div className="hidden items-center pl-1 md:flex">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 p-0.5 pr-2.5 transition hover:bg-slate-100"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-fp-brand-100 text-xs font-bold text-fp-brand-800 ring-2 ring-white">
                  {firstName.slice(0, 1).toUpperCase()}
                </span>
                <ChevronDown
                  className={cn(
                    'size-3.5 text-slate-500 transition-transform',
                    menuOpen && 'rotate-180',
                  )}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 md:hidden"
            >
              {menuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-fp-border bg-white shadow-fp-card">
            <div className={cn(FP_CONTAINER, 'flex flex-col gap-1 py-4')}>
              <p className="px-1 pb-1 text-[11px] text-slate-500">
                Signed in as {me?.email ?? firstName} · Fur Parent
              </p>
              <HelplineButton variant="menu" />
              <button
                type="button"
                onClick={() => logout()}
                disabled={logoutPending}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <LogOut className="size-4 text-slate-500" />
                {logoutPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main id="main-content" className="flex-1 pb-10 lg:pb-0">
        {children}
      </main>

      <nav
        className="fixed right-20 bottom-3 left-3 z-40 flex items-center justify-around gap-1 rounded-full border border-fp-border bg-white/95 p-1.5 shadow-fp-elevated backdrop-blur-md lg:hidden"
        aria-label="Primary"
      >
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1.5 py-2 text-[10px] font-semibold transition',
              isActive(item.to)
                ? 'bg-fp-brand-50 text-fp-brand-800'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            <item.icon className="size-5" />
            {item.short}
          </Link>
        ))}
      </nav>

      <footer className="mt-16 border-t border-fp-border bg-white pt-8 pb-28 lg:pb-8">
        <div
          className={cn(
            FP_CONTAINER,
            'flex flex-col items-center justify-between gap-4 text-xs text-slate-500 md:flex-row',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Pawmed.ai</span>
            <span>
              © {new Date().getFullYear()} Fur Parent Health OS · Built for
              loving caregivers
            </span>
          </div>
          <p className="max-w-xl text-center text-[11px] text-slate-400 md:text-right">
            Disclaimer: Pawmed AI guidance supports your care decisions — it
            does not constitute a veterinary diagnosis. If your pet exhibits
            respiratory distress, severe trauma, or toxin ingestion, immediately
            seek an accredited veterinary clinic.
          </p>
        </div>
      </footer>
    </div>
  )
}

function AllowanceChip() {
  const { data: quota, isError } = useQuota()
  if (!quota || isError) return null

  const low = quota.remaining <= 1

  return (
    <span
      title={`${quota.remaining} of ${quota.limit} analyses left · shared across every AI feature`}
      aria-live="polite"
      className={cn(
        'hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex',
        low
          ? 'border-rose-200/70 bg-rose-50 text-rose-700'
          : 'border-fp-brand-200/70 bg-fp-brand-50 text-fp-brand-800',
      )}
    >
      <Zap
        className={cn(
          'size-3.5',
          low ? 'text-rose-500' : 'animate-pulse text-fp-brand-600',
        )}
      />
      {quota.remaining}/{quota.limit} analyses
    </span>
  )
}

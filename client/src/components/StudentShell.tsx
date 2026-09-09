import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'
import { ChevronDown, GraduationCap } from 'lucide-react'

import { QuotaBadge } from './QuotaBadge'
import { Footer } from './Footer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useLogout, useMe } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

/**
 * The one page gutter for the student view — the header and every page below
 * it share it, so their columns line up at any width.
 *
 * The cap and the padding sit on the same element, which keeps the content box
 * the same arithmetic in both places, and the ramp is gradual: a single jump to
 * a 208px gutter left roughly 600px of usable width on a 1024px laptop, and the
 * column actually got narrower as the screen got wider. Past `lg` the cap does
 * the work and the gutters grow on their own.
 */
export const STUDENT_CONTAINER = 'mx-auto w-full max-w-272 px-5 sm:px-6 lg:px-8'

/**
 * Chrome for the Veterinary Student view.
 *
 * The academy design puts navigation in a pill rail rather than the plain link
 * row the marketing header uses, and trades the "Get started" CTA for the
 * student's own identity — they are already in, and the page they land on is a
 * workspace. Every destination is a route that exists; the design's Cases,
 * Learning, Case Library and Progress tabs map onto the AI features a student
 * account can actually reach today.
 */
const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/classify', label: 'Classify Disease' },
  { to: '/classify-breed', label: 'Classify Breed' },
  { to: '/nearby-vets', label: 'Nearby Vets' },
] as const

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'VS'
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : words[0].slice(0, 2).toUpperCase()
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { data: me } = useMe()
  const { mutate: logout, isPending: logoutPending } = useLogout()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)

  React.useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const isActive = (to: string) =>
    to === '/'
      ? location.pathname === '/'
      : location.pathname === to || location.pathname.startsWith(to + '/')

  const displayName = me ? me.first_name.trim() || me.username : 'Student'
  const fullName = me
    ? [me.first_name, me.last_name].filter(Boolean).join(' ').trim() ||
      me.username
    : 'Student'

  const handleSignOut = () => {
    setSigningOut(true)
    logout(undefined, {
      onSuccess: () => window.location.reload(),
      onError: () => setSigningOut(false),
    })
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div
          className={cn(
            STUDENT_CONTAINER,
            'flex h-16 items-center justify-between gap-6',
          )}
        >
          <div className="flex min-w-0 items-center gap-8">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-3"
              aria-label="Pawmed AI student dashboard"
            >
              <img
                src="/images/pawmed-logo-blue.png"
                alt="PawMed AI"
                width={1344}
                height={257}
                className="h-6 w-auto"
              />
            </Link>

            <nav
              className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 xl:flex"
              aria-label="Primary"
            >
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    isActive(item.to)
                      ? 'rounded-full bg-blue-600 px-4 py-1.5 text-[13px] font-bold text-white'
                      : 'rounded-full px-4 py-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900'
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <QuotaBadge withContext className="hidden md:inline-block" />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-slate-100">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                  {initials(fullName)}
                </span>
                <span className="hidden flex-col text-left leading-tight sm:flex">
                  <span className="text-[12.5px] font-semibold text-slate-900">
                    {displayName}
                  </span>
                  <span className="text-[10.5px] font-medium text-slate-400">
                    Veterinary Student
                  </span>
                </span>
                <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2 text-[12.5px]">
                  <GraduationCap className="size-4 text-blue-600" />
                  <span className="min-w-0 flex-1 truncate">{fullName}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  disabled={logoutPending}
                  className="text-[13px]"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 xl:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="min-h-[calc(100vh-120px)] bg-slate-50">
        {children}
      </main>

      <Footer />

      {/* Mobile navigation */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm xl:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out xl:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Student navigation"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={
                    isActive(item.to)
                      ? 'flex w-full items-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[14px] font-semibold text-blue-600'
                      : 'flex w-full items-center rounded-xl px-4 py-3 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900'
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-100 px-4 py-5">
          <div className="flex justify-center">
            <QuotaBadge withContext />
          </div>
        </div>
      </aside>

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
    </>
  )
}

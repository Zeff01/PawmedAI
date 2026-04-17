import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Button } from './ui/button'
import {
  BeakerIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/solid'
import { PawIcon } from './custom/custom-icons'
import { useState, useEffect } from 'react'
import LifeCycle from './LifeCycle'
import { AuthModal } from './AuthModal'
import { useMe, useLogout } from '@/hooks/useAuth'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/classify', label: 'Classify' },
  { to: '/classify-breed', label: 'Classify Breed' },
  { to: '/nearby-vets', label: 'Nearby Vets' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { data: me } = useMe()
  const { mutate: logout, isPending: logoutPending } = useLogout()
  const [authOpen, setAuthOpen] = useState(false)
  const isClassify = location.pathname.startsWith('/classify')
  const [signingOut, setSigningOut] = useState(false)

  const isActivePath = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  const renderNavItem = (
    item: { to: string; label: string },
    className: string,
    activeClassName: string,
  ) => {
    const active = isActivePath(item.to)

    const mergedClassName = active ? activeClassName : className

    if (item.to === '/classify' && !me && !isClassify) {
      return (
        <AuthModal
          showGuestOption
          onGuestContinue={() => navigate({ to: '/classify' })}
          trigger={
            <button type="button" className={mergedClassName}>
              {item.label}
            </button>
          }
        />
      )
    }

    return (
      <Link to={item.to} className={mergedClassName}>
        {item.label}
      </Link>
    )
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header>
        <LifeCycle />
      </header>

      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-lg">
        <div className="border-b border-slate-100 px-0 shadow-[0_1px_12px_rgba(15,28,63,0.06)] md:px-14">
          <div className="page-wrap flex h-15.5 items-center justify-between px-5">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="Pawmed AI home"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-linear-to-br from-blue-500 to-blue-700 text-white shadow-sm">
                <div className="rotate-20">
                  <PawIcon />
                </div>
              </div>
              <div className="leading-tight">
                <p className="text-[14px] font-bold tracking-tight text-slate-900">
                  Pawmed AI
                </p>
                <p className="text-[10.5px] font-medium tracking-wide text-slate-400">
                  Veterinary diagnostics
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center md:flex" aria-label="Primary">
              <ul className="flex items-center gap-6">
                {navLinks.map((item) => (
                  <li key={item.to}>
                    {renderNavItem(
                      item,
                      'text-[14px] font-medium text-slate-500 transition-colors hover:text-slate-900',
                      'text-[14px] font-semibold text-blue-600 transition-colors',
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2.5">
              {isClassify ? (
                me ? (
                  <>
                    <span className="hidden text-[12px] font-medium text-slate-600 md:block">
                      Hi, {me.first_name || me.username}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg px-3 py-2 text-[12px] font-semibold"
                      onClick={() => {
                        setSigningOut(true)
                        logout(undefined, {
                          onSuccess: () => window.location.reload(),
                          onError: () => setSigningOut(false),
                        })
                      }}
                      disabled={logoutPending}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <AuthModal
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-lg px-3 py-2 text-[12px] font-semibold hover:bg-blue-500 hover:text-white hover:border-blue-500"
                      >
                        <span>Sign in</span>
                        <ArrowLongRightIcon className="h-4 w-4 shrink-0" />
                      </Button>
                    }
                  />
                )
              ) : me ? (
                <Button
                  asChild
                  className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white transition-all duration-150 hover:bg-blue-700"
                >
                  <Link to="/classify">
                    <BeakerIcon className="h-4 w-4" />
                    <span className="hidden md:block">Get Started</span>
                  </Link>
                </Button>
              ) : (
                <AuthModal
                  open={authOpen}
                  onOpenChange={setAuthOpen}
                  showGuestOption
                  onGuestContinue={() => {
                    setAuthOpen(false)
                    navigate({ to: '/classify' })
                  }}
                  trigger={
                    <Button
                      type="button"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white transition-all duration-150 hover:bg-blue-700"
                    >
                      <BeakerIcon className="h-4 w-4" />
                      <span className="hidden md:block">Get Started</span>
                    </Button>
                  }
                />
              )}

              {/* Hamburger — mobile only */}
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

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

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-linear-to-br from-blue-500 to-blue-700 text-white">
              <div className="rotate-20 scale-90">
                <PawIcon />
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-bold tracking-tight text-slate-900">
                Pawmed AI
              </p>
              <p className="text-[10px] font-medium tracking-wide text-slate-400">
                Veterinary diagnostics
              </p>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-2 px-2 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400">
            Navigation
          </p>
          <ul className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <li key={item.to}>
                {renderNavItem(
                  item,
                  'flex w-full items-center rounded-xl px-4 py-3 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900',
                  'flex w-full items-center rounded-xl px-4 py-3 text-[14px] font-semibold text-blue-600 bg-blue-50 border border-blue-100',
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Drawer Footer CTA */}
        <div className="border-t border-slate-100 px-4 py-5">
          {me ? (
            <Button
              asChild
              className="w-full rounded-xl bg-blue-600 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              <Link
                to="/classify"
                className="flex items-center justify-center gap-2"
              >
                <BeakerIcon className="h-4 w-4" />
                Get Started
              </Link>
            </Button>
          ) : (
            <AuthModal
              showGuestOption
              onGuestContinue={() => navigate({ to: '/classify' })}
              trigger={
                <Button className="w-full rounded-xl bg-blue-600 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700">
                  <BeakerIcon className="h-4 w-4" />
                  Get Started
                </Button>
              }
            />
          )}
          <p className="mt-3 text-center text-[11px] text-slate-400">
            AI-powered veterinary diagnostics
          </p>
        </div>
      </aside>
    </>
  )
}

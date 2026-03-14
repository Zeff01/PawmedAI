import { Link, useLocation } from '@tanstack/react-router'
import { Button } from './ui/button'
import { BeakerIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'
import { PawIcon } from './custom/custom-icons'
import { useState, useEffect } from 'react'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/classify', label: 'Classify' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-lg">
        <div className="border-b border-slate-100 px-0 shadow-[0_1px_12px_rgba(15,28,63,0.06)] md:px-14">
          <div className="page-wrap flex h-15.5 items-center justify-between px-5">
            {/* Logo */}
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
              <ul className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/80 p-1">
                {navLinks.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="rounded-lg px-4 py-1.5 text-[13px] font-medium text-slate-500 transition-all duration-150 hover:text-slate-800"
                      activeProps={{
                        className:
                          'rounded-lg px-4 py-1.5 text-[13px] font-semibold text-blue-600 bg-white shadow-sm border border-blue-100/60',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2.5">
              {/* CTA — always visible */}
              <Button
                asChild
                className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white transition-all duration-150 hover:bg-blue-700"
              >
                <Link to="/classify">
                  <BeakerIcon className="h-4 w-4" />
                  <span className="hidden md:block">Get Started</span>
                </Link>
              </Button>

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

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
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
                <Link
                  to={item.to}
                  className="flex items-center rounded-xl px-4 py-3 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  activeProps={{
                    className:
                      'flex items-center rounded-xl px-4 py-3 text-[14px] font-semibold text-blue-600 bg-blue-50 border border-blue-100',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Drawer Footer CTA */}
        <div className="border-t border-slate-100 px-4 py-5">
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
          <p className="mt-3 text-center text-[11px] text-slate-400">
            AI-powered veterinary diagnostics
          </p>
        </div>
      </div>
    </>
  )
}

import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { BeakerIcon } from '@heroicons/react/24/solid'
import { PawIcon } from './custom/custom-icons'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/classify', label: 'Classify' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/50 backdrop-blur-lg">
      <div className="border-b px-0 md:px-14 border-slate-100 shadow-[0_1px_12px_rgba(15,28,63,0.06)]">
        <div className="page-wrap flex h-15.5 items-center justify-between px-5">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="Pawmed AI home"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-linear-to-br from-blue-500 to-blue-700 text-white">
              <div className="rotate-20">
                <PawIcon />
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-[14px] font-bold tracking-tight text-slate-900">
                Pawmed AI
              </p>
              <p className="text-[10.5px] font-medium text-slate-400 tracking-wide">
                Veterinary diagnostics
              </p>
            </div>
          </Link>

          {/* Nav */}
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

          <div className="flex items-center gap-2.5">
            <Button
              asChild
              className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white transition-all duration-150 hover:bg-blue-700 "
            >
              <Link to="/classify">
                <BeakerIcon />
                <span className="hidden md:block">Get Started</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

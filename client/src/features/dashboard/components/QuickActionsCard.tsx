import { Link } from '@tanstack/react-router'
import { ChevronRightIcon } from '@heroicons/react/24/solid'
import { FlaskConical, MapPin, PawPrint, Stethoscope } from 'lucide-react'

const ACTIONS = [
  {
    to: '/cbc-analyzer',
    label: 'Analyze a CBC',
    hint: 'Upload a panel, get a brief',
    icon: FlaskConical,
  },
  {
    to: '/classify',
    label: 'Classify a disease',
    hint: 'From a clinical photo',
    icon: Stethoscope,
  },
  {
    to: '/classify-breed',
    label: 'Classify a breed',
    hint: 'Identify from an image',
    icon: PawPrint,
  },
  {
    to: '/nearby-vets',
    label: 'Find nearby vets',
    hint: 'Referral and clinic lookup',
    icon: MapPin,
  },
] as const

export function QuickActionsCard() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-[14px] font-bold tracking-tight text-slate-900">
          Quick actions
        </h2>
      </header>

      <ul className="divide-y divide-slate-100">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <li key={action.to}>
              <Link
                to={action.to}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-slate-800">
                    {action.label}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {action.hint}
                  </p>
                </div>
                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

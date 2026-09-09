import { Link } from '@tanstack/react-router'
import { ChevronRight, MapPin, PawPrint, Stethoscope } from 'lucide-react'

const TOOLS = [
  {
    to: '/classify',
    icon: Stethoscope,
    label: 'Classify Disease',
    detail: 'Photo and notes in, a structured diagnostic brief out.',
  },
  {
    to: '/classify-breed',
    icon: PawPrint,
    label: 'Classify Breed',
    detail: 'Identify a breed from a photo or a written description.',
  },
  {
    to: '/nearby-vets',
    icon: MapPin,
    label: 'Nearby Vets',
    detail: 'Find clinics for a rotation placement or a referral.',
  },
] as const

export function DiagnosticToolkitCard() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="text-[14px] font-bold text-slate-900">
          Diagnostic toolkit
        </h3>
        <p className="mt-0.5 text-[11.5px] text-slate-500">
          Bring a case to the models you'll be examined on.
        </p>
      </div>

      <ul className="space-y-1.5">
        {TOOLS.map((tool) => (
          <li key={tool.to}>
            <Link
              to={tool.to}
              className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-blue-50"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-white">
                <tool.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold text-slate-900">
                  {tool.label}
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-500">
                  {tool.detail}
                </span>
              </span>
              <ChevronRight className="mt-2 size-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

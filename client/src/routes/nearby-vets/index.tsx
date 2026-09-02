import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import NearbyVetsGeoMap from '@/components/custom/NearbyVetsGeoMap'
import { Seo } from '@/components/Seo'
import {
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid'
import { useMe } from '@/hooks/useAuth'
import { useUserType } from '@/hooks/useUserType'
import { AuthModal } from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import {
  ArrowRightIcon,
  ClipboardListIcon,
  FlaskConicalIcon,
} from 'lucide-react'
import { buildBreadcrumbSchema } from '@/utils/seo-schema'

export const Route = createFileRoute('/nearby-vets/')({
  component: RouteComponent,
})

const tips = [
  {
    icon: <MapPinIcon className="h-5 w-5 text-blue-500" />,
    title: 'Live location',
    body: 'Clinics are sorted by distance from your current position in real time.',
  },
  {
    icon: <MagnifyingGlassIcon className="h-5 w-5 text-amber-500" />,
    title: 'Search any area',
    body: 'Type a city, barangay, or address to find clinics somewhere.',
  },
  {
    icon: <PhoneIcon className="h-5 w-5 text-emerald-500" />,
    title: 'One-tap call',
    body: 'Tap Call on any card to dial the clinic directly from your device.',
  },
  {
    icon: <ClockIcon className="h-5 w-5 text-violet-500" />,
    title: 'Get directions',
    body: 'Tap Directions to open Google Maps with a route already plotted.',
  },
]

/**
 * Owners get nudged toward a classification while they wait on an appointment.
 * Professionals are on this page to place a referral, not to try the product,
 * so they get the referral hand-off instead — see `ProfessionalFooter`.
 */
function OwnerCta() {
  const { data: me } = useMe()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-6xl flex flex-col items-center gap-4 text-center">
      <p className="text-xs font-bold uppercase text-blue-500">
        While you wait
      </p>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        Already have a photo of your pet's condition?
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-slate-500">
        Run a quick AI classification before your appointment so you know what
        questions to ask the vet.
      </p>
      {me ? (
        <Link
          to="/classify"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          Start a classification <ArrowRightIcon className="h-4 w-4" />
        </Link>
      ) : (
        <AuthModal
          onAuthenticated={() => navigate({ to: '/classify' })}
          trigger={
            <Button
              size="lg"
              className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              Start a classification <ArrowRightIcon className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <p className="text-xs text-slate-400">
        Free with an account · Takes under 5 minutes
      </p>
    </div>
  )
}

const PROFESSIONAL_ACTIONS = [
  {
    to: '/medical-log',
    label: 'Open Medical Log',
    hint: 'Pull the patient history to send along',
    icon: ClipboardListIcon,
  },
  {
    to: '/cbc-analyzer',
    label: 'Open CBC Analyzer',
    hint: 'Attach a fresh panel to the referral',
    icon: FlaskConicalIcon,
  },
] as const

function ProfessionalFooter() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-normal text-blue-500">
        Referring out
      </p>
      <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
        Send the patient's workup with them
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROFESSIONAL_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
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
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function RouteComponent() {
  const { isProfessional } = useUserType()

  const description =
    'Locate the nearest veterinary clinics on a live map, or search any city or address. Get directions, phone numbers, and distances — powered by Pawmed AI.'

  return (
    <section className="bg-white text-slate-900 antialiased">
      <Seo
        title="Find a Vet Near You | Pawmed AI"
        description={description}
        keywords="find vet near me, nearest veterinary clinic, vet locator map, animal hospital near me, emergency vet, search vet by city, vet clinics by address, pawmed ai nearby vets"
        canonicalPath="/nearby-vets"
        ogImage="/images/hero-vet.jpg"
        ogImageAlt="Find a veterinary clinic near you with Pawmed AI's live vet locator map"
        structuredData={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Find a Vet Near You', path: '/nearby-vets' },
          ]),
        ]}
      />

      {/* ── HERO ──
          Marketing framing for owners arriving cold. Professionals reach this
          page from the sidebar and already have the page title in the shell
          chrome, so the hero is only noise between them and the map. */}
      {!isProfessional && (
        <div className="border-b border-slate-100 bg-linear-to-b from-blue-50/60 to-white px-6 py-12">
          <div className="mx-auto max-w-6xl flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-blue-600">
              <MapPinIcon className="h-3.5 w-3.5" />
              Location-based
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Find a Vet Near You
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-500 md:text-base">
              Instantly discover veterinary clinics in your area. Allow location
              access, or search any city or address, and we'll plot the nearest
              options on the map for you.
            </p>
          </div>
        </div>
      )}

      {/* ── TIPS STRIP ── */}
      <div className="border-b border-slate-100 px-6 py-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tips.map((tip) => (
            <div
              key={tip.title}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                {tip.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {tip.title}
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  {tip.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAP + CARDS ── */}
      <div className="px-6 py-10 md:px-10 xl:px-20">
        <div className="mx-auto max-w-6xl">
          <NearbyVetsGeoMap />
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <div
        className={
          isProfessional
            ? 'border-t border-slate-100 bg-slate-50 px-6 py-8'
            : 'border-t border-slate-100 bg-slate-50 px-6 py-12'
        }
      >
        {isProfessional ? <ProfessionalFooter /> : <OwnerCta />}
      </div>
    </section>
  )
}

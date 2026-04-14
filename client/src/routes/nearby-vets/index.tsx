import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import NearbyVetsGeoMap from '@/components/custom/NearbyVetsGeoMap'
import { Seo } from '@/components/Seo'
import { MapPinIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/solid'
import { useMe } from '@/hooks/useAuth'
import { AuthModal } from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'

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

function RouteComponent() {
  const { data: me } = useMe()
  const navigate = useNavigate()

  return (
    <section className="bg-white text-slate-900 antialiased">
      <Seo
        title="Find a Vet Near You | Pawmed AI"
        description="Locate the nearest veterinary clinics on a live map. Get directions, phone numbers, and distances — powered by Pawmed AI."
        canonicalPath="/nearby-vets"
      />

      {/* ── HERO ── */}
      <div className="border-b border-slate-100 bg-gradient-to-b from-blue-50/60 to-white px-6 py-12">
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
            access and we'll plot the nearest options on the map for you.
          </p>
        </div>
      </div>

      {/* ── TIPS STRIP ── */}
      <div className="border-b border-slate-100 px-6 py-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <div className="border-t border-slate-100 bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-6xl flex flex-col items-center gap-4 text-center">
          <p className="text-xs font-bold uppercase text-blue-500">
            While you wait
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Already have a photo of your pet's condition?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-slate-500">
            Run a quick AI classification before your appointment so you know
            what questions to ask the vet.
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
              showGuestOption
              onGuestContinue={() => navigate({ to: '/classify' })}
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
            No account required · Takes under 5 minutes
          </p>
        </div>
      </div>
    </section>
  )
}

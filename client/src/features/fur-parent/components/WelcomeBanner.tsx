import { Pencil, Share2 } from 'lucide-react'
import type { ComponentType } from 'react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { HouseholdHighlights } from '../care-priorities'

function today() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())
}

export function WelcomeBanner({
  firstName,
  petCount,
  onEditProfile,
  onShareRecords,
}: {
  firstName: string
  petCount: number
  highlights: HouseholdHighlights
  onEditProfile: () => void
  onShareRecords: () => void
}) {
  const household =
    petCount === 0
      ? 'No pets registered yet'
      : `${petCount} ${petCount === 1 ? 'pet' : 'pets'} in your care`

  return (
    <Card className="relative overflow-hidden rounded-t-2xl rounded-b-none border border-fp-border bg-emerald-700 p-6 text-white sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 -left-10 size-64 rounded-full bg-emerald-300/50 blur-3xl"
      />

      <img
        src="/images/mascot-vet-dog.png"
        alt=""
        aria-hidden
        loading="lazy"
        className="pointer-events-none absolute bottom-0 left-5 z-0 hidden h-25 w-auto -scale-x-100 select-none drop-shadow-2xl lg:block xl:h-38"
      />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5 lg:pl-56 xl:pl-55">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wider text-emerald-200/80 uppercase">
                {today()}
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Hello, {firstName}
              </h1>

              <p className="mt-1 max-w-xl text-sm text-emerald-100/80">
                Keep your furry companions healthy, calm, and deeply cared for
                with AI-augmented clinical monitoring.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2.5 md:items-end">
            <span className="text-xs font-bold text-emerald-100">
              {household}
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              <HeroAction
                icon={Pencil}
                label="Edit Profile"
                onClick={onEditProfile}
              />
              <HeroAction
                icon={Share2}
                label="Share Records"
                onClick={onShareRecords}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function HeroAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="h-auto gap-1.5 border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <Icon className="size-4 text-emerald-300" />
      {label}
    </Button>
  )
}

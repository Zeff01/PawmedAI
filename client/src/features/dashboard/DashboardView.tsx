import { Link } from '@tanstack/react-router'
import {
  BeakerIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid'
import { Stethoscope } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion/FadeIn'
import { useMe } from '@/hooks/useAuth'
import {
  useMedicalLogSummary,
  useMedicalLogs,
  usePets,
} from '@/features/cbc-analyzer/hooks/useCbc'
import { PatientsCard } from './components/PatientsCard'
import { QuickActionsCard } from './components/QuickActionsCard'
import { RecentRecordsCard } from './components/RecentRecordsCard'
import { ResultMixCard } from './components/ResultMixCard'
import { StatCard } from './components/StatCard'

/**
 * The stat tiles are period-scoped on purpose: the API only returns a
 * period-over-period delta when a window is set, and an all-time count beside a
 * month-over-month delta would read as one figure while being two.
 */
const WINDOW_DAYS = 30
const RECENT_LIMIT = 6

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardView() {
  const { data: me } = useMe()

  const summaryQuery = useMedicalLogSummary({ days: WINDOW_DAYS })
  const recentQuery = useMedicalLogs({
    days: '',
    page: 1,
    page_size: RECENT_LIMIT,
  })
  const petsQuery = usePets('')

  const summary = summaryQuery.data
  const records = recentQuery.data?.results ?? []
  const allTimeTotal = recentQuery.data?.count

  const now = new Date()
  const firstName = me ? me.first_name.trim() || me.username : 'Doctor'

  return (
    <section className="min-h-full px-5 pt-7 pb-16 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* ── Greeting ─────────────────────────────────────────────────── */}
        <FadeIn
          trigger="mount"
          className="mb-7 flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-slate-950">
              {greeting(now.getHours())}, {firstName}
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-500">
              {now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              {allTimeTotal !== undefined ? (
                <>
                  {' · '}
                  {allTimeTotal} record{allTimeTotal === 1 ? '' : 's'} on file
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-lg border-slate-200 px-4 text-[13px] font-bold text-slate-700 shadow-none hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <Link to="/classify">
                <Stethoscope className="h-4 w-4" />
                Classify disease
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-lg bg-blue-600 px-4 text-[13px] font-bold text-white shadow-none hover:bg-blue-700"
            >
              <Link to="/cbc-analyzer">
                <BeakerIcon className="h-4 w-4" />
                New CBC analysis
              </Link>
            </Button>
          </div>
        </FadeIn>

        {/* ── Stat tiles ───────────────────────────────────────────────── */}
        <FadeIn
          trigger="mount"
          delay={0.04}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            label={`Last ${WINDOW_DAYS} days`}
            value={summary?.total}
            loading={summaryQuery.isLoading}
            icon={BeakerIcon}
            accent="blue"
            hint="Analyses saved in this window"
          />
          <StatCard
            label="Normal"
            value={summary?.normal}
            loading={summaryQuery.isLoading}
            icon={CheckCircleIcon}
            accent="emerald"
            change={summary?.normal_change ?? null}
            changeIntent="more-is-good"
            hint={`vs the previous ${WINDOW_DAYS} days`}
          />
          <StatCard
            label="Flagged"
            value={summary?.abnormal}
            loading={summaryQuery.isLoading}
            icon={ExclamationTriangleIcon}
            accent="amber"
            change={summary?.abnormal_change ?? null}
            changeIntent="more-is-bad"
            hint={`vs the previous ${WINDOW_DAYS} days`}
          />
          <StatCard
            label="This month"
            value={summary?.this_month}
            loading={summaryQuery.isLoading}
            icon={CalendarDaysIcon}
            accent="slate"
            hint="Calendar month to date"
          />
        </FadeIn>

        {/* ── Recent work, alongside the mix and shortcuts ─────────────── */}
        <FadeIn
          trigger="mount"
          delay={0.08}
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          <div className="lg:col-span-2">
            <RecentRecordsCard
              records={records}
              isLoading={recentQuery.isLoading}
              error={recentQuery.error}
              onRetry={() => void recentQuery.refetch()}
            />
          </div>

          <div className="flex flex-col gap-4">
            <ResultMixCard
              normal={summary?.normal ?? 0}
              abnormal={summary?.abnormal ?? 0}
              isLoading={summaryQuery.isLoading}
              windowDays={WINDOW_DAYS}
            />
            <QuickActionsCard />
          </div>
        </FadeIn>

        {/* ── Patients ─────────────────────────────────────────────────── */}
        <FadeIn trigger="mount" delay={0.12} className="mt-4">
          <PatientsCard
            pets={petsQuery.data ?? []}
            isLoading={petsQuery.isLoading}
          />
        </FadeIn>
      </div>
    </section>
  )
}

import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { FadeIn } from '@/components/motion/FadeIn'

interface Lifespan {
  label: string
  value: string
}

interface Animal {
  name: string
  description: string
  url: string
  image: string
  status: string
  category: string
  scientific_name: string
  classification: Record<string, string>
  quick_stats: Record<string, string>
  features: string[]
  measurements: Record<string, string>
  facts: string[]
  conservation: {
    description?: string
    trend?: string
    protected_under?: string[]
  }
  lifecycle: {
    stages?: Record<string, string>
    lifespans?: Lifespan[]
    reproduction?: Record<string, string>
    reproduction_description?: string
  }
  behavior: Record<string, string>
}

const STATUS_COLORS: Record<string, string> = {
  'Least Concern': 'bg-green-100 text-green-700 border-green-200',
  'Near Threatened': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Vulnerable: 'bg-orange-100 text-orange-700 border-orange-200',
  Endangered: 'bg-red-100 text-red-700 border-red-200',
  'Critically Endangered': 'bg-red-200 text-red-800 border-red-300',
  'Extinct in the Wild': 'bg-slate-200 text-slate-700 border-slate-300',
  Extinct: 'bg-slate-300 text-slate-800 border-slate-400',
  'Not Evaluated': 'bg-slate-100 text-slate-500 border-slate-200',
}

const CATEGORY_EMOJI: Record<string, string> = {
  Mammals: '🦁',
  Birds: '🦜',
  Fish: '🐠',
  Reptiles: '🦎',
  Amphibians: '🐸',
  Insects: '🦋',
  Arachnids: '🕷️',
  Crustaceans: '🦀',
  Mollusks: '🐚',
  Other: '🐾',
}

const TREND_COLOR: Record<string, string> = {
  Increasing: 'text-green-600',
  Decreasing: 'text-red-500',
  Stable: 'text-blue-600',
}

function Section({
  title,
  children,
  delay = 0,
}: {
  title: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <FadeIn trigger="mount" delay={delay}>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-[13px] font-bold text-slate-800">{title}</h2>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </FadeIn>
  )
}

export function AnimalDetailView({ slug }: { slug: string }) {
  const [animal, setAnimal] = React.useState<Animal | null>(null)
  const [notFound, setNotFound] = React.useState(false)

  React.useEffect(() => {
    fetch('/animals.json')
      .then((r) => r.json())
      .then((data: Animal[]) => {
        const found = data.find(
          (a) =>
            a.name
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '') === slug,
        )
        if (found) setAnimal(found)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
  }, [slug])

  if (notFound) {
    return (
      <section className="page-wrap mt-16 text-center">
        <p className="text-[14px] text-slate-500">Animal not found.</p>
        <Link
          to="/classify-breed"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Back
        </Link>
      </section>
    )
  }

  if (!animal) {
    return (
      <section className="page-wrap mt-16 text-center">
        <p className="text-[13px] text-slate-400">Loading…</p>
      </section>
    )
  }

  const classificationRows = Object.entries(animal.classification).filter(
    ([k]) => k !== 'Species',
  )
  const hasQuickStats = Object.keys(animal.quick_stats).length > 0
  const hasMeasurements = Object.keys(animal.measurements).length > 0
  const hasLifecycle =
    Object.keys(animal.lifecycle?.stages ?? {}).length > 0 ||
    (animal.lifecycle?.lifespans?.length ?? 0) > 0
  const hasBehavior = Object.keys(animal.behavior ?? {}).length > 0
  const hasConservation = !!animal.conservation?.description

  const trendKey = Object.keys(TREND_COLOR).find((k) =>
    animal.conservation?.trend?.includes(k),
  )

  return (
    <section className="relative z-10 min-h-screen pb-24 mt-10">
      <div className="page-wrap max-w-4xl">
        {/* Back link */}
        <FadeIn trigger="mount">
          <Link
            to="/classify-breed"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 hover:underline"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to Classify Breed
          </Link>
        </FadeIn>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <FadeIn trigger="mount" delay={0.05}>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
            {animal.image && (
              <img
                src={animal.image}
                alt={animal.name}
                className="h-64 w-full object-cover sm:h-80"
              />
            )}
            <div className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {animal.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    <span>{CATEGORY_EMOJI[animal.category] ?? '🐾'}</span>
                    {animal.category}
                  </span>
                )}
                {animal.status && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[animal.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
                  >
                    {animal.status}
                  </span>
                )}
              </div>
              <h1 className="text-[26px] font-extrabold text-slate-900">
                {animal.name}
              </h1>
              {animal.scientific_name && (
                <p className="mt-0.5 text-[13px] italic text-slate-400">
                  {animal.scientific_name}
                </p>
              )}
              {animal.description && (
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                  {animal.description}
                </p>
              )}
            </div>
          </div>
        </FadeIn>

        <div className="mt-5 flex flex-col gap-5">
          {/* ── At a Glance ─────────────────────────────────────────────── */}
          {hasQuickStats && (
            <Section title="At a Glance" delay={0.08}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Object.entries(animal.quick_stats).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                  >
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold text-slate-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Physical Measurements ───────────────────────────────────── */}
          {hasMeasurements && (
            <Section title="Physical Measurements" delay={0.1}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(animal.measurements)
                  .filter(([, v]) => v && v !== '(0 lbs – 0 lbs)')
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[13px] font-bold text-slate-800">
                        {value}
                      </p>
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {/* ── Distinguishing Features ─────────────────────────────────── */}
          {animal.features.length > 0 && (
            <Section title="Distinguishing Features" delay={0.12}>
              <ul className="flex flex-col gap-2">
                {animal.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* ── Did You Know ────────────────────────────────────────────── */}
          {animal.facts.length > 0 && (
            <Section title="Did You Know?" delay={0.14}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {animal.facts.map((fact, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-900"
                  >
                    {fact}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Conservation ────────────────────────────────────────────── */}
          {hasConservation && (
            <Section title="Conservation Status" delay={0.16}>
              <div className="flex flex-col gap-3">
                {animal.status && (
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[12px] font-bold ${STATUS_COLORS[animal.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
                  >
                    {animal.status}
                  </span>
                )}
                {animal.conservation.description && (
                  <p className="text-[13px] text-slate-700">
                    {animal.conservation.description}
                  </p>
                )}
                {animal.conservation.trend && (
                  <p
                    className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${trendKey ? TREND_COLOR[trendKey] : 'text-slate-600'}`}
                  >
                    <span>
                      {trendKey === 'Increasing'
                        ? '↑'
                        : trendKey === 'Decreasing'
                          ? '↓'
                          : '→'}
                    </span>
                    {animal.conservation.trend}
                  </p>
                )}
                {(animal.conservation.protected_under?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Protected Under
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {animal.conservation.protected_under!.map((p, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── Life Cycle ──────────────────────────────────────────────── */}
          {hasLifecycle && (
            <Section title="Life Cycle" delay={0.18}>
              <div className="flex flex-col gap-4">
                {/* Stages */}
                {Object.keys(animal.lifecycle.stages ?? {}).length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(animal.lifecycle.stages!).map(
                      ([stage, val]) => (
                        <div
                          key={stage}
                          className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-center"
                        >
                          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-blue-500">
                            {stage}
                          </p>
                          <p className="mt-0.5 text-[14px] font-bold text-blue-800">
                            {val}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Lifespans */}
                {(animal.lifecycle.lifespans?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Lifespan
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {animal.lifecycle.lifespans!.map((ls, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <span className="text-[12px] text-slate-500">
                            {ls.label}
                          </span>
                          <span className="text-[13px] font-bold text-slate-800">
                            {ls.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reproduction */}
                {Object.keys(animal.lifecycle.reproduction ?? {}).length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Reproduction
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {Object.entries(animal.lifecycle.reproduction!)
                        .filter(([, v]) => v && !v.includes('_'))
                        .map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              {label}
                            </p>
                            <p className="mt-0.5 text-[12px] font-semibold text-slate-700">
                              {value}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Reproduction description */}
                {animal.lifecycle.reproduction_description && (
                  <p className="text-[13px] leading-relaxed text-slate-600">
                    {animal.lifecycle.reproduction_description}
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* ── Behavior & Ecology ──────────────────────────────────────── */}
          {hasBehavior && (
            <Section title="Behavior & Ecology" delay={0.2}>
              <div className="flex flex-col divide-y divide-slate-50">
                {Object.entries(animal.behavior)
                  .filter(([, v]) => v)
                  .map(([label, text]) => (
                    <div key={label} className="py-3 first:pt-0 last:pb-0">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                      <p className="text-[13px] leading-relaxed text-slate-700">
                        {text}
                      </p>
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {/* ── Scientific Classification ───────────────────────────────── */}
          {classificationRows.length > 0 && (
            <Section title="Scientific Classification" delay={0.22}>
              <dl className="divide-y divide-slate-50">
                {classificationRows.map(([label, value]) => (
                  <div key={label} className="flex py-2.5">
                    <dt className="w-28 shrink-0 text-[12px] font-semibold text-slate-400">
                      {label}
                    </dt>
                    <dd className="text-[12px] italic text-slate-700">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
        </div>
      </div>
    </section>
  )
}

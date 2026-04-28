import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { FadeIn } from '@/components/motion/FadeIn'
import { Seo } from '@/components/Seo'
import { buildBreadcrumbSchema } from '@/utils/seo-schema'

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
  'Least Concern': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Near Threatened': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Vulnerable: 'bg-orange-50 text-orange-700 border-orange-200',
  Endangered: 'bg-red-50 text-red-700 border-red-200',
  'Critically Endangered': 'bg-red-100 text-red-800 border-red-300',
  'Extinct in the Wild': 'bg-slate-100 text-slate-600 border-slate-200',
  Extinct: 'bg-slate-200 text-slate-700 border-slate-300',
  'Not Evaluated': 'bg-slate-50 text-slate-500 border-slate-200',
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
  Increasing: 'text-emerald-600',
  Decreasing: 'text-red-500',
  Stable: 'text-blue-600',
}

function splitBullets(text: string): string[] {
  return text
    .split(/(?<=[a-z\d)])(?=[A-Z])|(?<=\.) (?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function Card({
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
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="px-4 pt-4 pb-1">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {title}
          </h2>
        </div>
        <div className="px-4 pb-4 pt-2">{children}</div>
      </div>
    </FadeIn>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-[12.5px] font-bold text-slate-800">{value}</p>
    </div>
  )
}

function BulletList({
  items,
  color = 'bg-slate-300',
  textColor = 'text-slate-700',
}: {
  items: string[]
  color?: string
  textColor?: string
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li
          key={i}
          className={`flex items-start gap-2 text-[12.5px] leading-relaxed ${textColor}`}
        >
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`}
          />
          {item}
        </li>
      ))}
    </ul>
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
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 mt-16 text-center">
        <Seo
          title="Animal not found | Pawmed AI"
          description="The animal profile you requested could not be found on Pawmed AI."
          canonicalPath={`/animals/${slug}`}
          noIndex
        />
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
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 mt-16 text-center">
        <Seo canonicalPath={`/animals/${slug}`} />
        <p className="text-[13px] text-slate-400">Loading…</p>
      </section>
    )
  }

  const seoDescriptionBase = animal.description?.trim()
  const seoDescription = seoDescriptionBase
    ? `${animal.name} — ${seoDescriptionBase}. Explore classification, lifespan, behavior, conservation status, and key facts on Pawmed AI.`
    : `${animal.name} profile on Pawmed AI: scientific classification, lifespan, lifecycle, behavior, conservation status, and key facts.`
  const seoTitle = animal.scientific_name
    ? `${animal.name} (${animal.scientific_name}) — Profile, Lifespan & Facts | Pawmed AI`
    : `${animal.name} — Profile, Lifespan & Facts | Pawmed AI`
  const seoKeywords = [
    animal.name,
    animal.scientific_name,
    animal.category,
    `${animal.name} facts`,
    `${animal.name} lifespan`,
    `${animal.name} habitat`,
    'pawmed ai animal profile',
  ]
    .filter(Boolean)
    .join(', ')
  const articleSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${animal.name} — Profile & Facts`,
    description: seoDescription,
    mainEntityOfPage: `https://pawmedai.com/animals/${slug}`,
    image: animal.image
      ? [animal.image]
      : ['https://pawmedai.com/images/hero_image.jpg'],
    author: { '@type': 'Organization', name: 'Pawmed AI' },
    publisher: {
      '@type': 'Organization',
      name: 'Pawmed AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pawmedai.com/icons/paw.png',
      },
    },
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
    <section className="z-10 min-h-screen pb-16 mt-6">
      <Seo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalPath={`/animals/${slug}`}
        ogImage={animal.image}
        ogImageAlt={`${animal.name}${animal.scientific_name ? ` (${animal.scientific_name})` : ''} — Pawmed AI animal profile`}
        ogType="article"
        structuredData={[
          articleSchema,
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Classify Breed', path: '/classify-breed' },
            { name: animal.name, path: `/animals/${slug}` },
          ]),
        ]}
      />
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        {/* Back link */}
        <FadeIn trigger="mount">
          <Link
            to="/classify-breed"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to Classify Breed
          </Link>
        </FadeIn>

        {/* Hero */}
        <FadeIn trigger="mount" delay={0.05}>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {animal.image && (
              <img
                src={animal.image}
                alt={animal.name}
                className="h-52 w-full object-cover sm:h-64"
              />
            )}
            <div className="p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {animal.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                    <span>{CATEGORY_EMOJI[animal.category] ?? '🐾'}</span>
                    {animal.category}
                  </span>
                )}
                {animal.status && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[animal.status] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    {animal.status}
                  </span>
                )}
              </div>
              <h1 className="text-[22px] font-extrabold leading-tight text-slate-900">
                {animal.name}
              </h1>
              {animal.scientific_name && (
                <p className="mt-0.5 text-[12px] italic text-slate-400">
                  {animal.scientific_name}
                </p>
              )}
              {animal.description && (
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600">
                  {animal.description}
                </p>
              )}
            </div>
          </div>
        </FadeIn>

        <div className="mt-3 flex flex-col gap-3">
          {/* At a Glance */}
          {hasQuickStats && (
            <Card title="At a Glance" delay={0.08}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {Object.entries(animal.quick_stats).map(([label, value]) => (
                  <StatTile key={label} label={label} value={value} />
                ))}
              </div>
            </Card>
          )}

          {/* Physical Measurements */}
          {hasMeasurements && (
            <Card title="Physical Measurements" delay={0.1}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(animal.measurements)
                  .filter(([, v]) => v && v !== '(0 lbs – 0 lbs)')
                  .map(([label, value]) => (
                    <StatTile key={label} label={label} value={value} />
                  ))}
              </div>
            </Card>
          )}

          {/* Distinguishing Features */}
          {animal.features.length > 0 && (
            <Card title="Distinguishing Features" delay={0.12}>
              <BulletList
                items={animal.features}
                color="bg-blue-300"
                textColor="text-slate-700"
              />
            </Card>
          )}

          {/* Did You Know */}
          {animal.facts.length > 0 && (
            <Card title="Did You Know?" delay={0.14}>
              <div className="rounded-lg bg-amber-50 px-3.5 py-3">
                <BulletList
                  items={animal.facts}
                  color="bg-amber-400"
                  textColor="text-amber-900"
                />
              </div>
            </Card>
          )}

          {/* Conservation Status */}
          {hasConservation && (
            <Card title="Conservation Status" delay={0.16}>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {animal.status && (
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${STATUS_COLORS[animal.status] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}
                    >
                      {animal.status}
                    </span>
                  )}
                  {animal.conservation.trend && (
                    <span
                      className={`text-[12px] font-semibold ${trendKey ? TREND_COLOR[trendKey] : 'text-slate-600'}`}
                    >
                      {trendKey === 'Increasing'
                        ? '↑'
                        : trendKey === 'Decreasing'
                          ? '↓'
                          : '→'}{' '}
                      {animal.conservation.trend}
                    </span>
                  )}
                </div>
                {animal.conservation.description && (
                  <p className="text-[12.5px] text-slate-600">
                    {animal.conservation.description}
                  </p>
                )}
                {(animal.conservation.protected_under?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      Protected Under
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {animal.conservation.protected_under!.map((p, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Life Cycle */}
          {hasLifecycle && (
            <Card title="Life Cycle" delay={0.18}>
              <div className="flex flex-col gap-3">
                {Object.keys(animal.lifecycle.stages ?? {}).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(animal.lifecycle.stages!).map(
                      ([stage, val]) => (
                        <div
                          key={stage}
                          className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center"
                        >
                          <p className="text-[9.5px] font-bold uppercase tracking-wider text-blue-500">
                            {stage}
                          </p>
                          <p className="mt-0.5 text-[13px] font-bold text-blue-800">
                            {val}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {(animal.lifecycle.lifespans?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      Lifespan
                    </p>
                    <div className="flex flex-col gap-1">
                      {animal.lifecycle.lifespans!.map((ls, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5"
                        >
                          <span className="text-[12px] text-slate-500">
                            {ls.label}
                          </span>
                          <span className="text-[12.5px] font-bold text-slate-800">
                            {ls.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(animal.lifecycle.reproduction ?? {}).length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      Reproduction
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {Object.entries(animal.lifecycle.reproduction!)
                        .filter(([, v]) => v && !v.includes('_'))
                        .map(([label, value]) => (
                          <StatTile key={label} label={label} value={value} />
                        ))}
                    </div>
                  </div>
                )}

                {animal.lifecycle.reproduction_description && (
                  <BulletList
                    items={splitBullets(
                      animal.lifecycle.reproduction_description,
                    )}
                    color="bg-slate-300"
                    textColor="text-slate-600"
                  />
                )}
              </div>
            </Card>
          )}

          {/* Behavior & Ecology */}
          {hasBehavior && (
            <Card title="Behavior & Ecology" delay={0.2}>
              <div className="flex flex-col gap-3">
                {Object.entries(animal.behavior)
                  .filter(([, v]) => v)
                  .map(([label, text]) => (
                    <div key={label}>
                      <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                      </p>
                      <BulletList
                        items={splitBullets(text)}
                        color="bg-slate-300"
                        textColor="text-slate-700"
                      />
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Scientific Classification */}
          {classificationRows.length > 0 && (
            <Card title="Scientific Classification" delay={0.22}>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-0 sm:grid-cols-3">
                {classificationRows.map(([label, value]) => (
                  <div key={label} className="py-1.5">
                    <dt className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-[12.5px] italic text-slate-700">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}

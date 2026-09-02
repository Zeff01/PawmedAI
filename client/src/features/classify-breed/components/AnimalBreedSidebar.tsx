import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  SwatchIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'

interface Animal {
  name: string
  description: string
  url: string
  image: string
  status: string
  category: string
  scientific_name: string
  classification: Record<string, string>
}

const STATUS_COLORS: Record<string, string> = {
  'Least Concern': 'bg-green-100 text-green-700',
  'Near Threatened': 'bg-yellow-100 text-yellow-700',
  Vulnerable: 'bg-orange-100 text-orange-700',
  Endangered: 'bg-red-100 text-red-700',
  'Critically Endangered': 'bg-red-200 text-red-800',
  'Extinct in the Wild': 'bg-slate-200 text-slate-700',
  Extinct: 'bg-slate-300 text-slate-800',
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

const CATEGORY_ORDER = [
  'Mammals',
  'Birds',
  'Reptiles',
  'Fish',
  'Amphibians',
  'Insects',
  'Arachnids',
  'Crustaceans',
  'Mollusks',
  'Other',
]

const PAGE_SIZE = 10

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function AnimalRow({ animal }: { animal: Animal }) {
  return (
    <Link
      to="/animals/$slug"
      params={{ slug: toSlug(animal.name) }}
      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-blue-300 hover:bg-blue-50/60 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
    >
      {animal.image ? (
        <img
          src={animal.image}
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-100"
          loading="lazy"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
          {CATEGORY_EMOJI[animal.category] ?? '🐾'}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-slate-800 transition group-hover:text-blue-700">
          {animal.name}
        </p>
        <p className="truncate text-[11px] text-slate-400">
          {animal.description}
        </p>
        {animal.status && (
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              STATUS_COLORS[animal.status] ?? 'bg-slate-100 text-slate-500'
            }`}
          >
            {animal.status}
          </span>
        )}
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-blue-500" />
    </Link>
  )
}

export function AnimalBreedSidebar() {
  const [animals, setAnimals] = React.useState<Animal[]>([])
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState<string | null>(null)
  const [visible, setVisible] = React.useState(PAGE_SIZE)
  const [loading, setLoading] = React.useState(true)
  const [expanded, setExpanded] = React.useState(false)

  React.useEffect(() => {
    let active = true
    fetch('/animals.json')
      .then((response) => response.json())
      .then((data: Animal[]) => {
        if (!active) return
        setAnimals(data)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const counts = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const animal of animals) {
      map[animal.category] = (map[animal.category] ?? 0) + 1
    }
    return map
  }, [animals])

  const categories = React.useMemo(
    () => CATEGORY_ORDER.filter((name) => counts[name]),
    [counts],
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return animals.filter((animal) => {
      if (category && animal.category !== category) return false
      if (!q) return true
      return (
        animal.name.toLowerCase().includes(q) ||
        animal.description.toLowerCase().includes(q) ||
        animal.category.toLowerCase().includes(q)
      )
    })
  }, [animals, category, query])

  // Any change to the filters starts the list from the top again.
  React.useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [query, category])

  const hasFilters = Boolean(query.trim()) || category !== null

  return (
    <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Header — doubles as the disclosure toggle on small screens */}
      <div className="border-b border-slate-100 bg-slate-50/70">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls="breed-library-body"
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        >
          <span className="flex items-center gap-2.5">
            <span>
              <span className="flex gap-1 text-[13.5px] font-extrabold text-slate-900">
                <SwatchIcon className="h-4 w-4" />
                Breed library
              </span>
              <span className="block text-[11.5px] text-slate-500">
                {loading
                  ? 'Loading profiles…'
                  : `Browse ${animals.length} animal profiles`}
              </span>
            </span>
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform lg:hidden ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <div
        id="breed-library-body"
        className={expanded ? 'block' : 'hidden lg:block'}
      >
        <div className="space-y-3 px-4 pb-3 pt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search the breed library"
              placeholder="Search a breed or species"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[13px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear the search"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category filter — replaces ten separately collapsible groups */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-white to-transparent" />
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-3">
              <button
                type="button"
                onClick={() => setCategory(null)}
                aria-pressed={category === null}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition ${
                  category === null
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                All
              </button>
              {categories.map((name) => {
                const active = category === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(active ? null : name)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    <span aria-hidden="true">
                      {CATEGORY_EMOJI[name] ?? '🐾'}
                    </span>{' '}
                    {name}
                    <span
                      className={`ml-1 ${active ? 'text-blue-100' : 'text-slate-400'}`}
                    >
                      {counts[name]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p
              className="text-[11px] font-semibold text-slate-400"
              aria-live="polite"
            >
              {loading
                ? 'Loading…'
                : `${filtered.length} of ${animals.length} profiles`}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCategory(null)
                }}
                className="text-[11px] font-bold text-blue-600 underline-offset-2 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        <div className="max-h-104 overflow-y-auto px-4 pb-4 lg:max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-17 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-[12.5px] font-semibold text-slate-600">
                No match for “{query.trim()}”
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCategory(null)
                }}
                className="mt-1 text-[11.5px] font-bold text-blue-600 underline-offset-2 hover:underline"
              >
                Clear the filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {filtered.slice(0, visible).map((animal) => (
                  <AnimalRow key={animal.url} animal={animal} />
                ))}
              </div>
              {filtered.length > visible && (
                <button
                  type="button"
                  onClick={() => setVisible((prev) => prev + PAGE_SIZE)}
                  className="mt-2.5 w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 text-[12px] font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

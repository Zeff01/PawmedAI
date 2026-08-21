import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
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

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function AnimalBreedSidebar() {
  const [animals, setAnimals] = React.useState<Animal[]>([])
  const [query, setQuery] = React.useState('')
  const [openCategories, setOpenCategories] = React.useState<Set<string>>(
    new Set(CATEGORY_ORDER),
  )
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/animals.json')
      .then((r) => r.json())
      .then((data: Animal[]) => {
        setAnimals(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return animals
    return animals.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    )
  }, [animals, query])

  const grouped = React.useMemo(() => {
    const map: Partial<Record<string, Animal[]>> = {}
    for (const a of filtered) {
      const cat = a.category
      if (!map[cat]) map[cat] = []
      map[cat].push(a)
    }
    return map
  }, [filtered])

  const categories = CATEGORY_ORDER.filter((c) => grouped[c]?.length)

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-extrabold text-slate-900">
              Breed Library
            </h2>
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {animals.length || '...'} profiles available
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Squares2X2Icon className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <label className="relative block">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search breeds or species"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <div
        className="flex flex-col gap-4 overflow-y-auto px-4 pb-4"
        style={{ maxHeight: '68vh' }}
      >
        {loading ? (
          <p className="py-8 text-center text-[12px] text-slate-400">
            Loading…
          </p>
        ) : categories.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-slate-400">
            No animals found.
          </p>
        ) : (
          categories.map((cat) => {
            const isOpen = openCategories.has(cat)
            const items = grouped[cat] ?? []
            return (
              <div key={cat}>
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-2 text-[11.5px] font-bold uppercase tracking-wide text-slate-600">
                    <span>{CATEGORY_EMOJI[cat] ?? '🐾'}</span>
                    <span className="truncate">{cat}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-px text-[10px] font-semibold text-slate-500">
                      {items.length}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {/* Animal cards */}
                {isOpen && (
                  <div className="mt-1 flex flex-col gap-2">
                    {items.map((animal) => (
                      <Link
                        key={animal.url}
                        to="/animals/$slug"
                        params={{ slug: toSlug(animal.name) }}
                        className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-blue-200 hover:bg-blue-50/50"
                      >
                        {animal.image ? (
                          <img
                            src={animal.image}
                            alt={animal.name}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-100"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                            {CATEGORY_EMOJI[cat] ?? '🐾'}
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
                              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[animal.status] ?? 'bg-slate-100 text-slate-500'}`}
                            >
                              {animal.status}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}

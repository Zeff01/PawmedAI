import * as React from 'react'
import { Link } from '@tanstack/react-router'

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
  'Vulnerable': 'bg-orange-100 text-orange-700',
  'Endangered': 'bg-red-100 text-red-700',
  'Critically Endangered': 'bg-red-200 text-red-800',
  'Extinct in the Wild': 'bg-slate-200 text-slate-700',
  'Extinct': 'bg-slate-300 text-slate-800',
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
    const map: Record<string, Animal[]> = {}
    for (const a of filtered) {
      const cat = a.category || 'Other'
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
    <aside className="flex flex-col gap-3">
      <div>
        <h2 className="text-[13px] font-bold text-slate-800">Animal Breeds</h2>
        <p className="text-[11px] text-slate-400">
          {animals.length} animals · click to explore
        </p>
      </div>

      <input
        type="search"
        placeholder="Search animals…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 placeholder-slate-400 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />

      <div
        className="flex flex-col gap-1 overflow-y-auto pr-0.5"
        style={{ maxHeight: '72vh' }}
      >
        {loading ? (
          <p className="py-6 text-center text-[12px] text-slate-400">
            Loading…
          </p>
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-slate-400">
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
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-100"
                >
                  <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600 uppercase tracking-wide">
                    <span>{CATEGORY_EMOJI[cat] ?? '🐾'}</span>
                    {cat}
                    <span className="rounded-full bg-slate-200 px-1.5 py-px text-[9.5px] font-semibold text-slate-500">
                      {items.length}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Animal cards */}
                {isOpen && (
                  <div className="mt-1 flex flex-col gap-1.5 pl-1">
                    {items.map((animal) => (
                      <Link
                        key={animal.url}
                        to="/animals/$slug"
                        params={{ slug: toSlug(animal.name) }}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        {animal.image ? (
                          <img
                            src={animal.image}
                            alt={animal.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
                            {CATEGORY_EMOJI[cat] ?? '🐾'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-slate-800">
                            {animal.name}
                          </p>
                          <p className="truncate text-[10.5px] text-slate-400">
                            {animal.description}
                          </p>
                          {animal.status && (
                            <span
                              className={`mt-0.5 inline-block rounded-full px-1.5 py-px text-[9.5px] font-semibold ${STATUS_COLORS[animal.status] ?? 'bg-slate-100 text-slate-500'}`}
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

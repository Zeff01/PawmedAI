import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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

/** Text colour and dot colour for each IUCN status. */
const STATUS_STYLES: Record<string, { text: string; dot: string }> = {
  'Least Concern': { text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Near Threatened': { text: 'text-yellow-700', dot: 'bg-yellow-500' },
  Vulnerable: { text: 'text-orange-700', dot: 'bg-orange-500' },
  Endangered: { text: 'text-red-700', dot: 'bg-red-500' },
  'Critically Endangered': { text: 'text-red-800', dot: 'bg-red-700' },
  'Extinct in the Wild': { text: 'text-slate-600', dot: 'bg-slate-500' },
  Extinct: { text: 'text-slate-700', dot: 'bg-slate-700' },
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

/** Radix Select can't hold an empty value, so "no filter" gets a sentinel. */
const ALL_CATEGORIES = 'all'

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function StatusLabel({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    text: 'text-slate-500',
    dot: 'bg-slate-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10.5px] font-semibold',
        style.text,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {status}
    </span>
  )
}

function AnimalRow({ animal }: { animal: Animal }) {
  return (
    <li>
      <Link
        to="/animals/$slug"
        params={{ slug: toSlug(animal.name) }}
        className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
      >
        {animal.image ? (
          <img
            src={animal.image}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-900/5"
            loading="lazy"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
            {CATEGORY_EMOJI[animal.category] ?? '🐾'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-slate-800 transition group-hover:text-blue-700">
            {animal.name}
          </p>
          <p className="truncate text-[11.5px] text-slate-500">
            {animal.description}
          </p>
          {animal.status && (
            <div className="mt-0.5">
              <StatusLabel status={animal.status} />
            </div>
          )}
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
      </Link>
    </li>
  )
}

export function AnimalBreedSidebar({
  /** Drops the panel frame — the professional shell already provides one. */
  flush = false,
}: {
  flush?: boolean
} = {}) {
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

  const hasMore = filtered.length > visible
  const listRef = React.useRef<HTMLDivElement>(null)
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  // Load the next page as the end of the list scrolls into view.
  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible((prev) => prev + PAGE_SIZE)
      },
      { root: listRef.current, rootMargin: '0px 0px 160px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, visible, expanded])

  const hasFilters = Boolean(query.trim()) || category !== null
  const resetFilters = () => {
    setQuery('')
    setCategory(null)
  }

  const gutter = flush ? '' : 'px-4'

  return (
    <aside
      className={
        flush
          ? 'bg-white'
          : 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
      }
    >
      {/* Header — doubles as the disclosure toggle on small screens */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls="breed-library-body"
        className={cn(
          'flex w-full items-center justify-between gap-3 py-3.5 text-left lg:cursor-default',
          gutter,
        )}
      >
        <span className="flex items-center gap-3">
          <span>
            <span className="block text-[13.5px] font-extrabold text-slate-900">
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
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform lg:hidden',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <div
        id="breed-library-body"
        className={expanded ? 'block' : 'hidden lg:block'}
      >
        <div className={cn('space-y-3 pb-3', gutter)}>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              aria-label="Search the breed library"
              placeholder="Search a breed or species"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 rounded-lg border-slate-200 bg-slate-50/60 pr-9 pl-9 text-[13px] text-slate-700 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white focus-visible:ring-blue-100 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear the search"
                className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <p
                className="text-[11px] font-semibold tracking-wide whitespace-nowrap text-slate-400 uppercase"
                aria-live="polite"
              >
                {loading
                  ? 'Loading…'
                  : hasFilters
                    ? `${filtered.length} of ${animals.length}`
                    : `${animals.length} profiles`}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-bold whitespace-nowrap text-blue-600 underline-offset-2 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <Select
              value={category ?? ALL_CATEGORIES}
              onValueChange={(value) =>
                setCategory(value === ALL_CATEGORIES ? null : value)
              }
            >
              <SelectTrigger
                aria-label="Filter by category"
                className="h-8 w-40 rounded-lg border-slate-200 text-[12.5px] font-semibold text-slate-700"
              >
                {/* Name only — the item's count stays in the menu */}
                <SelectValue>{category ?? 'All categories'}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem
                  value={ALL_CATEGORIES}
                  className="text-[12.5px]"
                >
                  All categories
                  <span className="ml-1.5 text-slate-400 tabular-nums">
                    {animals.length}
                  </span>
                </SelectItem>
                {categories.map((name) => (
                  <SelectItem
                    key={name}
                    value={name}
                    className="text-[12.5px]"
                  >
                    {name}
                    <span className="ml-1.5 text-slate-400 tabular-nums">
                      {counts[name]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          ref={listRef}
          className={cn(
            'max-h-104 overflow-y-auto border-t border-slate-100 pt-1 pb-3 [scrollbar-color:var(--color-slate-200)_transparent] [scrollbar-width:thin] lg:max-h-[60vh]',
            flush ? '' : 'px-2',
          )}
        >
          {loading ? (
            <div className="flex flex-col gap-1 px-2 pt-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-11 w-11 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-2/5 bg-slate-100" />
                    <Skeleton className="h-2.5 w-3/4 bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mx-2 mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-[12.5px] font-semibold text-slate-600">
                {query.trim()
                  ? `No match for “${query.trim()}”`
                  : 'No profiles in this category'}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 text-[11.5px] font-bold text-blue-600 underline-offset-2 hover:underline"
              >
                Clear the filters
              </button>
            </div>
          ) : (
            <>
              <ul className="flex flex-col">
                {filtered.slice(0, visible).map((animal) => (
                  <AnimalRow key={animal.url} animal={animal} />
                ))}
              </ul>
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="flex items-center gap-3 px-2 py-2"
                  aria-hidden="true"
                >
                  <Skeleton className="h-11 w-11 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-2/5 bg-slate-100" />
                    <Skeleton className="h-2.5 w-3/4 bg-slate-100" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

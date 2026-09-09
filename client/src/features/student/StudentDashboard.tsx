import * as React from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'

import { FadeIn } from '@/components/motion/FadeIn'
import { STUDENT_CONTAINER } from '@/components/StudentShell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CaseCard } from './components/CaseCard'
import { StudentHero } from './components/StudentHero'
import { StudentMetrics } from './components/StudentMetrics'
import { DiagnosticToolkitCard } from './components/DiagnosticToolkitCard'
import { ContinueCasesCard } from './components/ContinueCasesCard'
import { SpeciesFilter } from './components/SpeciesFilter'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DIFFICULTY_LABEL,
  difficultyChoices,
  groupFilters,
  speciesChoices,
  speciesMeta,
} from './caseMeta'
import { useCases } from './hooks/useAcademy'
import type { CaseDifficulty, CaseSpecies } from './api/academy'
import type { SpeciesGroup } from './caseMeta'

/** Cases revealed at a time — the first render, and each "Show more". */
const PAGE_SIZE = 5

export function StudentDashboard() {
  const [group, setGroup] = React.useState<SpeciesGroup | 'all'>('all')
  const [species, setSpecies] = React.useState<CaseSpecies | 'all'>('all')
  const [difficulty, setDifficulty] = React.useState<CaseDifficulty | 'all'>(
    'all',
  )
  const [shown, setShown] = React.useState(PAGE_SIZE)
  const { data: cases, isLoading, isError, error } = useCases()

  const groups = React.useMemo(() => groupFilters(cases ?? []), [cases])
  const speciesInGroup = React.useMemo(
    () => speciesChoices(cases ?? [], group),
    [cases, group],
  )

  const speciesGroupsInList = React.useMemo(() => {
    const buckets = new Map<SpeciesGroup, typeof speciesInGroup>()
    for (const choice of speciesInGroup) {
      const groupId = speciesMeta(choice.id).group
      buckets.set(groupId, [...(buckets.get(groupId) ?? []), choice])
    }
    return [...buckets.entries()]
  }, [speciesInGroup])

  React.useEffect(() => {
    if (!groups.some((option) => option.id === group)) setGroup('all')
  }, [groups, group])
  React.useEffect(() => {
    if (
      species !== 'all' &&
      !speciesInGroup.some((option) => option.id === species)
    ) {
      setSpecies('all')
    }
  }, [speciesInGroup, species])

  // Species narrows first: difficulty is counted over what that leaves, so the
  // number beside a level is what picking it would return.
  const inSpecies = React.useMemo(() => {
    const all = cases ?? []
    if (species !== 'all') return all.filter((item) => item.species === species)
    if (group !== 'all')
      return all.filter((item) => speciesMeta(item.species).group === group)
    return all
  }, [cases, group, species])

  const difficulties = React.useMemo(
    () => difficultyChoices(inSpecies),
    [inSpecies],
  )

  React.useEffect(() => {
    if (
      difficulty !== 'all' &&
      !difficulties.some((option) => option.id === difficulty)
    ) {
      setDifficulty('all')
    }
  }, [difficulties, difficulty])

  const visible = React.useMemo(
    () =>
      difficulty === 'all'
        ? inSpecies
        : inSpecies.filter((item) => item.difficulty === difficulty),
    [inSpecies, difficulty],
  )

  React.useEffect(() => {
    setShown(PAGE_SIZE)
  }, [group, species, difficulty])

  const page = visible.slice(0, shown)
  const remaining = visible.length - page.length

  return (
    <section className="min-h-full bg-slate-50 pt-6 pb-16">
      <div className={cn(STUDENT_CONTAINER, 'space-y-8')}>
        <FadeIn>
          <StudentHero />
        </FadeIn>

        <StudentMetrics />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* ── Case library ───────────────────────────────────────────── */}
          <section className="space-y-5 lg:col-span-8">
            <div className="space-y-1">
              <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
                Case library
              </h2>
              <p className="max-w-xl text-[12.5px] leading-relaxed text-slate-500">
                Step through differential diagnosis, lab orders, and treatment
                staging. Every stage you clear earns points.
              </p>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select
                  value={difficulty}
                  onValueChange={(value) =>
                    setDifficulty(value as CaseDifficulty | 'all')
                  }
                >
                  <SelectTrigger
                    aria-label="Filter cases by difficulty"
                    className="h-9 w-full shrink-0 rounded-full border-slate-200 bg-white text-[12px] font-semibold text-slate-600 shadow-none sm:w-40"
                  >
                    <SelectValue>
                      {difficulty === 'all'
                        ? 'Any difficulty'
                        : DIFFICULTY_LABEL[difficulty]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Any difficulty ({inSpecies.length})
                    </SelectItem>
                    {difficulties.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label} ({option.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <SpeciesFilter
                  value={species}
                  onChange={setSpecies}
                  groups={speciesGroupsInList}
                  total={speciesInGroup.length}
                />
              </div>

              {!isLoading && !isError && visible.length > 0 ? (
                <p
                  aria-live="polite"
                  className="text-[11.5px] text-slate-400 tabular-nums"
                >
                  Showing {page.length} of {visible.length} case
                  {visible.length === 1 ? '' : 's'}
                </p>
              ) : null}
            </div>

            {/* <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-center sm:self-auto">
                <div
                  role="tablist"
                  aria-label="Filter cases by species group"
                  className="inline-flex items-center gap-1 overflow-x-auto rounded-full bg-slate-100 p-1"
                >
                  {groups.map((option) => {
                    const active = group === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        title={option.title}
                        onClick={() => {
                          setGroup(option.id)
                          setSpecies('all')
                        }}
                        className={cn(
                          'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors',
                          active
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900',
                        )}
                      >
                        {option.label}
                        <span className="ml-1.5 text-[10.5px] font-bold text-slate-400">
                          {option.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div> */}

            {isLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                <Loader2 className="size-5 animate-spin text-blue-600" />
              </div>
            ) : isError ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center"
              >
                <p className="text-[13.5px] font-semibold text-rose-800">
                  The case library could not be loaded
                </p>
                <p className="mt-1 text-[12px] text-rose-700">
                  {error.message}
                </p>
              </div>
            ) : visible.length > 0 ? (
              <div className="space-y-4">
                {page.map((summary) => (
                  <CaseCard key={summary.slug} summary={summary} />
                ))}

                {remaining > 0 ? (
                  <div className="flex justify-center pt-1">
                    <Button
                      variant="outline"
                      onClick={() => setShown((count) => count + PAGE_SIZE)}
                      className="h-10 rounded-full border-slate-200 px-6 text-[13px] font-bold text-slate-700"
                    >
                      Show {Math.min(PAGE_SIZE, remaining)} more
                      <ChevronDown className="size-4 text-slate-400" />
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                <p className="text-[13.5px] font-semibold text-slate-800">
                  No cases match these filters
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">
                  More are added each block. Try another species or difficulty,
                  or pick up one already in progress.
                </p>
              </div>
            )}
          </section>

          {/* ── Toolkit & schedule ─────────────────────────────────────── */}
          <aside className="space-y-4 lg:col-span-4">
            <ContinueCasesCard />
            <DiagnosticToolkitCard />
          </aside>
        </div>
      </div>
    </section>
  )
}

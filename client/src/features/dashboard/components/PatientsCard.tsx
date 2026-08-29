import { UserGroupIcon } from '@heroicons/react/24/solid'

import { formatAge } from '@/features/cbc-analyzer/utils/format'
import type { Pet } from '@/features/cbc-analyzer/types'

const MAX_ROWS = 5

export function PatientsCard({
  pets,
  isLoading,
}: {
  pets: Array<Pet>
  isLoading: boolean
}) {
  // The API returns pets in its own order, so rank by workload here.
  const busiest = [...pets]
    .sort((a, b) => b.log_count - a.log_count)
    .slice(0, MAX_ROWS)

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-baseline justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-[14px] font-bold tracking-tight text-slate-900">
          Patients
        </h2>
        {!isLoading && pets.length > 0 ? (
          <span className="text-[11.5px] font-semibold text-slate-400 tabular-nums">
            {pets.length} on file
          </span>
        ) : null}
      </header>

      {isLoading ? (
        <ul className="divide-y divide-slate-100" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 px-5 py-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-36 animate-pulse rounded bg-slate-100" />
              </div>
            </li>
          ))}
        </ul>
      ) : busiest.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <UserGroupIcon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[12.5px] font-bold text-slate-800">
            No patients yet
          </p>
          <p className="mx-auto mt-1 max-w-xs text-[11.5px] leading-relaxed text-slate-500">
            Patients are created when you save an analysis against a new pet.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {busiest.map((pet) => (
            <li key={pet.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-extrabold text-blue-600 uppercase">
                {(pet.name || '?').charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-slate-800">
                  {pet.name}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {pet.species_display}
                  {pet.breed ? ` · ${pet.breed}` : ''} ·{' '}
                  {formatAge(pet.age_years)}
                </p>
              </div>
              <span className="shrink-0 text-[11.5px] font-semibold text-slate-400 tabular-nums">
                {pet.log_count} record{pet.log_count === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { SPECIES_GROUP_LABEL, speciesMeta } from '../caseMeta'
import type { SpeciesChoice, SpeciesGroup } from '../caseMeta'
import type { CaseSpecies } from '../api/academy'

export function SpeciesFilter({
  value,
  onChange,
  groups,
  total,
}: {
  value: CaseSpecies | 'all'
  onChange: (value: CaseSpecies | 'all') => void
  groups: Array<[SpeciesGroup, Array<SpeciesChoice>]>
  total: number
}) {
  const [open, setOpen] = React.useState(false)

  const pick = (next: CaseSpecies | 'all') => {
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Filter cases by species"
          className="h-9 w-full justify-between rounded-full border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-600 shadow-none hover:bg-white hover:text-slate-900 sm:w-44"
        >
          {value === 'all' ? 'Any species' : speciesMeta(value).adjective}
          <ChevronDown className="size-4 text-slate-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search species…" />
          <CommandList className="max-h-72">
            <CommandEmpty className="px-4 py-6 text-center text-[12px] text-slate-500">
              No species matches that.
            </CommandEmpty>

            <CommandGroup>
              <CommandItem
                value="any species"
                keywords={['all', 'clear']}
                onSelect={() => pick('all')}
              >
                <span className="flex-1 truncate text-[12.5px]">
                  Any species
                  <span className="ml-1.5 text-slate-400">({total})</span>
                </span>
                <Check
                  className={cn(
                    'size-4 text-blue-600',
                    value === 'all' ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </CommandItem>
            </CommandGroup>

            {groups.map(([groupId, choices]) => (
              <CommandGroup
                key={groupId}
                heading={SPECIES_GROUP_LABEL[groupId]}
              >
                {choices.map((choice) => {
                  const meta = speciesMeta(choice.id)
                  return (
                    <CommandItem
                      key={choice.id}
                      value={choice.label}
                      keywords={[meta.plain, SPECIES_GROUP_LABEL[groupId]]}
                      onSelect={() => pick(choice.id)}
                    >
                      <span className="flex-1 truncate text-[12.5px]">
                        {choice.label}
                        <span className="ml-1.5 text-slate-400">
                          ({choice.count})
                        </span>
                      </span>
                      <Check
                        className={cn(
                          'size-4 text-blue-600',
                          value === choice.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

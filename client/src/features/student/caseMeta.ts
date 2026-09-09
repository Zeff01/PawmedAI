import type { CaseDifficulty, CaseSpecies } from './api/academy'

export type SpeciesGroup =
  | 'companion'
  | 'farm'
  | 'avian'
  | 'herptile'
  | 'aquatic'
  | 'other'

export type SpeciesMeta = {
  adjective: string
  plain: string
  group: SpeciesGroup
  photo: string
  photoAlt: string
}

export const SPECIES_META: Record<CaseSpecies, SpeciesMeta> = {
  // Companion animals
  canine: {
    adjective: 'Canine',
    plain: 'Dog',
    group: 'companion',
    photo: '/images/species/canine.jpg',
    photoAlt: 'Stock photograph of a dog, standing in for the case patient',
  },
  feline: {
    adjective: 'Feline',
    plain: 'Cat',
    group: 'companion',
    photo: '/images/species/feline.jpg',
    photoAlt: 'Stock photograph of a cat, standing in for the case patient',
  },
  lapine: {
    adjective: 'Lapine',
    plain: 'Rabbit',
    group: 'companion',
    photo: '/images/species/lapine.jpg',
    photoAlt: 'Stock photograph of a rabbit, standing in for the case patient',
  },
  musteline: {
    adjective: 'Musteline',
    plain: 'Ferret',
    group: 'companion',
    photo: '/images/species/musteline.jpg',
    photoAlt: 'Stock photograph of a ferret, standing in for the case patient',
  },
  caviine: {
    adjective: 'Caviine',
    plain: 'Guinea pig',
    group: 'companion',
    photo: '/images/species/caviine.jpg',
    photoAlt:
      'Stock photograph of a guinea pig, standing in for the case patient',
  },
  murine: {
    adjective: 'Murine',
    plain: 'Rat & mouse',
    group: 'companion',
    photo: '/images/species/murine.jpg',
    photoAlt: 'Stock photograph of a pet rat, standing in for the case patient',
  },
  rodent: {
    adjective: 'Rodent',
    plain: 'Other rodents',
    group: 'companion',
    photo: '/images/species/rodent.jpg',
    photoAlt: 'Stock photograph of a hamster, standing in for the case patient',
  },

  // Equine, farm and production
  equine: {
    adjective: 'Equine',
    plain: 'Horse',
    group: 'farm',
    photo: '/images/species/equine.jpg',
    photoAlt:
      'Stock photograph of horses in a field, standing in for the case patient',
  },
  asinine: {
    adjective: 'Asinine',
    plain: 'Donkey',
    group: 'farm',
    photo: '/images/species/asinine.jpg',
    photoAlt: 'Stock photograph of a donkey, standing in for the case patient',
  },
  bovine: {
    adjective: 'Bovine',
    plain: 'Cattle',
    group: 'farm',
    photo: '/images/species/bovine.jpg',
    photoAlt:
      'Stock photograph of a cow in a pasture, standing in for the case patient',
  },
  ovine: {
    adjective: 'Ovine',
    plain: 'Sheep',
    group: 'farm',
    photo: '/images/species/ovine.jpg',
    photoAlt:
      'Stock photograph of a flock of sheep, standing in for the case patient',
  },
  caprine: {
    adjective: 'Caprine',
    plain: 'Goat',
    group: 'farm',
    photo: '/images/species/caprine.jpg',
    photoAlt: 'Stock photograph of a goat, standing in for the case patient',
  },
  porcine: {
    adjective: 'Porcine',
    plain: 'Pig',
    group: 'farm',
    photo: '/images/species/porcine.jpg',
    photoAlt: 'Stock photograph of pigs, standing in for the case patient',
  },
  camelid: {
    adjective: 'Camelid',
    plain: 'Llama & alpaca',
    group: 'farm',
    photo: '/images/species/camelid.jpg',
    photoAlt: 'Stock photograph of an alpaca, standing in for the case patient',
  },
  cervine: {
    adjective: 'Cervine',
    plain: 'Deer',
    group: 'farm',
    photo: '/images/species/cervine.jpg',
    photoAlt:
      'Stock photograph of a red deer stag, standing in for the case patient',
  },

  // Birds
  avian: {
    adjective: 'Avian',
    plain: 'Bird',
    group: 'avian',
    photo: '/images/species/avian.jpg',
    photoAlt:
      'Stock photograph of a bird in flight, standing in for the case patient',
  },
  psittacine: {
    adjective: 'Psittacine',
    plain: 'Parrot',
    group: 'avian',
    photo: '/images/species/psittacine.jpg',
    photoAlt: 'Stock photograph of a parrot, standing in for the case patient',
  },
  passerine: {
    adjective: 'Passerine',
    plain: 'Songbird',
    group: 'avian',
    photo: '/images/species/passerine.jpg',
    photoAlt: 'Stock photograph of a canary, standing in for the case patient',
  },
  galliform: {
    adjective: 'Galliform',
    plain: 'Poultry',
    group: 'avian',
    photo: '/images/species/galliform.jpg',
    photoAlt: 'Stock photograph of chickens, standing in for the case patient',
  },
  anseriform: {
    adjective: 'Anseriform',
    plain: 'Duck & goose',
    group: 'avian',
    photo: '/images/species/anseriform.jpg',
    photoAlt:
      'Stock photograph of a pair of ducks, standing in for the case patient',
  },
  columbine: {
    adjective: 'Columbine',
    plain: 'Pigeon & dove',
    group: 'avian',
    photo: '/images/species/columbine.jpg',
    photoAlt: 'Stock photograph of a pigeon, standing in for the case patient',
  },
  raptor: {
    adjective: 'Raptor',
    plain: 'Bird of prey',
    group: 'avian',
    photo: '/images/species/raptor.jpg',
    photoAlt: 'Stock photograph of a hawk, standing in for the case patient',
  },

  // Reptiles and amphibians
  reptilian: {
    adjective: 'Reptilian',
    plain: 'Reptile',
    group: 'herptile',
    photo: '/images/species/reptilian.jpg',
    photoAlt: 'Stock photograph of a reptile, standing in for the case patient',
  },
  chelonian: {
    adjective: 'Chelonian',
    plain: 'Tortoise & turtle',
    group: 'herptile',
    photo: '/images/species/chelonian.jpg',
    photoAlt:
      'Stock photograph of a tortoise, standing in for the case patient',
  },
  ophidian: {
    adjective: 'Ophidian',
    plain: 'Snake',
    group: 'herptile',
    photo: '/images/species/ophidian.jpg',
    photoAlt: 'Stock photograph of a snake, standing in for the case patient',
  },
  saurian: {
    adjective: 'Saurian',
    plain: 'Lizard',
    group: 'herptile',
    photo: '/images/species/saurian.jpg',
    photoAlt: 'Stock photograph of a gecko, standing in for the case patient',
  },
  crocodilian: {
    adjective: 'Crocodilian',
    plain: 'Crocodile & alligator',
    group: 'herptile',
    photo: '/images/species/crocodilian.jpg',
    photoAlt:
      'Stock photograph of a crocodile, standing in for the case patient',
  },
  amphibian: {
    adjective: 'Amphibian',
    plain: 'Amphibian',
    group: 'herptile',
    photo: '/images/species/amphibian.jpg',
    photoAlt:
      'Stock photograph of a tree frog, standing in for the case patient',
  },

  // Aquatic
  piscine: {
    adjective: 'Piscine',
    plain: 'Fish',
    group: 'aquatic',
    photo: '/images/species/piscine.jpg',
    photoAlt:
      'Stock photograph of a goldfish, standing in for the case patient',
  },
  cetacean: {
    adjective: 'Cetacean',
    plain: 'Whale & dolphin',
    group: 'aquatic',
    photo: '/images/species/cetacean.jpg',
    photoAlt: 'Stock photograph of a dolphin, standing in for the case patient',
  },
  pinniped: {
    adjective: 'Pinniped',
    plain: 'Seal & sea lion',
    group: 'aquatic',
    photo: '/images/species/pinniped.jpg',
    photoAlt:
      'Stock photograph of a sea lion, standing in for the case patient',
  },

  // Everything else
  primate: {
    adjective: 'Primate',
    plain: 'Primate',
    group: 'other',
    photo: '/images/species/primate.jpg',
    photoAlt: 'Stock photograph of a lemur, standing in for the case patient',
  },
  marsupial: {
    adjective: 'Marsupial',
    plain: 'Marsupial',
    group: 'other',
    photo: '/images/species/marsupial.jpg',
    photoAlt:
      'Stock photograph of a kangaroo, standing in for the case patient',
  },
  apian: {
    adjective: 'Apian',
    plain: 'Honeybee',
    group: 'other',
    photo: '/images/species/apian.jpg',
    photoAlt:
      'Stock photograph of a honeybee on a flower, standing in for the case patient',
  },
  wildlife: {
    adjective: 'Wildlife',
    plain: 'Wildlife',
    group: 'other',
    photo: '/images/species/wildlife.jpg',
    photoAlt: 'Stock photograph of a red fox, standing in for the case patient',
  },
  exotic: {
    adjective: 'Exotic',
    plain: 'Exotic',
    group: 'other',
    photo: '/images/species/exotic.jpg',
    photoAlt:
      'Stock photograph of a hedgehog, standing in for the case patient',
  },
}

export const SPECIES_ORDER = Object.keys(SPECIES_META) as Array<CaseSpecies>

/**
 * A species that is not in the table yet.
 *
 * The server's vocabulary can move ahead of the client's — a case seeded with
 * a species this build has never heard of should still render a card, with the
 * raw term on the badge, rather than crash on an undefined lookup.
 */
export function speciesMeta(species: CaseSpecies | string): SpeciesMeta {
  // Indexed loosely on purpose: the parameter is widened to `string` because
  // the value came off the wire, and a `Record` lookup would type as defined.
  const table: Partial<Record<string, SpeciesMeta>> = SPECIES_META
  return (
    table[species] ?? {
      adjective: species.charAt(0).toUpperCase() + species.slice(1),
      plain: species,
      group: 'other',
      photo: '/images/species/exotic.jpg',
      photoAlt:
        'Stock photograph of an animal, standing in for the case patient',
    }
  )
}

export const DIFFICULTY_TONE: Record<CaseDifficulty, string> = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-blue-50 text-blue-700',
  advanced: 'bg-slate-100 text-slate-600',
}

export const SPECIES_GROUP_LABEL: Record<SpeciesGroup, string> = {
  companion: 'Companion',
  farm: 'Farm & equine',
  avian: 'Birds',
  herptile: 'Reptiles',
  aquatic: 'Aquatic',
  other: 'Other',
}

export type GroupFilter = {
  id: SpeciesGroup | 'all'
  label: string
  title: string
  count: number
}

/**
 * The filter tabs: one per species group, not one per species.
 *
 * Thirty-six species would be a scrolling ribbon of tabs, so the coarse filter
 * is the group a curriculum would teach together and the species itself is
 * chosen from the dropdown beside it. Only groups the library actually contains
 * appear, so a tab never returns nothing.
 */
export function groupFilters(
  cases: Array<{ species: CaseSpecies }>,
): Array<GroupFilter> {
  const counts = new Map<SpeciesGroup, number>()
  for (const item of cases) {
    const group = speciesMeta(item.species).group
    counts.set(group, (counts.get(group) ?? 0) + 1)
  }

  const groups = Object.keys(SPECIES_GROUP_LABEL) as Array<SpeciesGroup>
  return [
    {
      id: 'all',
      label: 'All cases',
      title: 'Every case in the library',
      count: cases.length,
    },
    ...groups
      .filter((group) => counts.has(group))
      .map((group) => ({
        id: group,
        label: SPECIES_GROUP_LABEL[group],
        title: `${SPECIES_GROUP_LABEL[group]} cases`,
        count: counts.get(group) ?? 0,
      })),
  ]
}

export type SpeciesChoice = { id: CaseSpecies; label: string; count: number }

export function speciesChoices(
  cases: Array<{ species: CaseSpecies }>,
  group: SpeciesGroup | 'all',
): Array<SpeciesChoice> {
  const counts = new Map<CaseSpecies, number>()
  for (const item of cases) {
    if (group !== 'all' && speciesMeta(item.species).group !== group) continue
    counts.set(item.species, (counts.get(item.species) ?? 0) + 1)
  }

  return SPECIES_ORDER.filter((species) => counts.has(species)).map(
    (species) => {
      const meta = speciesMeta(species)
      return {
        id: species,
        label: `${meta.adjective}`,
        count: counts.get(species) ?? 0,
      }
    },
  )
}

/** "2h ago" / "yesterday" — the case card only ever needs this much. */
export function relativeTime(iso: string | null): string | null {
  if (!iso) return null
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null

  const minutes = Math.round((Date.now() - then.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

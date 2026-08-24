import { cbcClient, toQuery } from './cbcClient'
import type { Pet, PetDraft } from '../types'

export async function fetchPets(search = ''): Promise<Array<Pet>> {
  return cbcClient.get<Array<Pet>>(`/pets/${toQuery({ search })}`)
}

export async function createPet(draft: PetDraft): Promise<Pet> {
  return cbcClient.post<Pet>('/pets/', {
    name: draft.name,
    species: draft.species,
    species_label: draft.speciesLabel ?? '',
    breed: draft.breed ?? '',
    age_years: draft.ageYears ?? null,
    sex: draft.sex ?? 'unknown',
    neuter_status: draft.neuterStatus ?? 'unknown',
    owner_name: draft.ownerName ?? '',
  })
}

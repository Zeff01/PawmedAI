import { useQuery } from '@tanstack/react-query'
import {
  fetchBreedReferencePhoto,
  type BreedReferencePhoto,
} from '../api/breedReferencePhoto'

export function useBreedReferencePhoto(
  breedName: string,
  animalType?: string,
  enabled = true,
) {
  return useQuery<BreedReferencePhoto | null>({
    queryKey: ['breed-reference-photo', breedName, animalType],
    queryFn: () => fetchBreedReferencePhoto(breedName, animalType),
    enabled: enabled && Boolean(breedName?.trim()),
    // A breed's reference photo does not change between results.
    staleTime: Infinity,
    retry: false,
  })
}

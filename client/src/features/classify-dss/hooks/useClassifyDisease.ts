import { useMutation } from "@tanstack/react-query"

import { classifyDiseaseImage } from "../api/classifyDisease"
import type { DiseaseClassificationResult } from "../types"

export function useClassifyDisease() {
  return useMutation<DiseaseClassificationResult, Error, File>({
    mutationFn: classifyDiseaseImage,
  })
}

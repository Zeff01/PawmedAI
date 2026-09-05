import type { CompanionPrompt } from './types'

export const COMPANION_PROMPTS: Array<CompanionPrompt> = [
  {
    label: 'Analyse a photo (skin, teeth, eye)',
    icon: 'camera',
    to: '/classify',
  },
  { label: 'Check a symptom', icon: 'symptom', to: '/classify' },
  { label: 'Identify a breed', icon: 'breed', to: '/classify-breed' },
  { label: 'Find a vet nearby', icon: 'vet', to: '/nearby-vets' },
]

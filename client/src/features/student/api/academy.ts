import { supabase } from '@/lib/supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

function baseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
}

export type AcademyError = Error & { status?: number; code?: string }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) {
    const error = new Error('Sign in to open the case academy.') as AcademyError
    error.code = 'UNAUTHENTICATED'
    throw error
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${baseUrl()}/api/academy${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      typeof payload?.detail === 'string'
        ? payload.detail
        : response.status === 404
          ? 'That case could not be found.'
          : 'Something went wrong. Please try again.'
    const error = new Error(message) as AcademyError
    error.status = response.status
    if (typeof payload?.code === 'string') error.code = payload.code
    throw error
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// ── Shapes, mirroring academy/serializers.py ─────────────────────────────────

/**
 * Mirrors `Case.Species` in academy/models.py — the clinical adjective for
 * the patient. Grouped and pictured in caseMeta.ts.
 */
export type CaseSpecies =
  | 'canine'
  | 'feline'
  | 'lapine'
  | 'musteline'
  | 'caviine'
  | 'murine'
  | 'rodent'
  | 'equine'
  | 'asinine'
  | 'bovine'
  | 'ovine'
  | 'caprine'
  | 'porcine'
  | 'camelid'
  | 'cervine'
  | 'avian'
  | 'psittacine'
  | 'passerine'
  | 'galliform'
  | 'anseriform'
  | 'columbine'
  | 'raptor'
  | 'reptilian'
  | 'chelonian'
  | 'ophidian'
  | 'saurian'
  | 'crocodilian'
  | 'amphibian'
  | 'piscine'
  | 'cetacean'
  | 'pinniped'
  | 'primate'
  | 'marsupial'
  | 'apian'
  | 'wildlife'
  | 'exotic'
export type CaseDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type StageKind = 'history' | 'diagnostics' | 'differential' | 'diagnosis'

export type CaseProgress = {
  started: boolean
  completed: boolean
  cleared_stages: number
  total_stages: number
  percent: number
  points_earned: number
  current_stage_title: string | null
  last_active: string | null
}

export type CaseSummary = {
  slug: string
  title: string
  species: CaseSpecies
  discipline: string
  difficulty: CaseDifficulty
  body_system: string
  presentation: string
  completion_bonus: number
  stage_count: number
  total_points: number
  progress: CaseProgress
}

export type StageOption = {
  id: number
  label: string
  detail: string
}

/** What this student has done with one stage. */
export type StageStudentState = {
  answered: boolean
  is_correct: boolean
  revealed: boolean
  cleared: boolean
  tries: number
  points_earned: number
  selected_option_ids: Array<number>
  /** Both stay null until the stage is cleared — the server withholds them. */
  correct_option_ids: Array<number> | null
  explanation: string | null
}

export type CaseStage = {
  id: number
  order: number
  kind: StageKind
  title: string
  briefing: string
  prompt: string
  select_mode: 'single' | 'multi'
  points: number
  options: Array<StageOption>
  student: StageStudentState
  locked: boolean
}

export type CaseDetail = CaseSummary & { stages: Array<CaseStage> }

export type AnswerResult = {
  is_correct: boolean
  revealed: boolean
  cleared: boolean
  tries: number
  tries_left: number
  /** Banked by this answer — zero when an earlier try was worth more. */
  points_earned: number
  /** The answer was part right: some findings, not all of them. */
  partial_credit: boolean
  /** Everything this stage has earned so far, best attempt wins. */
  stage_points_earned: number
  completion_bonus: number
  case_points: number
  correct_option_ids: Array<number> | null
  explanation: string | null
  progress: {
    cleared_stages: number
    total_stages: number
    percent: number
    completed: boolean
    next_stage_id: number | null
  }
}

export type StudentProgress = {
  points: number
  cases_completed: number
  cases_in_progress: number
  cases_available: number
  completed_this_week: number
  stages_answered: number
  /** Null until the student has answered anything — unknown, not zero. */
  accuracy: number | null
  streak_days: number
}

// ── Calls ────────────────────────────────────────────────────────────────────

export function fetchCases() {
  return request<Array<CaseSummary>>('/cases/')
}

export function fetchCase(slug: string) {
  return request<CaseDetail>(`/cases/${slug}/`)
}

export function fetchProgress() {
  return request<StudentProgress>('/progress/')
}

export function answerStage(input: {
  slug: string
  stageId: number
  selectedOptionIds: Array<number>
}) {
  return request<AnswerResult>(
    `/cases/${input.slug}/stages/${input.stageId}/answer/`,
    {
      method: 'POST',
      body: JSON.stringify({ selected_option_ids: input.selectedOptionIds }),
    },
  )
}

export function resetCase(slug: string) {
  return request<void>(`/cases/${slug}/reset/`, { method: 'POST' })
}

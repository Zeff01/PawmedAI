import type { CareTone } from '../types'

export type ToneKey = CareTone | 'brand'

export const PILL_TONES: Record<ToneKey, string> = {
  primary: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  tertiary: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  secondary: 'bg-rose-50 text-rose-700 ring-rose-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200/70',
  brand: 'bg-fp-brand-50 text-fp-brand-700 ring-fp-brand-200/80',
}

export const DOT_TONES: Record<ToneKey, string> = {
  primary: 'bg-emerald-500',
  tertiary: 'bg-amber-500',
  secondary: 'bg-rose-500',
  neutral: 'bg-slate-300',
  brand: 'bg-fp-brand-600',
}

export const ICON_TONES: Record<ToneKey, string> = {
  primary: 'bg-emerald-50 text-emerald-700',
  tertiary: 'bg-amber-50 text-amber-700',
  secondary: 'bg-rose-50 text-rose-700',
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-teal-50 text-teal-700',
}

export const TEXT_TONES: Record<ToneKey, string> = {
  primary: 'text-emerald-600',
  tertiary: 'text-amber-600',
  secondary: 'text-rose-600',
  neutral: 'text-slate-500',
  brand: 'text-fp-brand-700',
}

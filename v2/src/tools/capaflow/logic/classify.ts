import { label } from './labels'
import type { Lang } from './types'

export interface Classification {
  label: string
  cls: 'green' | 'yellow' | 'red'
}

/** Status thresholds: World Class (>=1.67), Capaz (>=1.33), Marginal (>=1.00), No Capaz. */
export function classifyCpk(v: number, lang: Lang): Classification {
  if (v >= 1.67) return { label: label(lang, 'classify.worldClass'), cls: 'green' }
  if (v >= 1.33) return { label: label(lang, 'classify.capable'), cls: 'green' }
  if (v >= 1.0) return { label: label(lang, 'classify.marginal'), cls: 'yellow' }
  return { label: label(lang, 'classify.notCapable'), cls: 'red' }
}

export function colorForCpk(v: number): string {
  if (v >= 1.33) return 'var(--accent-green)'
  if (v >= 1.0) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

/** Sigma-bar hover text: fixed Spanish labels at sigma 5 / 4 / 3 (original behavior). */
export function sigmaTooltipClass(sigmaValue: number): string {
  if (sigmaValue >= 5) return 'World Class'
  if (sigmaValue >= 4) return 'Capaz'
  if (sigmaValue >= 3) return 'Marginal'
  return 'No Capaz'
}

/** Symbolic color used by the comparative summary table. */
export function summaryCpkColor(v: number | null): 'accent' | 'green' | 'yellow' | 'red' {
  return v === null ? 'accent' : v >= 1.33 ? 'green' : v >= 1.0 ? 'yellow' : 'red'
}

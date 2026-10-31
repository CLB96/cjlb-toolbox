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

/** Sigma-bar hover text: the Cpk classification (sigma / 3) in the current language (A15). */
export function sigmaTooltipClass(sigmaValue: number, lang: Lang): string {
  return classifyCpk(sigmaValue / 3, lang).label
}

/** Symbolic color used by the comparative summary table. */
export function summaryCpkColor(v: number | null): 'accent' | 'green' | 'yellow' | 'red' {
  return v === null ? 'accent' : v >= 1.33 ? 'green' : v >= 1.0 ? 'yellow' : 'red'
}

import type { Column, TimeRange } from './types'

export interface EffectiveRange {
  start: number
  end: number
  rows: number
}

export function effectiveRange(totalRows: number, tr: TimeRange): EffectiveRange {
  const start = tr.active ? tr.start : 0
  const end = tr.active && tr.end !== null ? tr.end : totalRows
  return { start, end, rows: end - start }
}

export function trimColumns(columns: Column[], start: number, end: number): Column[] {
  return columns.map((col) => col.slice(start, end))
}

export type TimeRangeError = 'startNegative' | 'endNotAfterStart' | 'endExceeds'

export type TimeRangeResult = { ok: true; range: TimeRange } | { ok: false; error: TimeRangeError }

/** ¿El texto trae decimales que `parseInt` descartará? (aviso de la mejora A17; el valor no cambia) */
export function hasDecimals(input: string): boolean {
  const n = parseFloat(input)
  return Number.isFinite(n) && !Number.isInteger(n)
}

/** Validación de "Aplicar rango" con el mismo parseo y orden de comprobaciones del original. */
export function validateTimeRange(startInput: string, endInput: string, totalRows: number): TimeRangeResult {
  const start = parseInt(startInput) || 0
  const end = endInput ? parseInt(endInput) : null

  if (start < 0) return { ok: false, error: 'startNegative' }
  if (end !== null && end <= start) return { ok: false, error: 'endNotAfterStart' }
  if (end !== null && end > totalRows) return { ok: false, error: 'endExceeds' }

  return { ok: true, range: { active: true, start, end } }
}

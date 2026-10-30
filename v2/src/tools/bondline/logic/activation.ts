import type { EffectiveRange } from './range'
import { ACTIVATION_DURATION, type AdhesiveType, type BondlineDefaults, type Column } from './types'

export interface AdhesiveCfg {
  min: number
  max: number
  label: 'Water Base' | 'Hotmelt'
}

export function adhesiveConfig(defaults: BondlineDefaults, type: AdhesiveType): AdhesiveCfg {
  return type === 'hotmelt'
    ? { ...defaults.hotmelt, label: 'Hotmelt' }
    : { ...defaults.waterbase, label: 'Water Base' }
}

/** Primera fila en la que todos los termopares tienen dato y alcanzan `min`. */
export function findActivationStart(columns: Column[], totalRows: number, min: number): number | null {
  for (let r = 0; r < totalRows; r++) {
    if (columns.every((col) => col[r] !== null && (col[r] as number) >= min)) return r
  }
  return null
}

/** true si la ventana de 30 s cabe en el rango visible y todas las lecturas están en [min, max]. */
export function isWindowInRange(
  columns: Column[],
  totalRows: number,
  activationStart: number,
  range: Pick<EffectiveRange, 'start' | 'end'>,
  cfg: Pick<AdhesiveCfg, 'min' | 'max'>,
): boolean {
  const activationEnd = activationStart + ACTIVATION_DURATION
  if (!(activationStart >= range.start && activationEnd <= range.end)) return false
  const end = Math.min(activationEnd, totalRows)
  for (let r = activationStart; r < end; r++) {
    for (const col of columns) {
      const v = col[r]
      if (v === null || v < cfg.min || v > cfg.max) return false
    }
  }
  return true
}

/** Máximo del eje Y del original; ahora es el mínimo del tope (mejora A11). */
export const Y_MAX_BASE = 80

/**
 * Límites del eje Y: mínimo = 95 % de la media de los primeros valores visibles; máximo 80 como el
 * original, salvo que los datos visibles o el máximo del adhesivo lo superen (se redondea arriba).
 */
export function yLimits(trimmed: Column[], limitMax = 0): { yMin: number; yMax: number } {
  let dataMax = -Infinity
  for (const col of trimmed) for (const v of col) if (v !== null && v > dataMax) dataMax = v
  const firstValues: number[] = []
  for (const col of trimmed) {
    for (const v of col) {
      if (v !== null) {
        firstValues.push(v)
        break
      }
    }
  }
  const avgFirst = firstValues.length ? firstValues.reduce((a, b) => a + b, 0) / firstValues.length : 0
  return { yMin: Math.floor(avgFirst * 0.95), yMax: Math.max(Y_MAX_BASE, Math.ceil(dataMax), Math.ceil(limitMax)) }
}

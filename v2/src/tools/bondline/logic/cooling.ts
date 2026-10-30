import type { Column, EventInputs } from './types'

export interface CoolingCheck {
  hasCoolingEvents: boolean
  /** true cuando hay un inicio de cooling numérico (caja de resultado y línea objetivo). */
  show: boolean
  achievedAt: number | null
  /** achievedAt - coolingStart (puede ser decimal o negativo, igual que el original). */
  elapsed: number | null
  /** parseFloat del inicio; NaN si no es numérico. */
  coolingStart: number
}

type CoolingInputs = Pick<EventInputs, 'eventCoolingStart' | 'eventCoolingClosed' | 'eventCoolingEnd'>

export function coolingCheck(
  columns: Column[],
  totalRows: number,
  inputs: CoolingInputs,
  target: number,
): CoolingCheck {
  const coolingStart = parseFloat(inputs.eventCoolingStart)
  const hasCoolingEvents =
    !isNaN(coolingStart) ||
    !isNaN(parseFloat(inputs.eventCoolingClosed)) ||
    !isNaN(parseFloat(inputs.eventCoolingEnd))
  const show = hasCoolingEvents && !isNaN(coolingStart)
  if (!show) return { hasCoolingEvents, show, achievedAt: null, elapsed: null, coolingStart }

  let achievedAt: number | null = null
  for (let r = Math.floor(coolingStart); r < totalRows; r++) {
    if (columns.every((col) => col[r] !== null && (col[r] as number) <= target)) {
      achievedAt = r
      break
    }
  }
  return {
    hasCoolingEvents,
    show,
    achievedAt,
    elapsed: achievedAt !== null ? achievedAt - coolingStart : null,
    coolingStart,
  }
}

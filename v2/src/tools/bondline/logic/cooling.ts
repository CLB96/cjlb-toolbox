import type { Column, EventInputs } from './types'

export interface CoolingCheck {
  hasCoolingEvents: boolean
  /** true cuando hay un inicio de cooling numérico (caja de resultado y línea objetivo). */
  show: boolean
  achievedAt: number | null
  /** achievedAt - coolingStart redondeado a segundos enteros (A12). */
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
  /** Primera fila a revisar (inicio del rango temporal activo, A10). */
  fromRow = 0,
): CoolingCheck {
  const coolingStart = parseFloat(inputs.eventCoolingStart)
  const hasCoolingEvents =
    !isNaN(coolingStart) ||
    !isNaN(parseFloat(inputs.eventCoolingClosed)) ||
    !isNaN(parseFloat(inputs.eventCoolingEnd))
  // un inicio negativo no tiene sentido: no hay chequeo de cooling (A12)
  const show = hasCoolingEvents && !isNaN(coolingStart) && coolingStart >= 0
  if (!show) return { hasCoolingEvents, show, achievedAt: null, elapsed: null, coolingStart }

  let achievedAt: number | null = null
  for (let r = Math.max(Math.floor(coolingStart), fromRow); columns.length > 0 && r < totalRows; r++) {
    if (columns.every((col) => col[r] !== null && (col[r] as number) <= target)) {
      achievedAt = r
      break
    }
  }
  return {
    hasCoolingEvents,
    show,
    achievedAt,
    elapsed: achievedAt !== null ? Math.round(achievedAt - coolingStart) || 0 : null,
    coolingStart,
  }
}

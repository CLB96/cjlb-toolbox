import type { EffectiveRange } from './range'
import { EVENTS_CONFIG, type EventInputs, type EventLabelKey, type Lang } from './types'

export const EVENTS_LABELS: Record<Lang, Record<EventLabelKey, string>> = {
  es: {
    pressStart: 'Inicia Prensa', pressClosed: 'Prensa Cerrada', pressOpen: 'Prensa Abierta', pressEnd: 'Termina Prensa',
    manipStart: 'Inicia Manipulación', manipEnd: 'Termina Manipulación',
    coolingStart: 'Inicia Cooling', coolingClosed: 'Cooling Cerrado', coolingEnd: 'Termina Cooling',
  },
  en: {
    pressStart: 'Press Start', pressClosed: 'Press Closed', pressOpen: 'Press Open', pressEnd: 'Press End',
    manipStart: 'Manip. Start', manipEnd: 'Manip. End',
    coolingStart: 'Cooling Start', coolingClosed: 'Cooling Closed', coolingEnd: 'Cooling End',
  },
}

export interface ActiveEvent {
  x: number
  label: string
  color: string
  id: string
}

/** Sucesos con valor numérico >= 0 (parseFloat), en el orden del original. */
export function activeEvents(inputs: EventInputs, lang: Lang): ActiveEvent[] {
  const events: ActiveEvent[] = []
  for (const config of EVENTS_CONFIG) {
    const value = parseFloat(inputs[config.id])
    if (!isNaN(value) && value >= 0) {
      events.push({ x: value, label: EVENTS_LABELS[lang][config.labelKey], color: config.color, id: config.id })
    }
  }
  return events
}

/** Posición del suceso en el eje del gráfico, o null si cae fuera del rango visible. */
export function visibleEventX(
  evt: Pick<ActiveEvent, 'x'>,
  range: Pick<EffectiveRange, 'start' | 'rows'>,
): number | null {
  const adjusted = evt.x - range.start
  return adjusted >= 0 && adjusted < range.rows ? adjusted : null
}

export function dragDelta(newX: number, originalX: number): { text: string; tone: 'pos' | 'neg' | 'zero' } {
  const delta = newX - originalX
  if (delta > 0) return { text: `+${delta}`, tone: 'pos' }
  if (delta < 0) return { text: `${delta}`, tone: 'neg' }
  return { text: '±0', tone: 'zero' }
}

/**
 * Segundo absoluto de la hoja que se escribe al arrastrar un suceso (R3): `relX` está en el
 * eje del gráfico y se le suma el inicio del rango efectivo. Fuera de [0, totalRows-1]
 * devuelve null (el original ignora ese movimiento).
 */
export function dragToAbsolute(relX: number, range: Pick<EffectiveRange, 'start'>, totalRows: number): number | null {
  const abs = relX + range.start
  return abs >= 0 && abs <= totalRows - 1 ? abs : null
}

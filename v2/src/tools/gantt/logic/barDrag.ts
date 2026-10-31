// Arrastre de barras (BAR DRAG SYSTEM, 1110-1380): modo, fechas en vivo, tooltip y mensaje de deshacer.
import { STATIC_TEXTS, type Lang } from '../i18n'
import { addDays, dayDiff } from './dates'

export type DragMode = 'move' | 'resize-left' | 'resize-right'

export const EDGE_PX = 8

/** detectMode: bordes de 8 px redimensionan; el centro solo mueve con Ctrl o Alt. */
export function detectMode(x: number, width: number, ctrlOrAlt: boolean): DragMode | null {
  if (x <= EDGE_PX) return 'resize-left'
  if (x >= width - EDGE_PX) return 'resize-right'
  return ctrlOrAlt ? 'move' : null
}

export function pxToDays(px: number, cw: number): number {
  return Math.round(px / cw)
}

export interface DragDates {
  start: Date
  end: Date
  tooltipDelta: number
}

export function dragDates(mode: DragMode, origStart: Date, origEnd: Date, deltaDays: number): DragDates {
  let newStart = new Date(origStart)
  let newEnd = new Date(origEnd)
  if (mode === 'move') {
    newStart = addDays(origStart, deltaDays)
    newEnd = addDays(origEnd, deltaDays)
  } else if (mode === 'resize-right') {
    newEnd = addDays(origEnd, deltaDays)
    if (newEnd < newStart) newEnd = new Date(newStart)
  } else {
    newStart = addDays(origStart, deltaDays)
    if (newStart > newEnd) newStart = new Date(newEnd)
  }
  let tooltipDelta = 0
  if (mode === 'move') tooltipDelta = dayDiff(origStart, newStart)
  else if (mode === 'resize-right') tooltipDelta = dayDiff(origEnd, newEnd)
  else tooltipDelta = -dayDiff(origStart, newStart)
  return { start: newStart, end: newEnd, tooltipDelta }
}

export function barTipText(delta: number, mode: 'move' | 'resize', lang: Lang): string {
  const absDelta = Math.abs(delta)
  const dayWord = absDelta === 1 ? STATIC_TEXTS.day[lang] : STATIC_TEXTS.days[lang]
  if (delta === 0) return mode === 'move' ? STATIC_TEXTS.noChange[lang] : STATIC_TEXTS.same[lang]
  if (delta > 0) return mode === 'move' ? `+${absDelta} ${dayWord} →` : `+${absDelta} ${dayWord}`
  return mode === 'move' ? `← ${absDelta} ${dayWord}` : `-${absDelta} ${dayWord}`
}

/** Prefijo del toast de deshacer (commitBarDrag). */
export function undoMessage(origStart: Date, origEnd: Date, finalStart: Date, finalEnd: Date, lang: Lang): string {
  const deltaD = dayDiff(origStart, finalStart)
  const origDur = dayDiff(origStart, origEnd) + 1
  const newDur = dayDiff(finalStart, finalEnd) + 1
  if (origDur !== newDur) {
    const diff = newDur - origDur
    return `${STATIC_TEXTS.duration[lang]} ${diff > 0 ? '+' + diff : diff}d — `
  }
  if (deltaD !== 0) return `${STATIC_TEXTS.moved[lang]} ${deltaD > 0 ? '+' + deltaD : deltaD}d — `
  return ''
}

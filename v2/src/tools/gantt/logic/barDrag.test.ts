import { describe, expect, it } from 'vitest'
import { barTipText, detectMode, dragDates, pxToDays, undoMessage } from './barDrag'
import { fmtDate } from './dates'

const d = (s: string) => new Date(s + 'T00:00:00')
const S = d('2026-11-02')
const E = d('2026-11-05')
const iso = (r: { start: Date; end: Date }) => [fmtDate(r.start), fmtDate(r.end)]

describe('arrastre de barras', () => {
  it('bordes de 8 px redimensionan; el centro solo mueve con Ctrl/Alt', () => {
    expect(detectMode(8, 100, false)).toBe('resize-left')
    expect(detectMode(92, 100, false)).toBe('resize-right')
    expect(detectMode(50, 100, false)).toBeNull()
    expect(detectMode(50, 100, true)).toBe('move')
  })

  it('px a días redondea', () => {
    expect([pxToDays(15, 32), pxToDays(17, 32), pxToDays(-48, 32), pxToDays(-49, 32)]).toEqual([0, 1, -1, -2])
  })

  it('mover desplaza ambas fechas', () => {
    const r = dragDates('move', S, E, 3)
    expect(iso(r)).toEqual(['2026-11-05', '2026-11-08'])
    expect(r.tooltipDelta).toBe(3)
  })

  it('redimensionar no cruza inicio y fin', () => {
    expect(iso(dragDates('resize-right', S, E, -10))).toEqual(['2026-11-02', '2026-11-02'])
    expect(iso(dragDates('resize-left', S, E, 10))).toEqual(['2026-11-05', '2026-11-05'])
    expect(dragDates('resize-left', S, E, -2).tooltipDelta).toBe(2)
  })

  it('texto del tooltip en ES y EN', () => {
    expect(barTipText(0, 'move', 'es')).toBe('· sin cambio')
    expect(barTipText(0, 'resize', 'en')).toBe('· same')
    expect(barTipText(1, 'move', 'es')).toBe('+1 día →')
    expect(barTipText(-2, 'move', 'en')).toBe('← 2 days')
    expect(barTipText(-1, 'resize', 'es')).toBe('-1 día')
  })

  it('mensaje de deshacer: duración, movimiento o vacío', () => {
    expect(undoMessage(S, E, S, d('2026-11-07'), 'es')).toBe('Duración +2d — ')
    expect(undoMessage(S, E, d('2026-10-31'), d('2026-11-03'), 'en')).toBe('Moved -2d — ')
    expect(undoMessage(S, E, S, E, 'es')).toBe('')
  })
})

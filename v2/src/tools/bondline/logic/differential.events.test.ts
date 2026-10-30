import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { I18N } from '../../../../legacy-fixtures/bondline/legacyI18n'
import { legacyActiveEvents, legacyCalcLoss, legacyCooling, legacyCoolingInput, legacyDragDelta, legacyMarkerPositions } from '../../../../legacy-fixtures/bondline/legacyReference'
import { coolingCheck } from './cooling'
import { activeEvents, dragDelta, dragToAbsolute, visibleEventX } from './events'
import { computeLoss } from './loss'
import { defaultMarkerPositions } from './markers'
import { parseSheetRows } from './parse'
import { effectiveRange } from './range'
import { type EventInputs } from './types'
import { LANGS, NO_EVENTS, T, repSheets } from './testHelpers'

describe('coolingCheck ≡ legacyCooling', () => {
  it('pass, fail y oculto en hojas representativas (ES y EN)', () => {
    const outcomes = new Set<string>()
    const cases = [
      { start: '', closed: '', end: '', target: 35 },
      { start: '40', closed: '60', end: '80', target: 35 },
      { start: '85', closed: '', end: '', target: 35 },
      { start: '40', closed: '', end: '', target: 20 },
      { start: '12abc', closed: '', end: '80', target: 100 },
      { start: '500', closed: '', end: '', target: 35 },
    ]
    for (const { raw } of repSheets) {
      const parsed = parseSheetRows(raw)
      if (!parsed.ok) throw new Error('hoja inválida')
      const { columns, totalRows } = parsed.data
      for (const { start, closed, end, target } of cases) {
        const c = coolingCheck(columns, totalRows, { eventCoolingStart: start, eventCoolingClosed: closed, eventCoolingEnd: end }, target)
        expect(c.hasCoolingEvents).toBe(legacyCoolingInput({ start, closed, end }, target).hasCoolingEvents)
        for (const lang of LANGS) {
          const want = legacyCooling(columns, totalRows, { start, closed, end }, target, lang)
          if (!c.show) {
            expect(want).toEqual({ className: 'activation-result', display: 'none', html: '' })
            outcomes.add('hidden')
          } else if (c.achievedAt !== null) {
            expect(want).toEqual({
              className: 'activation-result pass',
              display: 'block',
              html: `<div class="result-title">${T(lang, 'coolingResultTitle')}</div>${T(lang, 'coolingResult', c.elapsed as number, target)}`,
            })
            outcomes.add('pass')
          } else {
            expect(want).toEqual({
              className: 'activation-result fail',
              display: 'block',
              html: `<div class="result-title">${T(lang, 'coolingResultFailTitle')}</div>${T(lang, 'coolingResultFail', target)}`,
            })
            outcomes.add('fail')
          }
        }
      }
    }
    expect(outcomes).toEqual(new Set(['hidden', 'pass', 'fail']))
  })

  it('cooling pass: texto exacto e inicio decimal', () => {
    const parsed = parseSheetRows(FIXTURES.plain)
    if (!parsed.ok) throw new Error('hoja inválida')
    const { columns, totalRows } = parsed.data
    const c = coolingCheck(columns, totalRows, { eventCoolingStart: '85', eventCoolingClosed: '', eventCoolingEnd: '' }, 35)
    expect(T('es', 'coolingResult', c.elapsed as number, 35)).toBe(
      `La pieza alcanzó el correcto enfriamiento (35°C) ${c.elapsed}s después de haber iniciado el ciclo de cooling.`,
    )
    expect(T('en', 'coolingResult', 4, 35)).toBe(I18N.en.coolingResult(4, 35))
    const d = coolingCheck(columns, totalRows, { eventCoolingStart: '40.5', eventCoolingClosed: '', eventCoolingEnd: '' }, 100)
    expect([d.achievedAt, d.elapsed]).toEqual([40, -0.5])
  })
})

describe('sucesos, arrastre, pérdida y marcadores ≡ original', () => {
  it('activeEvents: valores inválidos se descartan y el orden es el del original', () => {
    for (const lang of LANGS) {
      const inputs: EventInputs = {
        ...NO_EVENTS,
        eventCoolingEnd: '90',
        eventPressStart: '5',
        eventManipEnd: '12abc',
        eventPressClosed: '-1',
        eventCoolingStart: '80',
        eventPressEnd: 'abc',
        eventManipStart: ' 7 ',
      }
      const got = activeEvents(inputs, lang)
      expect(got).toEqual(legacyActiveEvents(inputs, lang))
    }
  })

  it('visibleEventX y dragToAbsolute respetan el rango (R3)', () => {
    const range = { start: 20, rows: 50 }
    expect([19, 20, 69, 70].map((x) => visibleEventX({ x }, range))).toEqual([null, 0, 49, null])
    const inactive = effectiveRange(91, { active: false, start: 0, end: null })
    expect([-1, 0, 90, 91].map((x) => dragToAbsolute(x, inactive, 91))).toEqual([null, 0, 90, null])
    const active = effectiveRange(91, { active: true, start: 20, end: 70 })
    expect([0, 25, 70, 71, -21].map((x) => dragToAbsolute(x, active, 91))).toEqual([20, 45, 90, null, null])
  })

  it('dragDelta ≡ legacyDragDelta', () => {
    for (const [n, o] of [[12, 10], [8, 10], [10, 10]]) {
      const want = legacyDragDelta(n, o)
      const got = dragDelta(n, o)
      expect(got.text).toBe(want.text)
      const color = got.tone === 'pos' ? 'var(--green-text)' : got.tone === 'neg' ? 'var(--red-text)' : 'var(--text-3)'
      expect(color).toBe(want.color)
    }
  })

  it('computeLoss ≡ legacyCalcLoss', () => {
    const pairs: [string, string][] = [['25.04', '0.04'], ['10', '10'], ['', '5'], ['1,5', '1.5'], ['12abc', 'abc'], ['-5', '0']]
    for (const [a, b] of pairs) {
      const want = legacyCalcLoss(a, b)
      const got = computeLoss(a, b)
      expect(got.text).toBe(want.text)
      expect('param-computed' + (got.positive ? ' loss-positive' : ' loss-zero')).toBe(want.className)
    }
  })

  it('defaultMarkerPositions ≡ legacyMarkerPositions', () => {
    for (const n of [0, 1, 3, 6, 7, 10, 25]) {
      expect(defaultMarkerPositions(n)).toEqual(legacyMarkerPositions(n))
    }
  })
})

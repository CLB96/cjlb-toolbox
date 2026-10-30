import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { I18N } from '../../../../legacy-fixtures/bondline/legacyI18n'
import { legacyActiveEvents, legacyAnnotations, legacyCalcLoss, legacyCooling, legacyCoolingInput, legacyDragDelta, legacyMarkerPositions } from '../../../../legacy-fixtures/bondline/legacyReference'
import { coolingCheck } from './cooling'
import { activeEvents, dragDelta, dragToAbsolute, visibleEventX } from './events'
import { computeLoss } from './loss'
import { defaultMarkerPositions } from './markers'
import { parseSheetRows } from './parse'
import { effectiveRange } from './range'
import { EVENTS_CONFIG, type EventInputs, type TimeRange } from './types'
import { LANGS, NO_EVENTS, T, calcOf, validSheets } from './testHelpers'

describe('coolingCheck ≡ legacyCooling', () => {
  const starts = ['', '0', '40', '40.5', '-3', '500', 'abc', '12abc']
  const extras = [
    { closed: '', end: '' },
    { closed: '60', end: '' },
    { closed: '', end: '80' },
    { closed: '60', end: '80' },
  ]
  const targets = [35, 100, 20]
  for (const { name, raw } of validSheets) {
    for (const start of starts) {
      for (const ex of extras) {
        for (const target of targets) {
          it(`${name} · inicio '${start}' · closed '${ex.closed}' end '${ex.end}' · objetivo ${target}`, () => {
            const parsed = parseSheetRows(raw)
            if (!parsed.ok) throw new Error('hoja inválida')
            const { columns, totalRows } = parsed.data
            const inputs = { eventCoolingStart: start, eventCoolingClosed: ex.closed, eventCoolingEnd: ex.end }
            const c = coolingCheck(columns, totalRows, inputs, target)
            const li = legacyCoolingInput({ start, closed: ex.closed, end: ex.end }, target)
            expect(c.hasCoolingEvents).toBe(li.hasCoolingEvents)
            for (const lang of LANGS) {
              const want = legacyCooling(columns, totalRows, { start, closed: ex.closed, end: ex.end }, target, lang)
              if (!c.show) {
                expect(want).toEqual({ className: 'activation-result', display: 'none', html: '' })
              } else if (c.achievedAt !== null) {
                expect(want).toEqual({
                  className: 'activation-result pass',
                  display: 'block',
                  html: `<div class="result-title">${T(lang, 'coolingResultTitle')}</div>${T(lang, 'coolingResult', c.elapsed as number, target)}`,
                })
              } else {
                expect(want).toEqual({
                  className: 'activation-result fail',
                  display: 'block',
                  html: `<div class="result-title">${T(lang, 'coolingResultFailTitle')}</div>${T(lang, 'coolingResultFail', target)}`,
                })
              }
            }
          })
        }
      }
    }
  }

  it('cooling pass: texto exacto del cuerpo en la hoja plain (inicio 85, objetivo 35)', () => {
    const parsed = parseSheetRows(FIXTURES.plain)
    if (!parsed.ok) throw new Error('hoja inválida')
    const { columns, totalRows } = parsed.data
    const c = coolingCheck(columns, totalRows, { eventCoolingStart: '85', eventCoolingClosed: '', eventCoolingEnd: '' }, 35)
    expect(c.achievedAt).not.toBeNull()
    expect(T('es', 'coolingResult', c.elapsed as number, 35)).toBe(
      `La pieza alcanzó el correcto enfriamiento (35°C) ${c.elapsed}s después de haber iniciado el ciclo de cooling.`,
    )
    expect(T('en', 'coolingResult', 4, 35)).toBe(I18N.en.coolingResult(4, 35))
  })

  it('inicio decimal produce tiempo decimal (40.5)', () => {
    const parsed = parseSheetRows(FIXTURES.plain)
    if (!parsed.ok) throw new Error('hoja inválida')
    const { columns, totalRows } = parsed.data
    const c = coolingCheck(columns, totalRows, { eventCoolingStart: '40.5', eventCoolingClosed: '', eventCoolingEnd: '' }, 100)
    expect(c.achievedAt).toBe(40)
    expect(c.elapsed).toBe(-0.5)
  })
})

describe('activeEvents ≡ legacyActiveEvents', () => {
  const values = ['', '0', '10', '-1', 'abc', '12abc', '40.5', ' 7 ']
  for (const lang of LANGS) {
    for (const v of values) {
      it(`todos los campos = '${v}' · ${lang}`, () => {
        const inputs = Object.fromEntries(EVENTS_CONFIG.map((c) => [c.id, v])) as EventInputs
        expect(activeEvents(inputs, lang)).toEqual(legacyActiveEvents(inputs, lang))
      })
    }
    it(`mezcla y orden · ${lang}`, () => {
      const inputs: EventInputs = {
        ...NO_EVENTS,
        eventCoolingEnd: '90',
        eventPressStart: '5',
        eventManipEnd: '12abc',
        eventPressClosed: '-1',
        eventCoolingStart: '80',
        eventPressEnd: 'abc',
      }
      const got = activeEvents(inputs, lang)
      expect(got).toEqual(legacyActiveEvents(inputs, lang))
      expect(got.map((e) => e.id)).toEqual(['eventPressStart', 'eventManipEnd', 'eventCoolingStart', 'eventCoolingEnd'])
    })
  }
})

describe('visibleEventX, dragDelta y dragToAbsolute', () => {
  it('visibleEventX usa evt.x - inicio en [0, filas)', () => {
    const range = { start: 20, rows: 50 }
    expect(visibleEventX({ x: 19 }, range)).toBeNull()
    expect(visibleEventX({ x: 20 }, range)).toBe(0)
    expect(visibleEventX({ x: 69 }, range)).toBe(49)
    expect(visibleEventX({ x: 70 }, range)).toBeNull()
  })

  it('visibleEventX ≡ condición del original en legacyAnnotations', () => {
    const parsed = parseSheetRows(FIXTURES.plain)
    if (!parsed.ok) throw new Error('hoja inválida')
    const tr: TimeRange = { active: true, start: 20, end: 70 }
    const { lc, cfg } = calcOf(parsed.data, 'waterbase', tr)
    const events = [5, 19, 20, 45, 69, 70, 100].map((x) => ({ x, label: 'e', color: '#000', id: `e${x}` }))
    const ann = legacyAnnotations(lc, cfg, 'waterbase', events, { hasCoolingEvents: false, coolingStartTime: NaN, coolingTargetTemp: 35 }, false, 'es')
    const range = effectiveRange(parsed.data.totalRows, tr)
    events.forEach((e, idx) => {
      const vis = visibleEventX(e, range)
      expect(`event_${idx}` in ann).toBe(vis !== null)
      if (vis !== null) expect(ann[`event_${idx}`].xMin).toBe(vis)
    })
  })

  it('dragDelta ≡ legacyDragDelta', () => {
    for (const [n, o] of [[12, 10], [8, 10], [10, 10], [0, 0], [100, 0], [0, 100]]) {
      const want = legacyDragDelta(n, o)
      const got = dragDelta(n, o)
      expect(got.text).toBe(want.text)
      const color = got.tone === 'pos' ? 'var(--green-text)' : got.tone === 'neg' ? 'var(--red-text)' : 'var(--text-3)'
      expect(color).toBe(want.color)
    }
  })

  it('dragToAbsolute con rango inactivo ≡ validación legacy (0..totalRows-1)', () => {
    const totalRows = 91
    const inactive = effectiveRange(totalRows, { active: false, start: 0, end: null })
    for (const x of [-1, 0, 1, 45, 89, 90, 91, 200]) {
      const legacyAccepts = x >= 0 && x <= totalRows - 1
      expect(dragToAbsolute(x, inactive, totalRows)).toBe(legacyAccepts ? x : null)
    }
  })

  it('dragToAbsolute con rango activo suma el inicio y respeta los límites (R3)', () => {
    const range = effectiveRange(91, { active: true, start: 20, end: 70 })
    expect(dragToAbsolute(0, range, 91)).toBe(20)
    expect(dragToAbsolute(25, range, 91)).toBe(45)
    expect(dragToAbsolute(70, range, 91)).toBe(90)
    expect(dragToAbsolute(71, range, 91)).toBeNull()
    expect(dragToAbsolute(-21, range, 91)).toBeNull()
  })
})

describe('computeLoss ≡ legacyCalcLoss', () => {
  const vals = ['', '0', '10', '-5', '1,5', '1.5', 'abc', '12abc', '25.04', '0.04']
  for (const a of vals) {
    for (const b of vals) {
      it(`'${a}' - '${b}'`, () => {
        const want = legacyCalcLoss(a, b)
        const got = computeLoss(a, b)
        expect(got.text).toBe(want.text)
        expect('param-computed' + (got.positive ? ' loss-positive' : ' loss-zero')).toBe(want.className)
      })
    }
  }
})

describe('defaultMarkerPositions ≡ legacyMarkerPositions', () => {
  for (let n = 0; n <= 25; n++) {
    it(`${n} marcadores`, () => {
      expect(defaultMarkerPositions(n)).toEqual(legacyMarkerPositions(n))
    })
  }

  it('valores literales por rama del original', () => {
    expect(defaultMarkerPositions(1)).toEqual([{ x: 30, y: 50 }])
    expect(defaultMarkerPositions(2)).toEqual([{ x: 30, y: 50 }, { x: 70, y: 50 }])
    expect(defaultMarkerPositions(3)).toEqual([{ x: 25, y: 30 }, { x: 75, y: 30 }, { x: 25, y: 70 }])
    expect(defaultMarkerPositions(4)[3]).toEqual({ x: 75, y: 70 })
    expect(defaultMarkerPositions(5)).toEqual([
      { x: 20, y: 30 }, { x: 50, y: 30 }, { x: 80, y: 30 }, { x: 20, y: 70 }, { x: 50, y: 70 },
    ])
    expect(defaultMarkerPositions(6)[5]).toEqual({ x: 80, y: 70 })
    expect(defaultMarkerPositions(7)[6]).toEqual({ x: 20, y: 85 })
    expect(defaultMarkerPositions(9)[8]).toEqual({ x: 80, y: 85 })
    expect(defaultMarkerPositions(10)[5]).toEqual({ x: 15, y: 40 })
    expect(defaultMarkerPositions(25)[24]).toEqual({ x: 87, y: 100 })
  })
})

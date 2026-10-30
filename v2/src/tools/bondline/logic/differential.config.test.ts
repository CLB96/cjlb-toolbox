import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { legacyActiveEvents, legacyAnnotations, legacyApplyTimeRange, legacyCoolingInput, legacySaveDefaults } from '../../../../legacy-fixtures/bondline/legacyReference'
import { buildAnnotations } from './annotations'
import { coolingCheck } from './cooling'
import { normalizeDefaults, parseDefaultsForm } from './defaults'
import { activeEvents } from './events'
import { parseSheetRows } from './parse'
import { effectiveRange, validateTimeRange } from './range'
import { FACTORY_DEFAULTS, type EventInputs, type Lang, type TimeRange } from './types'
import { LANGS, NO_EVENTS, T, calcOf, repSheets } from './testHelpers'

describe('parseDefaultsForm ≡ legacySaveDefaults y normalizeDefaults', () => {
  it('formularios vacíos, inválidos y mezclados', () => {
    for (const v of ['', '0', '12abc', '-3', '70.5']) {
      const form = { wbMin: v, wbMax: v, hmMin: v, hmMax: v, cooling: v }
      expect(parseDefaultsForm(form)).toEqual(legacySaveDefaults(form))
    }
    const form = { wbMin: '', wbMax: '60', hmMin: '0', hmMax: '12abc', cooling: '' }
    expect(parseDefaultsForm(form)).toEqual(legacySaveDefaults(form))
    expect(parseDefaultsForm(form).waterbase).toEqual({ min: 55, max: 60 })
  })

  it('normalizeDefaults: válido se conserva; inválido o parcial -> copia de fábrica', () => {
    const ok = { waterbase: { min: 1, max: 2 }, hotmelt: { min: 3, max: 4 }, coolingTarget: 5 }
    expect(normalizeDefaults(ok)).toEqual(ok)
    for (const bad of [null, 'x', {}, { ...ok, hotmelt: null }, { ...ok, coolingTarget: NaN }]) {
      expect(normalizeDefaults(bad)).toEqual(FACTORY_DEFAULTS)
    }
    expect(normalizeDefaults(null)).not.toBe(FACTORY_DEFAULTS)
  })
})

describe('validateTimeRange ≡ legacyApplyTimeRange', () => {
  const ALERT = {
    startNegative: (l: Lang) => (l === 'es' ? 'El tiempo de inicio debe ser mayor o igual a 0' : 'Start time must be 0 or greater'),
    endNotAfterStart: (l: Lang) => (l === 'es' ? 'El tiempo final debe ser mayor al inicial' : 'End time must be greater than start time'),
    endExceeds: (l: Lang, rows: number) => (l === 'es' ? `El tiempo final no puede exceder ${rows}s` : `End time cannot exceed ${rows}s`),
  }
  it('rangos válidos, offset, negativos, fin <= inicio y fin > total (ES y EN)', () => {
    const cases: [string, string][] = [
      ['', ''], ['10', '60'], ['5.7', ''], ['12abc', '91'], ['-1', '10'], ['10', '10'], ['0', '92'], ['abc', 'abc'], ['91', ''],
    ]
    for (const [s, e] of cases) {
      for (const lang of LANGS) {
        const want = legacyApplyTimeRange(s, e, 91, lang)
        const got = validateTimeRange(s, e, 91)
        if ('alert' in want) {
          expect(got.ok).toBe(false)
          if (!got.ok) expect(ALERT[got.error](lang, 91)).toBe(want.alert)
        } else {
          expect(got).toEqual({ ok: true, range: { active: true, start: want.start, end: want.end } })
        }
      }
    }
  })
})

describe('buildAnnotations ≡ legacyAnnotations (configuración representativa)', () => {
  const eventsInputs: EventInputs = { ...NO_EVENTS, eventPressStart: '5', eventManipStart: '30', eventCoolingStart: '80', eventCoolingEnd: '90' }

  function annotate(raw: unknown[][], tr: TimeRange, cs: string, dark: boolean, lang: Lang) {
    const parsed = parseSheetRows(raw)
    if (!parsed.ok) throw new Error('hoja inválida')
    const { columns, totalRows } = parsed.data
    const { lc, cfg } = calcOf(parsed.data, 'waterbase', tr)
    const inputs: EventInputs = { ...eventsInputs, eventCoolingStart: cs }
    const cc = coolingCheck(columns, totalRows, inputs, 35)
    const li = legacyCoolingInput({ start: cs, closed: '', end: inputs.eventCoolingEnd }, 35)
    const want = legacyAnnotations(lc, cfg, 'waterbase', legacyActiveEvents(inputs, lang), li, dark, lang)
    const got = buildAnnotations({
      activationStart: lc.activationStart,
      range: effectiveRange(totalRows, tr),
      cfg,
      adhesive: 'waterbase',
      events: activeEvents(inputs, lang),
      cooling: cc,
      coolingTarget: 35,
      dark,
      t: (key, ...args) => T(lang, key, ...args),
    })
    return { got, want }
  }

  it('ventana, sucesos y línea de cooling idénticos (claro/oscuro, rango con offset)', () => {
    const raw = (repSheets.find((s) => s.name.startsWith('real:')) ?? repSheets[0]).raw
    const combos: [TimeRange, string, boolean, Lang][] = [
      [{ active: false, start: 0, end: null }, '80', false, 'es'],
      [{ active: true, start: 20, end: 70 }, '40', true, 'en'],
      [{ active: true, start: 60, end: null }, '', false, 'es'],
    ]
    for (const [tr, cs, dark, lang] of combos) {
      const { got, want } = annotate(raw, tr, cs, dark, lang)
      expect(got).toEqual(want)
    }
  })

  it('línea de cooling oculta cuando el inicio cae después del rango visible', () => {
    const { got } = annotate(FIXTURES.plain, { active: true, start: 0, end: 50 }, '80', false, 'es')
    expect('coolingTargetLine' in got).toBe(false)
  })
})

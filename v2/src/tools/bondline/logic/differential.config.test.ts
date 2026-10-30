import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { legacyActiveEvents, legacyAnnotations, legacyApplyTimeRange, legacyCoolingInput, legacySaveDefaults } from '../../../../legacy-fixtures/bondline/legacyReference'
import { buildAnnotations } from './annotations'
import { coolingCheck } from './cooling'
import { normalizeDefaults, parseDefaultsForm } from './defaults'
import { activeEvents } from './events'
import { parseSheetRows } from './parse'
import { effectiveRange, validateTimeRange } from './range'
import { ACTIVATION_DURATION, EVENTS_CONFIG, FACTORY_DEFAULTS, TC_COLORS, type EventInputs, type Lang, type TimeRange } from './types'
import { ADHESIVES, LANGS, NO_EVENTS, T, calcOf, validSheets } from './testHelpers'

describe('parseDefaultsForm ≡ legacySaveDefaults y normalizeDefaults', () => {
  const vals = ['', '0', '12abc', '50', '-3', '70.5', 'abc']
  for (const v of vals) {
    it(`todos los campos = '${v}'`, () => {
      const form = { wbMin: v, wbMax: v, hmMin: v, hmMax: v, cooling: v }
      expect(parseDefaultsForm(form)).toEqual(legacySaveDefaults(form))
    })
  }
  it('mezcla: wbMin vacío y wbMax 60 -> 55/60', () => {
    const form = { wbMin: '', wbMax: '60', hmMin: '0', hmMax: '12abc', cooling: '' }
    expect(parseDefaultsForm(form)).toEqual(legacySaveDefaults(form))
    expect(parseDefaultsForm(form).waterbase).toEqual({ min: 55, max: 60 })
  })

  it('normalizeDefaults: válido se conserva; inválido o parcial -> fábrica', () => {
    const ok = { waterbase: { min: 1, max: 2 }, hotmelt: { min: 3, max: 4 }, coolingTarget: 5 }
    expect(normalizeDefaults(ok)).toEqual(ok)
    for (const bad of [null, undefined, 'x', 3, {}, { waterbase: { min: 1, max: 2 } }, { ...ok, hotmelt: null }, { ...ok, coolingTarget: 'a' }, { ...ok, waterbase: { min: 1 } }, { ...ok, coolingTarget: NaN }]) {
      expect(normalizeDefaults(bad)).toEqual(FACTORY_DEFAULTS)
    }
  })

  it('normalizeDefaults devuelve copia, no la constante de fábrica', () => {
    const got = normalizeDefaults(null)
    expect(got).not.toBe(FACTORY_DEFAULTS)
    expect(got.waterbase).not.toBe(FACTORY_DEFAULTS.waterbase)
  })
})

describe('validateTimeRange ≡ legacyApplyTimeRange', () => {
  const ALERT = {
    startNegative: (l: Lang) => (l === 'es' ? 'El tiempo de inicio debe ser mayor o igual a 0' : 'Start time must be 0 or greater'),
    endNotAfterStart: (l: Lang) => (l === 'es' ? 'El tiempo final debe ser mayor al inicial' : 'End time must be greater than start time'),
    endExceeds: (l: Lang, rows: number) => (l === 'es' ? `El tiempo final no puede exceder ${rows}s` : `End time cannot exceed ${rows}s`),
  }
  const starts = ['', '0', '-1', '5.7', '10', '12abc', 'abc', '91', '200']
  const ends = ['', '0', '5', '10', '60', '91', '92', '5.7', '-1', 'abc']
  for (const s of starts) {
    for (const e of ends) {
      for (const lang of LANGS) {
        it(`inicio '${s}' fin '${e}' · ${lang}`, () => {
          const want = legacyApplyTimeRange(s, e, 91, lang)
          const got = validateTimeRange(s, e, 91)
          if ('alert' in want) {
            expect(got.ok).toBe(false)
            if (!got.ok) expect(ALERT[got.error](lang, 91)).toBe(want.alert)
          } else {
            expect(got).toEqual({ ok: true, range: { active: true, start: want.start, end: want.end } })
          }
        })
      }
    }
  }
})

describe('constantes literales del original', () => {
  it('TC_COLORS son exactamente los 20 colores del original', () => {
    expect(TC_COLORS).toEqual([
      '#4f8cff', '#ef5b67', '#43b36b', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#f43f5e', '#14b8a6', '#6366f1', '#d97706', '#0ea5e9', '#e11d48', '#10b981', '#a855f7', '#ca8a04', '#0891b2', '#be185d', '#3b82f6',
    ])
  })
  it('EVENTS_CONFIG: 9 sucesos con ids y colores del original', () => {
    expect(EVENTS_CONFIG.map((c) => c.id)).toEqual([
      'eventPressStart', 'eventPressClosed', 'eventPressOpen', 'eventPressEnd',
      'eventManipStart', 'eventManipEnd', 'eventCoolingStart', 'eventCoolingClosed', 'eventCoolingEnd',
    ])
  })
  it('ACTIVATION_DURATION = 30 y FACTORY_DEFAULTS', () => {
    expect(ACTIVATION_DURATION).toBe(30)
    expect(FACTORY_DEFAULTS).toEqual({ waterbase: { min: 55, max: 75 }, hotmelt: { min: 60, max: 80 }, coolingTarget: 35 })
  })
})

describe('buildAnnotations ≡ legacyAnnotations (tema, adhesivo, rango, cooling)', () => {
  const THEMES = [false, true]
  const coolingStarts = ['', '40', '0', '500', '80']
  const eventsInputs: EventInputs = { ...NO_EVENTS, eventPressStart: '5', eventManipStart: '30', eventCoolingStart: '80', eventCoolingEnd: '90' }
  const ranges: TimeRange[] = [
    { active: false, start: 0, end: null },
    { active: true, start: 20, end: 70 },
    { active: true, start: 60, end: null },
  ]
  for (const { name, raw } of validSheets.filter((s) => ['plain', 'neverActivates', 'real'].some((p) => s.name.startsWith(p)))) {
    for (const adhesive of ADHESIVES) {
      for (const dark of THEMES) {
        for (const tr of ranges) {
          for (const cs of coolingStarts) {
            for (const lang of LANGS) {
              it(`${name} · ${adhesive} · ${dark ? 'oscuro' : 'claro'} · ${tr.start}-${tr.end} · cooling '${cs}' · ${lang}`, () => {
                const parsed = parseSheetRows(raw)
                if (!parsed.ok) throw new Error('hoja inválida')
                const { columns, totalRows } = parsed.data
                const { lc, cfg } = calcOf(parsed.data, adhesive, tr)
                const inputs: EventInputs = { ...eventsInputs, eventCoolingStart: cs }
                const events = activeEvents(inputs, lang)
                const legacyEvents = legacyActiveEvents(inputs, lang)
                const cc = coolingCheck(columns, totalRows, inputs, 35)
                const li = legacyCoolingInput({ start: cs, closed: '', end: inputs.eventCoolingEnd }, 35)
                const want = legacyAnnotations(lc, cfg, adhesive, legacyEvents, li, dark, lang)
                const got = buildAnnotations({
                  activationStart: lc.activationStart,
                  range: effectiveRange(totalRows, tr),
                  cfg,
                  adhesive,
                  events,
                  cooling: cc,
                  coolingTarget: 35,
                  dark,
                  t: (key, ...args) => T(lang, key, ...args),
                })
                expect(got).toEqual(want)
              })
            }
          }
        }
      }
    }
  }

  it('línea de cooling oculta cuando el inicio cae después del rango visible', () => {
    const parsed = parseSheetRows(FIXTURES.plain)
    if (!parsed.ok) throw new Error('hoja inválida')
    const tr: TimeRange = { active: true, start: 0, end: 50 }
    const { lc, cfg } = calcOf(parsed.data, 'waterbase', tr)
    const inputs: EventInputs = { ...NO_EVENTS, eventCoolingStart: '80' }
    const got = buildAnnotations({
      activationStart: lc.activationStart,
      range: effectiveRange(parsed.data.totalRows, tr),
      cfg,
      adhesive: 'waterbase',
      events: activeEvents(inputs, 'es'),
      cooling: coolingCheck(parsed.data.columns, parsed.data.totalRows, inputs, 35),
      coolingTarget: 35,
      dark: false,
      t: (key, ...args) => T('es', key, ...args),
    })
    expect('coolingTargetLine' in got).toBe(false)
  })
})


import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { I18N } from '../../../../legacy-fixtures/bondline/legacyI18n'
import {
  legacyActivationResultHtml,
  legacyActiveEvents,
  legacyAnnotations,
  legacyApplyTimeRange,
  legacyCalcLoss,
  legacyCooling,
  legacyCoolingInput,
  legacyDragDelta,
  legacyLoadSheet,
  legacyMarkerPositions,
  legacyRenderCalc,
  legacySaveDefaults,
  legacyStatsTexts,
  type LegacyCalc,
  type LegacySheet,
} from '../../../../legacy-fixtures/bondline/legacyReference'
import { loadRealWorkbook } from '../../../../legacy-fixtures/bondline/realFixture'
import { adhesiveConfig, findActivationStart, isWindowInRange, yLimits } from './activation'
import { buildAnnotations } from './annotations'
import { coolingCheck } from './cooling'
import { normalizeDefaults, parseDefaultsForm } from './defaults'
import { activeEvents, dragDelta, dragToAbsolute, visibleEventX } from './events'
import { computeLoss } from './loss'
import { defaultMarkerPositions } from './markers'
import { parseSheetRows } from './parse'
import { effectiveRange, trimColumns, validateTimeRange } from './range'
import { activationResult } from './results'
import { kpiTexts, minMaxTemp } from './stats'
import {
  ACTIVATION_DURATION,
  EVENTS_CONFIG,
  FACTORY_DEFAULTS,
  TC_COLORS,
  type AdhesiveType,
  type EventInputs,
  type Lang,
  type ParsedSheet,
  type TimeRange,
} from './types'

const real = loadRealWorkbook()
const sheets: { name: string; raw: unknown[][] }[] = Object.entries(FIXTURES).map(([name, raw]) => ({ name, raw }))
if (real) for (const s of real) sheets.push({ name: `real:${s.name}`, raw: s.raw })

const validSheets = sheets
  .map((s) => ({ ...s, legacy: legacyLoadSheet(s.raw) }))
  .filter((s): s is typeof s & { legacy: LegacySheet } => typeof s.legacy !== 'string')

const ADHESIVES: AdhesiveType[] = ['waterbase', 'hotmelt']
const LANGS: Lang[] = ['es', 'en']

// T() del original con el idioma como parámetro.
function T(lang: Lang, key: string, ...args: (number | string)[]): string {
  const v = I18N[lang]?.[key] ?? I18N.es[key]
  return typeof v === 'function' ? v(...args) : (v ?? key)
}

function rangesFor(legacy: LegacySheet): { name: string; tr: TimeRange }[] {
  const act = legacyRenderCalc({
    columns: legacy.columns,
    totalRows: legacy.totalRows,
    cfg: { min: 55, max: 75, label: 'Water Base' },
    timeRange: { active: false, start: 0, end: null },
  }).activationStart
  const s = act ?? 5
  return [
    { name: 'inactivo', tr: { active: false, start: 0, end: null } },
    { name: 'inactivo con valores', tr: { active: false, start: 40, end: 50 } },
    { name: '{0,null}', tr: { active: true, start: 0, end: null } },
    { name: '{10,60}', tr: { active: true, start: 10, end: 60 } },
    { name: '{60,null}', tr: { active: true, start: 60, end: null } },
    { name: 'corta la ventana', tr: { active: true, start: 0, end: s + 10 } },
    { name: 'activación antes del inicio', tr: { active: true, start: s + 5, end: null } },
    { name: 'inicio exacto en activación', tr: { active: true, start: s, end: s + 30 } },
  ]
}

describe('parseSheetRows ≡ legacyLoadSheet (primera fila siempre es dato)', () => {
  for (const { name, raw } of sheets) {
    it(`hoja ${name}`, () => {
      const legacy = legacyLoadSheet(raw)
      const got = parseSheetRows(raw)
      if (typeof legacy === 'string') expect(got).toEqual({ ok: false, reason: legacy })
      else expect(got).toEqual({ ok: true, data: legacy })
    })
  }

  it('una primera fila de texto es dato (no encabezado): sus celdas no numéricas son null', () => {
    const got = parseSheetRows([['Time', 'Probe'], [1, 2], [3, 4]])
    expect(got).toEqual({
      ok: true,
      data: { columns: [[null, 1, 3], [null, 2, 4]], totalRows: 3 },
    })
  })

  it('una primera fila numérica cuenta como primer segundo', () => {
    const got = parseSheetRows([[20, 21], [22, 23]])
    expect(got).toEqual({ ok: true, data: { columns: [[20, 22], [21, 23]], totalRows: 2 } })
  })

  it('hoja grande no desborda la pila (sin Math.max sobre arrays)', () => {
    const big = Array.from({ length: 200000 }, (_, i) => [i % 90])
    const got = parseSheetRows(big)
    expect(got.ok && got.data.totalRows).toBe(200000)
  })
})

describe('cálculo de rango/activación ≡ legacyRenderCalc', () => {
  for (const { name, raw, legacy } of validSheets) {
    for (const adhesive of ADHESIVES) {
      for (const { name: rname, tr } of rangesFor(legacy)) {
        it(`${name} · ${adhesive} · ${rname}`, () => {
          const cfg = adhesiveConfig(FACTORY_DEFAULTS, adhesive)
          const parsed = parseSheetRows(raw)
          if (!parsed.ok) throw new Error('hoja inválida')
          const { columns, totalRows } = parsed.data
          const lc = legacyRenderCalc({ columns, totalRows, cfg, timeRange: tr })

          const range = effectiveRange(totalRows, tr)
          expect(range).toEqual({ start: lc.effectiveStart, end: lc.effectiveEnd, rows: lc.effectiveRows })
          const trimmed = trimColumns(columns, range.start, range.end)
          expect(trimmed).toEqual(lc.trimmedColumns)

          const act = findActivationStart(columns, totalRows, cfg.min)
          expect(act).toBe(lc.activationStart)
          const inRange = act !== null && isWindowInRange(columns, totalRows, act, range, cfg)
          expect(inRange).toBe(lc.allInRange)
          expect(yLimits(trimmed)).toEqual({ yMin: lc.yMin, yMax: lc.yMax })
          expect(minMaxTemp(columns)).toEqual({ min: lc.minTemp, max: lc.maxTemp })
        })
      }
    }
  }
})

function calcOf(data: ParsedSheet, adhesive: AdhesiveType, tr: TimeRange): { lc: LegacyCalc; cfg: ReturnType<typeof adhesiveConfig> } {
  const cfg = adhesiveConfig(FACTORY_DEFAULTS, adhesive)
  return { cfg, lc: legacyRenderCalc({ columns: data.columns, totalRows: data.totalRows, cfg, timeRange: tr }) }
}

describe('kpiTexts ≡ legacyStatsTexts', () => {
  for (const { name, raw } of validSheets) {
    for (const adhesive of ADHESIVES) {
      it(`${name} · ${adhesive}`, () => {
        const parsed = parseSheetRows(raw)
        if (!parsed.ok) throw new Error('hoja inválida')
        const { lc } = calcOf(parsed.data, adhesive, { active: false, start: 0, end: null })
        const want = legacyStatsTexts(lc, 'es')
        const { activation, activated, duration, max, min, tc } = kpiTexts(parsed.data, lc.activationStart)
        expect({ activation, activated, duration, max, min, tc }).toEqual({
          activation: want.activation,
          activated: want.activated,
          duration: want.duration,
          max: want.max,
          min: want.min,
          tc: want.tc,
        })
      })
    }
  }
})

describe('activationResult ≡ legacyActivationResultHtml (todas las variantes, ES y EN)', () => {
  for (const { name, raw, legacy } of validSheets) {
    for (const adhesive of ADHESIVES) {
      for (const { name: rname, tr } of rangesFor(legacy)) {
        for (const lang of LANGS) {
          it(`${name} · ${adhesive} · ${rname} · ${lang}`, () => {
            const parsed = parseSheetRows(raw)
            if (!parsed.ok) throw new Error('hoja inválida')
            const { lc, cfg } = calcOf(parsed.data, adhesive, tr)
            const want = legacyActivationResultHtml(lc, cfg, lang)
            const r = activationResult(lc.activationStart, lc.allInRange, lc.effectiveStart, cfg)
            const html = `<div class="result-title">${T(lang, r.titleKey)}</div>${T(lang, r.bodyKey, ...r.args)}`
            expect({ className: `activation-result ${r.variant}`, html }).toEqual(want)
          })
        }
      }
    }
  }

  it('activación exacta en hoja sintética plain: Water Base t=37, Hotmelt t=43', () => {
    const parsed = parseSheetRows(FIXTURES.plain)
    if (!parsed.ok) throw new Error('hoja inválida')
    const { columns, totalRows } = parsed.data
    expect(findActivationStart(columns, totalRows, 55)).toBe(37)
    expect(findActivationStart(columns, totalRows, 60)).toBe(43)
  })

  it('neverActivates: Water Base no se alcanza -> variante fail / resultFail', () => {
    const parsed = parseSheetRows(FIXTURES.neverActivates)
    if (!parsed.ok) throw new Error('hoja inválida')
    const cfg = adhesiveConfig(FACTORY_DEFAULTS, 'waterbase')
    expect(findActivationStart(parsed.data.columns, parsed.data.totalRows, cfg.min)).toBeNull()
    expect(activationResult(null, false, 0, cfg)).toEqual({
      variant: 'fail',
      titleKey: 'resultFailTitle',
      bodyKey: 'resultFail',
      args: [55, 'Water Base'],
    })
  })

  it('rango con inicio > activación: tiempo mostrado negativo', () => {
    const cfg = adhesiveConfig(FACTORY_DEFAULTS, 'waterbase')
    const r = activationResult(37, false, 42, cfg)
    expect(r.args[0]).toBe(-5)
    expect(T('es', r.bodyKey, ...r.args)).toContain('t=-5s')
  })

  it('con rango desplazado el tiempo es relativo: plain {10,null} -> t=27s', () => {
    const parsed = parseSheetRows(FIXTURES.plain)
    if (!parsed.ok) throw new Error('hoja inválida')
    const { lc, cfg } = calcOf(parsed.data, 'waterbase', { active: true, start: 10, end: null })
    const r = activationResult(lc.activationStart, lc.allInRange, lc.effectiveStart, cfg)
    expect(r.variant).toBe('pass')
    expect(r.args).toEqual([55, 27, ACTIVATION_DURATION, 75])
  })
})

const NO_EVENTS: EventInputs = {
  eventPressStart: '', eventPressClosed: '', eventPressOpen: '', eventPressEnd: '',
  eventManipStart: '', eventManipEnd: '',
  eventCoolingStart: '', eventCoolingClosed: '', eventCoolingEnd: '',
}

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
  it('TC_COLORS tiene los 20 colores del original', () => {
    expect(TC_COLORS).toHaveLength(20)
    expect(TC_COLORS[0]).toBe('#4f8cff')
    expect(TC_COLORS[19]).toBe('#3b82f6')
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

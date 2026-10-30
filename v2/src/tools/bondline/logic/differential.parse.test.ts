import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { legacyActivationResultHtml, legacyLoadSheet, legacyRenderCalc, legacyStatsTexts } from '../../../../legacy-fixtures/bondline/legacyReference'
import { adhesiveConfig, findActivationStart, isWindowInRange, yLimits } from './activation'
import { parseSheetRows } from './parse'
import { effectiveRange, trimColumns } from './range'
import { activationResult } from './results'
import { kpiTexts, minMaxTemp } from './stats'
import { ACTIVATION_DURATION, FACTORY_DEFAULTS } from './types'
import { ADHESIVES, LANGS, T, calcOf, rangesFor, sheets, validSheets } from './testHelpers'

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

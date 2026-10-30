import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { legacyActivationResultHtml, legacyLoadSheet, legacyRenderCalc, legacyStatsTexts } from '../../../../legacy-fixtures/bondline/legacyReference'
import { adhesiveConfig, findActivationStart, isWindowInRange, yLimits } from './activation'
import { parseSheetRows } from './parse'
import { effectiveRange, trimColumns } from './range'
import { activationResult } from './results'
import { kpiTexts, minMaxTemp } from './stats'
import { ACTIVATION_DURATION, FACTORY_DEFAULTS } from './types'
import { ADHESIVES, LANGS, T, calcOf, repRangesFor, repSheets, sheets, validSheets } from './testHelpers'

// representativas + TODAS las hojas del Excel real
const kpiSheets = [...new Set([...repSheets, ...validSheets.filter((s) => s.name.startsWith('real:'))])]

describe('parseSheetRows ≡ legacyLoadSheet (primera fila siempre es dato)', () => {
  it('todas las hojas (sintéticas y reales, vacía, solo texto, celdas en blanco, 12abc, una fila)', () => {
    const extra = [[[20, '12abc']], [['', 21], [22, '12abc']]]
    for (const raw of [...sheets.map((s) => s.raw), ...extra]) {
      const legacy = legacyLoadSheet(raw)
      const got = parseSheetRows(raw)
      if (typeof legacy === 'string') expect(got).toEqual({ ok: false, reason: legacy })
      else expect(got).toEqual({ ok: true, data: legacy })
    }
  })

  it('la primera fila es dato: texto -> null, numérica -> primer segundo', () => {
    expect(parseSheetRows([['Time', 'Probe'], [1, 2], [3, 4]])).toEqual({
      ok: true,
      data: { columns: [[null, 1, 3], [null, 2, 4]], totalRows: 3 },
    })
    expect(parseSheetRows([[20, 21], [22, 23]])).toEqual({ ok: true, data: { columns: [[20, 22], [21, 23]], totalRows: 2 } })
  })

  it('hoja grande (200k filas) no desborda la pila', () => {
    const big = Array.from({ length: 200000 }, (_, i) => [i % 90])
    const got = parseSheetRows(big)
    expect(got.ok && got.data.totalRows).toBe(200000)
  })
})

describe('rango, activación, KPIs y resultado ≡ original (combinaciones representativas)', () => {
  it('rango, recorte, activación y límites', () => {
    for (const { raw, legacy } of repSheets) {
      for (const adhesive of ADHESIVES) {
        for (const { tr } of repRangesFor(legacy)) {
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
          expect(act !== null && isWindowInRange(columns, totalRows, act, range, cfg)).toBe(lc.allInRange)
          // yMax ya no es fijo (mejora A11): 80 del original salvo que los datos lo superen
          const peak = Math.max(...trimmed.flat().filter((v): v is number => v !== null))
          expect(yLimits(trimmed)).toEqual({ yMin: lc.yMin, yMax: Math.max(lc.yMax, Math.ceil(peak)) })
          expect(minMaxTemp(columns)).toEqual({ min: lc.minTemp, max: lc.maxTemp })
        }
      }
    }
  })

  it('kpiTexts ≡ legacyStatsTexts', () => {
    for (const { legacy } of kpiSheets) {
      for (const adhesive of ADHESIVES) {
        const { lc } = calcOf(legacy, adhesive, { active: false, start: 0, end: null })
        const want = legacyStatsTexts(lc, 'es')
        const { activation, activated, duration, max, min, tc } = kpiTexts(legacy, lc.activationStart)
        expect({ activation, activated, duration, max, min, tc }).toEqual({
          activation: want.activation,
          activated: want.activated,
          duration: want.duration,
          max: want.max,
          min: want.min,
          tc: want.tc,
        })
      }
    }
  })

  it('activationResult ≡ legacyActivationResultHtml (pass/fail/out, ES y EN)', () => {
    const variants = new Set<string>()
    for (const { legacy } of kpiSheets) {
      for (const adhesive of ADHESIVES) {
        for (const { tr } of repRangesFor(legacy)) {
          for (const lang of LANGS) {
            const { lc, cfg } = calcOf(legacy, adhesive, tr)
            const r = activationResult(lc.activationStart, lc.allInRange, lc.effectiveStart, cfg)
            const html = `<div class="result-title">${T(lang, r.titleKey)}</div>${T(lang, r.bodyKey, ...r.args)}`
            expect({ className: `activation-result ${r.variant}`, html }).toEqual(legacyActivationResultHtml(lc, cfg, lang))
            variants.add(r.variant)
          }
        }
      }
    }
    expect(variants.size).toBeGreaterThanOrEqual(2)
  })

  it('casos límite: nunca activa (fail), activación antes del inicio (t negativo), rango desplazado (t=27s)', () => {
    const never = parseSheetRows(FIXTURES.neverActivates)
    if (!never.ok) throw new Error('hoja inválida')
    const wb = adhesiveConfig(FACTORY_DEFAULTS, 'waterbase')
    expect(findActivationStart(never.data.columns, never.data.totalRows, wb.min)).toBeNull()
    expect(activationResult(null, false, 0, wb)).toEqual({
      variant: 'fail',
      titleKey: 'resultFailTitle',
      bodyKey: 'resultFail',
      args: [55, 'Water Base'],
    })
    expect(T('es', activationResult(37, false, 42, wb).bodyKey, ...activationResult(37, false, 42, wb).args)).toContain('t=-5s')

    const plain = parseSheetRows(FIXTURES.plain)
    if (!plain.ok) throw new Error('hoja inválida')
    expect(findActivationStart(plain.data.columns, plain.data.totalRows, 55)).toBe(37)
    expect(findActivationStart(plain.data.columns, plain.data.totalRows, 60)).toBe(43)
    const { lc, cfg } = calcOf(plain.data, 'waterbase', { active: true, start: 10, end: null })
    const r = activationResult(lc.activationStart, lc.allInRange, lc.effectiveStart, cfg)
    expect(r.variant).toBe('pass')
    expect(r.args).toEqual([55, 27, ACTIVATION_DURATION, 75])
  })
})

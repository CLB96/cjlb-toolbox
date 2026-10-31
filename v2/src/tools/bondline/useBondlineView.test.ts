import { legacyActivationResultHtml, legacyStatsTexts } from '../../../legacy-fixtures/bondline/legacyReference'
import { initialConfig } from './store'
import { computeView } from './useBondlineView'
import { ADHESIVES, T, calcOf, repRangesFor, repSheets } from './logic/testHelpers'
import { FACTORY_DEFAULTS, type TimeRange } from './logic/types'

test('KPIs, caja y ejes como el original (hojas, adhesivos y rangos representativos)', () => {
  for (const sheet of repSheets) {
    for (const adhesive of ADHESIVES) {
      for (const { tr } of repRangesFor(sheet.legacy)) {
        const config = { ...initialConfig(), adhesive, timeRange: tr }
        const v = computeView(sheet.legacy, config, FACTORY_DEFAULTS, 'es')
        const { lc, cfg } = calcOf(sheet.legacy, adhesive, tr)
        const { activationLabel: _l, ...stats } = legacyStatsTexts(lc, 'es')
        expect(v.labels).toEqual(lc.labels)
        expect(v.yMin).toBe(lc.yMin)
        expect(v.yMax).toBeGreaterThanOrEqual(lc.yMax) // 80 del original o más (mejora A11)
        // sin rango activo todo coincide con el original; con rango, KPIs y activación son los del rango (A8/A10)
        if (tr.active) continue
        expect(v.kpis).toEqual(stats)
        expect(v.activationEnd).toBe(lc.activationEnd)
        if (v.allInRange) expect(lc.allInRange).toBe(true) // la ventana ahora valida 31 muestras (A9): solo más estricta
        if (v.allInRange === lc.allInRange && v.windowComplete) {
          const html = `<div class="result-title">${T('es', v.result.titleKey)}</div>${T('es', v.result.bodyKey, ...v.result.args)}`
          expect(html).toBe(legacyActivationResultHtml(lc, cfg, 'es').html)
        }
      }
    }
  }
})

test('rangos raros que el original acepta (fin NaN, inicio >= total) no rompen la vista', () => {
  const sheet = repSheets[0]!
  const ranges: TimeRange[] = [
    { active: true, start: 0, end: Number.NaN },
    { active: true, start: sheet.legacy.totalRows + 50, end: null },
  ]
  for (const timeRange of ranges) {
    const v = computeView(sheet.legacy, { ...initialConfig(), timeRange }, FACTORY_DEFAULTS, 'es')
    expect(v.labels).toEqual([])
    expect(v.allInRange).toBe(false)
    expect(v.result.variant).toBe('fail')
  }
})

test('eje Y: 80 como el original y crece si los datos lo superan', () => {
  const sheet = repSheets[0]!
  const v = computeView(sheet.legacy, initialConfig(), FACTORY_DEFAULTS, 'es')
  const first = sheet.legacy.columns[0] as (number | null)[]
  const hot = { totalRows: sheet.legacy.totalRows as number, columns: [first.map((x, i) => (i === 3 ? 91.2 : x))] }
  const h = computeView(hot, initialConfig(), FACTORY_DEFAULTS, 'es')
  expect(h.yMax).toBe(92)
  expect(h.yMin).toBe(Math.floor((first[0] ?? 0) * 0.95))
  expect(v.yMax).toBeGreaterThanOrEqual(80)
})

test('A8/A10: con rango activo, duración y activación son relativas al rango y usan solo sus datos', () => {
  const sheet = repSheets.find((r) => r.name === 'plain')!
  const tr: TimeRange = { active: true, start: 10, end: 90 }
  const v = computeView(sheet.legacy, { ...initialConfig(), timeRange: tr }, FACTORY_DEFAULTS, 'es')
  const { lc } = calcOf(sheet.legacy, 'waterbase', { active: false, start: 0, end: null })
  expect(v.kpis.duration).toBe('80s')
  expect(v.kpis.activation).toBe(`t=${(lc.activationStart as number) - 10}s`)
  expect(v.activationStart).toBe(lc.activationStart)
  const inRange = sheet.legacy.columns.flatMap((c) => c.slice(10, 90)).filter((x): x is number => x !== null)
  expect(v.kpis.max).toBe(`${Math.max(...inRange).toFixed(1)}°`)
})

test('A10: un termopar oculto no cuenta en mínimo, máximo ni activación', () => {
  const columns = [Array.from({ length: 60 }, () => 60), Array.from({ length: 60 }, () => 20)]
  const data = { columns, totalRows: 60 }
  const all = computeView(data, initialConfig(), FACTORY_DEFAULTS, 'es')
  expect(all.activationStart).toBeNull()
  const hidden = computeView(data, { ...initialConfig(), tcVisibility: [true, false] }, FACTORY_DEFAULTS, 'es')
  expect([hidden.activationStart, hidden.kpis.min, hidden.kpis.max]).toEqual([0, '60.0°', '60.0°'])
})

test('A9: la ventana se valida con las 31 muestras de la caja y, si pasa del final, es NOK e incompleta', () => {
  const data = { columns: [Array.from({ length: 30 }, () => 60)], totalRows: 30 } // 0..29: faltan muestras
  const short = computeView(data, initialConfig(), FACTORY_DEFAULTS, 'es')
  expect([short.windowComplete, short.allInRange, short.result.bodyKey]).toEqual([false, false, 'resultIncomplete'])
  const exact = computeView({ columns: [Array.from({ length: 31 }, () => 60)], totalRows: 31 }, initialConfig(), FACTORY_DEFAULTS, 'es')
  expect([exact.windowComplete, exact.allInRange]).toEqual([true, true])
  const col31 = Array.from({ length: 31 }, (_, i) => (i === 30 ? 90 : 60)) // la muestra 31 se sale del rango
  expect(computeView({ columns: [col31], totalRows: 31 }, initialConfig(), FACTORY_DEFAULTS, 'es').allInRange).toBe(false)
})

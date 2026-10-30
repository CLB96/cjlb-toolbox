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
        expect(v.kpis).toEqual(stats)
        expect(v.labels).toEqual(lc.labels)
        expect([v.yMin, v.activationEnd, v.allInRange]).toEqual([lc.yMin, lc.activationEnd, lc.allInRange])
        expect(v.yMax).toBeGreaterThanOrEqual(lc.yMax) // 80 del original o más (mejora A11)
        const html = `<div class="result-title">${T('es', v.result.titleKey)}</div>${T('es', v.result.bodyKey, ...v.result.args)}`
        expect(html).toBe(legacyActivationResultHtml(lc, cfg, 'es').html)
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

import { legacyActivationResultHtml, legacyStatsTexts } from '../../../legacy-fixtures/bondline/legacyReference'
import { initialConfig } from './store'
import { computeView } from './useBondlineView'
import { ADHESIVES, T, calcOf, rangesFor, validSheets } from './logic/testHelpers'
import { FACTORY_DEFAULTS, type TimeRange } from './logic/types'

describe.each(validSheets.map((s) => [s.name, s] as const))('%s', (_name, sheet) => {
  for (const adhesive of ADHESIVES) {
    for (const { name, tr } of rangesFor(sheet.legacy)) {
      test(`${adhesive} · ${name}: KPIs, caja y ejes como el original`, () => {
        const config = { ...initialConfig(), adhesive, timeRange: tr }
        const v = computeView(sheet.legacy, config, FACTORY_DEFAULTS, 'es')
        const { lc, cfg } = calcOf(sheet.legacy, adhesive, tr)
        const { activationLabel: _l, ...stats } = legacyStatsTexts(lc, 'es')
        expect(v.kpis).toEqual(stats)
        expect(v.labels).toEqual(lc.labels)
        expect([v.yMin, v.yMax, v.activationEnd, v.allInRange]).toEqual([lc.yMin, lc.yMax, lc.activationEnd, lc.allInRange])
        const html = `<div class="result-title">${T('es', v.result.titleKey)}</div>${T('es', v.result.bodyKey, ...v.result.args)}`
        expect(html).toBe(legacyActivationResultHtml(lc, cfg, 'es').html)
      })
    }
  }
})

test('rangos raros que el original acepta (fin NaN, inicio >= total) no rompen la vista', () => {
  const sheet = validSheets[0]!
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

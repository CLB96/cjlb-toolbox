// Differential: the new logic (src/tools/capaflow/logic) against the verbatim copy of the original.
import { describe, expect, it } from 'vitest'
import {
  analysisErrorMessage,
  autoCCType,
  buildBoxPlot,
  buildControlChartExport,
  buildControlChartScreen,
  buildHistogram,
  buildInterpretation,
  buildInterpretationPlain,
  buildQQ,
  buildRunChart,
  classifyCpk,
  colorForCpk,
  controlChartYExtent,
  fmt,
  fmtN,
  getSPCConstants,
  label,
  LABELS,
  makeSubgroups,
  runAnalysis,
  runChartNote,
  sigmaBarWidth,
  sigmaTooltipClass,
  summaryCpkColor,
  weViolations,
  type AnalysisResult,
  type CCType,
  type Lang,
} from '../../src/tools/capaflow/logic'
import { SAMPLE_DATA as NEW_SAMPLE } from '../../src/tools/capaflow/logic/sample'
import { FIXTURE_NAMES, FIXTURES } from './fixtures'
import {
  LEGACY_LABELS,
  SAMPLE_DATA,
  legacyAlertMessage,
  legacyAutoCCType,
  legacyBoxPlot,
  legacyBuildCCExport,
  legacyBuildCCScreen,
  legacyBuildInterpretation,
  legacyBuildInterpretationPlain,
  legacyCCYExtent,
  legacyClassifyCpk,
  legacyColorForCpk,
  legacyFmt,
  legacyFmtN,
  legacyGetSPCConstants,
  legacyHistogram,
  legacyMakeSubgroups,
  legacyQQ,
  legacyRunAnalysis,
  legacyRunChart,
  legacyRunNote,
  legacySigmaBarW,
  legacySigmaTooltipClass,
  legacySummaryCpkColor,
  legacyWeViolations,
  type LegacyResult,
} from './legacyReference'

const LANGS: Lang[] = ['es', 'en']
const CC_TYPES: CCType[] = ['imr', 'xr', 'xs']

function both(name: string): { r: AnalysisResult; l: LegacyResult } | null {
  const f = FIXTURES[name]
  const n = runAnalysis(f)
  const l = legacyRunAnalysis(f.raw, f.lsl, f.usl, f.target, f.subgroupSize, f.pointName)
  if ('error' in l) return null
  if (!n.ok) throw new Error(`new port failed where legacy succeeded: ${name}`)
  return { r: n.result, l }
}

const VALID = FIXTURE_NAMES.filter((n) => both(n) !== null)
const pair = (name: string) => both(name)!

// One test per concern: loops over the fixtures (the failing fixture shows in the diff).
const eachValid = (title: string, fn: (name: string) => void) => it(title, () => { for (const n of VALID) fn(n) })
const eachFixture = (title: string, fn: (name: string) => void) => it(title, () => { for (const n of FIXTURE_NAMES) fn(n) })

describe('analysis (runAnalysis)', () => {
  eachFixture('same result object (or same error) for every fixture', (name) => {
    const f = FIXTURES[name]
    const n = runAnalysis(f)
    const l = legacyRunAnalysis(f.raw, f.lsl, f.usl, f.target, f.subgroupSize, f.pointName)
    if ('error' in l) {
      expect(n).toEqual({ ok: false, error: l.error })
    } else {
      expect(n).toEqual({ ok: true, result: l })
    }
  })

  it('validation errors and their alert texts', () => {
    const few = runAnalysis({ ...FIXTURES.sample, raw: '1 2 3 4' })
    const none = runAnalysis({ ...FIXTURES.sample, lsl: '', usl: '' })
    expect(few).toEqual({ ok: false, error: 'minData' })
    expect(none).toEqual({ ok: false, error: 'noLimit' })
    for (const lang of LANGS) {
      for (const code of ['minData', 'noLimit'] as const) {
        expect(analysisErrorMessage(code, lang)).toBe(legacyAlertMessage(code, lang))
      }
    }
  })
})

describe('classification, formatting and labels', () => {
  const values = [0, 0.99, 1, 1.329, 1.33, 1.6699, 1.67, 2.5]
  it('classifyCpk / colorForCpk / summary color on every threshold', () => {
    for (const v of values) {
      for (const lang of LANGS) expect(classifyCpk(v, lang)).toEqual(legacyClassifyCpk(v, lang))
      expect(colorForCpk(v)).toBe(legacyColorForCpk(v))
      expect(summaryCpkColor(v)).toBe(legacySummaryCpkColor(v))
    }
    expect(summaryCpkColor(null)).toBe(legacySummaryCpkColor(null))
  })
  it('sigma tooltip classes', () => {
    for (const s of [0, 2.99, 3, 3.99, 4, 4.99, 5, 6]) expect(sigmaTooltipClass(s)).toBe(legacySigmaTooltipClass(s))
  })
  it('fmt / fmtN / sigma bar', () => {
    for (const v of [null, NaN, 0, 1.23456, 1234567.89, Infinity]) {
      expect(fmt(v)).toBe(legacyFmt(v))
      expect(fmt(v, 4)).toBe(legacyFmt(v, 4))
      expect(fmtN(v)).toBe(legacyFmtN(v))
    }
    for (const v of [null, 0, 3, 6, 9]) expect(sigmaBarWidth(v)).toBe(legacySigmaBarW(v))
  })
  it('labels are the verbatim dictionary subset', () => {
    expect(LABELS).toEqual(LEGACY_LABELS)
    expect(label('es', 'no.such.key')).toBe('no.such.key')
  })
  it('sample data constant matches the original string', () => {
    expect(NEW_SAMPLE).toBe(SAMPLE_DATA)
  })
})

describe('interpretation text', () => {
  eachValid('screen and plain text in both languages', (name) => {
    const { r, l } = pair(name)
    for (const lang of LANGS) {
      const es = lang === 'es'
      expect(buildInterpretation(r, es)).toBe(legacyBuildInterpretation(l, es))
      expect(buildInterpretationPlain(r, es)).toEqual(legacyBuildInterpretationPlain(l, es))
    }
  })
})

describe('histogram and normal curve', () => {
  eachValid('histogram bins, counts and curve', (name) => {
    const { r, l } = pair(name)
    expect(buildHistogram(r)).toEqual(legacyHistogram(l))
  })
})

describe('run chart', () => {
  eachValid('screen and PNG variants', (name) => {
    const { r, l } = pair(name)
    expect(buildRunChart(r, 'screen')).toEqual(legacyRunChart(l, 'screen'))
    expect(buildRunChart(r, 'png')).toEqual(legacyRunChart(l, 'png'))
  })
  it('run count note in both languages', () => {
    for (const lang of LANGS) expect(runChartNote(7, 9, lang)).toBe(legacyRunNote(7, 9, lang))
  })
})

describe('Q-Q plot and box plot', () => {
  eachValid('Q-Q points, band and axis ranges', (name) => {
    const { r, l } = pair(name)
    const { probit: _probit, ...legacyQq } = legacyQQ(l)
    expect(buildQQ(r)).toEqual(legacyQq)
  })
  eachValid('quartiles, fences, whiskers, outliers', (name) => {
    const { r, l } = pair(name)
    expect(buildBoxPlot(r)).toEqual(legacyBoxPlot(l))
  })
})

describe('SPC constants and Western Electric rules', () => {
  it('constants for every n from 1 to 30 (tabulated, interpolated, fallback)', () => {
    for (let n = 1; n <= 30; n++) expect(getSPCConstants(n)).toEqual(legacyGetSPCConstants(n))
  })
  it('auto chart type', () => {
    for (const n of [1, 2, 9, 10, 25]) expect(autoCCType(n)).toBe(legacyAutoCCType(n))
  })
  it('subgroup builder drops the partial last group', () => {
    const data = [1, 2, 3, 4, 5, 6, 7]
    for (const n of [0, 1, 2, 3, 7, 8]) expect(makeSubgroups(data, n)).toEqual(legacyMakeSubgroups(data, n))
  })
  it('weViolations on trends, shifts, 2-of-3 and the documented rule-2 quirk', () => {
    const cases: [number[], number, number][] = [
      [[1, 2, 3, 4, 5, 6, 7, 8], 0, 10],
      [[2.1, 2.2, 0], 0, 1],
      [[1, 1, 1, 1, 1, 1, 1, 1, 1, -1], 0, 5],
      [[0, 0, 4, 0, 0, -3.5, 0], 0, 1],
      [[], 0, 1],
    ]
    for (const [pts, cl, sigma] of cases) expect(weViolations(pts, cl, sigma)).toEqual(legacyWeViolations(pts, cl, sigma))
    expect(weViolations([2.1, 2.2, 0], 0, 1)).toEqual([0, 1, 2])
  })
})

describe('control charts', () => {
  eachValid('screen builder for auto and every forced type', (name) => {
    const { r, l } = pair(name)
    for (const lang of LANGS) {
      expect(buildControlChartScreen(r, undefined, lang)).toEqual(legacyBuildCCScreen(l, undefined, lang))
      expect(buildControlChartScreen(r, 'auto', lang)).toEqual(legacyBuildCCScreen(l, 'auto', lang))
      for (const t of CC_TYPES) expect(buildControlChartScreen(r, t, lang)).toEqual(legacyBuildCCScreen(l, t, lang))
    }
  })
  eachValid('export builder for every type and its y extent', (name) => {
    const { r, l } = pair(name)
    const n = r.subgroupSize
    for (const t of CC_TYPES) {
      const mine = buildControlChartExport(r, n, t, 'es')
      expect(mine).toEqual(legacyBuildCCExport(l, n, t, 'es'))
      expect(controlChartYExtent(mine.topPts, mine.topCL, mine.topUCL, mine.topLCL)).toEqual(
        legacyCCYExtent(mine.topPts, mine.topCL, mine.topUCL, mine.topLCL),
      )
      expect(controlChartYExtent(mine.botPts, mine.botCL, mine.botUCL, mine.botLCL)).toEqual(
        legacyCCYExtent(mine.botPts, mine.botCL, mine.botUCL, mine.botLCL),
      )
    }
  })
})

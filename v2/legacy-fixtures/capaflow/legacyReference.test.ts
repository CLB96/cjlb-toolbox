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
  if ('error' in l || CHANGED.includes(name)) return null
  if (!n.ok) throw new Error(`new port failed where legacy succeeded: ${name}`)
  return { r: n.result, l }
}

// Fixtures whose behavior changed on purpose (A3 subgroup > data, A4 constant data): asserted explicitly below.
const CHANGED = ['subgroupTooBig', 'constant']

const VALID = FIXTURE_NAMES.filter((n) => both(n) !== null)
const pair = (name: string) => both(name)!

// One test per concern: loops over the fixtures (the failing fixture shows in the diff).
const eachValid = (title: string, fn: (name: string) => void) => it(title, () => { for (const n of VALID) fn(n) })
const eachFixture = (title: string, fn: (name: string) => void) => it(title, () => { for (const n of FIXTURE_NAMES.filter((x) => !CHANGED.includes(x))) fn(n) })

describe('analysis (runAnalysis)', () => {
  eachFixture('same result (or same error) for every fixture, except Cmk (A6), alpha (A8) and two-sided PPM (A1)', (name) => {
    const f = FIXTURES[name]
    const n = runAnalysis(f)
    const l = legacyRunAnalysis(f.raw, f.lsl, f.usl, f.target, f.subgroupSize, f.pointName)
    if ('error' in l) {
      expect(n).toEqual({ ok: false, error: l.error })
    } else {
      if (!n.ok) throw new Error(name)
      const { Cmk: _cmk, ppm, ppmOverall, ...rest } = l
      const { alpha, ppm: nPpm, ppmOverall: nPpmO, ...nRest } = n.result
      expect(nRest).toEqual(rest)
      expect(alpha).toBe(0.05)
      if (l.hasBoth) {
        // A1: real upper + lower tails; never more than the old double-counted near tail.
        expect(nPpm as number).toBeLessThanOrEqual((ppm as number) + 1e-9)
        expect(nPpmO as number).toBeLessThanOrEqual((ppmOverall as number) + 1e-9)
      } else {
        expect([nPpm, nPpmO]).toEqual([ppm, ppmOverall])
      }
    }
  })

  it('A2-A4: invalid limits, Infinity, constant data and subgroup bounds', () => {
    expect(runAnalysis({ ...FIXTURES.sample, lsl: '74.05', usl: '73.95' })).toEqual({ ok: false, error: 'badLimits' })
    expect(runAnalysis({ ...FIXTURES.sample, usl: '74.05', lsl: '74.05' })).toEqual({ ok: false, error: 'badLimits' })
    expect(runAnalysis({ ...FIXTURES.sample, raw: '1 2 3 4 5 Infinity' })).toEqual({ ok: false, error: 'infinite' })
    expect(runAnalysis(FIXTURES.constant)).toEqual({ ok: false, error: 'noVariation' })
    const big = runAnalysis(FIXTURES.subgroupTooBig)
    if (!big.ok) throw new Error('expected ok')
    expect(big.result.subgroupSize).toBe(5)
    expect(big.result.sWithin).not.toBeNaN()
    expect(big.warnings).toEqual(['subgroupClamped'])
    const huge = runAnalysis({ ...FIXTURES.sample, subgroupSize: '40' })
    if (!huge.ok) throw new Error('expected ok')
    expect(huge.result.subgroupSize).toBe(25)
    expect(analysisErrorMessage('badLimits', 'en')).toMatch(/USL/)
  })

  it('A8: the confidence field sets alpha (95 reproduces the fixed 0.05)', () => {
    const at = (confidence: string) => {
      const o = runAnalysis({ ...FIXTURES.sample, confidence })
      if (!o.ok) throw new Error('expected ok')
      return o
    }
    expect(at('95').result.alpha).toBe(0.05)
    const p = at('95').result.adTest.p
    expect(at(String(100 - 100 * Math.min(2 * p, 0.9))).result.isNormal).toBe(false) // alpha = 2p
    expect(at(String(100 - 50 * p)).result.isNormal).toBe(true) // alpha = p / 2
    expect(at('abc').warnings).toEqual(['confidenceInvalid'])
    expect(at('90').result.alpha).toBeCloseTo(0.1, 12)
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
  it('sigma tooltip classes use the Cpk classification and the language (A15)', () => {
    for (const s of [0, 2.9, 3, 3.5, 4, 4.5, 6]) expect(sigmaTooltipClass(s, 'es')).toBe(legacySigmaTooltipClass(s))
    // 5 sigma is Cpk 1.667 < 1.67: the old 5/4/3 thresholds rounded it up to World Class.
    expect(sigmaTooltipClass(5, 'es')).toBe('Capaz')
    expect(sigmaTooltipClass(4.5, 'en')).toBe('Capable')
  })
  it('fmt / fmtN / sigma bar', () => {
    for (const v of [null, NaN, 0, 1.23456, 1234567.89, Infinity]) {
      expect(fmt(v)).toBe(legacyFmt(v))
      expect(fmt(v, 4)).toBe(legacyFmt(v, 4))
      expect(fmtN(v, 'en')).toBe(legacyFmtN(v))
      expect(fmtN(v, 'es')).toBe(legacyFmtN(v))
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
      // The plain text prints the PPM, which A1 changes for two-sided specs.
      expect(buildInterpretationPlain(r, es)).toEqual(legacyBuildInterpretationPlain({ ...l, ppm: r.ppm, ppmOverall: r.ppmOverall }, es))
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
  eachValid('all data, global median and the standard runs test (A11, A12)', (name) => {
    const { r, l } = pair(name)
    const png = legacyRunChart(l, 'png')
    const m = buildRunChart(r)
    expect({ data: m.data, N: m.N, med: m.med, yMin: m.yMin, yMax: m.yMax }).toEqual({ data: png.data, N: png.N, med: png.med, yMin: png.yMin, yMax: png.yMax })
    expect(m.n1 + m.n2).toBe(r.data.filter((v) => v !== r.med).length)
    expect(m.expectedRuns).toBeCloseTo(1 + (2 * m.n1 * m.n2) / (m.n1 + m.n2), 12)
    expect(m.runs).toBeGreaterThanOrEqual(m.n1 && m.n2 ? 2 : 1)
  })
  it('run count note in both languages (A11: standard runs test text)', () => {
    for (const lang of LANGS) {
      const note = runChartNote(7, 9.25, lang)
      expect(note.startsWith(legacyRunNote(7, 9, lang).split('|')[0]!)).toBe(true)
      expect(note).toContain('~9.3')
      expect(note).not.toContain('(2n-1)/3')
    }
  })
})

describe('Q-Q plot and box plot', () => {
  eachValid('Q-Q points, band and axis ranges', (name) => {
    const { r, l } = pair(name)
    const { probit: _probit, ...legacyQq } = legacyQQ(l)
    const m = buildQQ(r)
    // A13: X = theoretical, Y = observed (the legacy screen had them swapped); band and se unchanged at 95 %.
    expect(m.pts).toEqual(legacyQq.pts)
    expect([m.se, m.bandHalf]).toEqual([legacyQq.se, legacyQq.bandHalf])
    expect([m.xMin, m.xMax, m.xPad]).toEqual([legacyQq.yMin, legacyQq.yMax, legacyQq.yPad])
    expect([m.yMin, m.yMax, m.yPad]).toEqual([legacyQq.xMin, legacyQq.xMax, legacyQq.xPad])
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
      [[1, 1, 1, 1, 1, 1, 1, 1, 1, -1], 0, 5],
      [[0, 0, 4, 0, 0, -3.5, 0], 0, 1],
      [[], 0, 1],
    ]
    for (const [pts, cl, sigma] of cases) expect(weViolations(pts, cl, sigma)).toEqual(legacyWeViolations(pts, cl, sigma))
    // A9: the current point is marked only when it is itself beyond 2 sigma (the legacy gave [0, 1, 2]).
    expect(weViolations([2.1, 2.2, 0], 0, 1)).toEqual([])
    expect(weViolations([2.1, 2.2, 2.3], 0, 1)).toEqual([0, 1, 2])
    expect(weViolations([-2.1, 0, -2.2], 0, 1)).toEqual([0, 2])
  })
})

type Viol = { topViol: number[]; topOOC: number; botViol: number[]; botOOC: number }

/** Same chart as the legacy one except the Western Electric marks: A9 can only remove rule-2 marks (never add). */
function expectSameChart(mine: Viol, legacy: Viol): void {
  const { topViol, topOOC, botViol, botOOC, ...rest } = mine
  const { topViol: lt, topOOC: _lto, botViol: lb, botOOC: _lbo, ...legacyRest } = legacy
  expect(rest).toEqual(legacyRest)
  expect(topViol.every((i) => lt.includes(i))).toBe(true)
  expect(botViol.every((i) => lb.includes(i))).toBe(true)
  expect([topOOC, botOOC]).toEqual([topViol.length, botViol.length])
}

describe('control charts', () => {
  eachValid('screen builder for auto and every forced type', (name) => {
    const { r, l } = pair(name)
    for (const lang of LANGS) {
      expectSameChart(buildControlChartScreen(r, undefined, lang), legacyBuildCCScreen(l, undefined, lang))
      expectSameChart(buildControlChartScreen(r, 'auto', lang), legacyBuildCCScreen(l, 'auto', lang))
      for (const t of CC_TYPES) expectSameChart(buildControlChartScreen(r, t, lang), legacyBuildCCScreen(l, t, lang))
    }
  })
  eachValid('export builder for every type and its y extent', (name) => {
    const { r, l } = pair(name)
    const n = r.subgroupSize
    for (const t of CC_TYPES) {
      const mine = buildControlChartExport(r, n, t, 'es')
      expectSameChart(mine, legacyBuildCCExport(l, n, t, 'es'))
      for (const [pts, cl, ucl, lcl] of [
        [mine.topPts, mine.topCL, mine.topUCL, mine.topLCL],
        [mine.botPts, mine.botCL, mine.botUCL, mine.botLCL],
      ] as const) {
        const ext = controlChartYExtent(pts, cl, ucl, lcl)
        if (!(lcl < 0)) expect(ext).toEqual(legacyCCYExtent(pts, cl, ucl, lcl))
        else expect(ext!.yMin).toBeLessThan(lcl) // A14: a negative LCL is inside the extent
      }
    }
  })
})

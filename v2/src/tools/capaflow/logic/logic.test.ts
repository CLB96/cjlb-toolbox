// Ground truth of the original tool with its sample data, plus a few rules asserted directly.
import { describe, expect, it } from 'vitest'
import {
  buildBoxPlot,
  buildControlChartScreen,
  buildHistogram,
  buildInterpretation,
  buildRunChart,
  fmt,
  parseData,
  runAnalysis,
  SAMPLE_DATA,
  SAMPLE_INPUT,
  type AnalysisResult,
} from './index'

function sample(over: Partial<typeof SAMPLE_INPUT> = {}): AnalysisResult {
  const o = runAnalysis({ ...SAMPLE_INPUT, ...over })
  if (!o.ok) throw new Error(o.error)
  return o.result
}

describe('sample data ground truth (as displayed by the original)', () => {
  const r = sample()
  it.each([
    ['Cpk', r.Cpk, '1.629', 3],
    ['Cp', r.Cp, '1.668', 3],
    ['Cpu', r.Cpu, '1.629', 3],
    ['Cpl', r.Cpl, '1.707', 3],
    ['Cpm', r.Cpm, '1.623', 3],
    ['Cmk', r.Cmk, '1.629', 3],
    ['Pp', r.Pp, '1.634', 3],
    ['Ppk', r.Ppk, '1.596', 3],
    ['Ppu', r.Ppu, '1.596', 3],
    ['Ppl', r.Ppl, '1.673', 3],
    ['mean', r.xBar, '74.0012', 4],
    ['median', r.med, '74.0010', 4],
    ['s overall', r.sOverall, '0.0102', 4],
    ['sigma within', r.sWithin, '0.0100', 4],
    ['min', r.minV, '73.9670', 4],
    ['max', r.maxV, '74.0300', 4],
    ['range', r.range, '0.0630', 4],
  ])('%s = %s', (_name, value, shown, digits) => {
    expect(fmt(value, digits)).toBe(shown)
  })
  it('PPM, n and parsed length', () => {
    expect(Math.round(r.ppm as number)).toBe(1)
    expect(Math.round(r.ppmOverall as number)).toBe(2)
    expect(r.N).toBe(125)
    expect(parseData(SAMPLE_DATA)).toHaveLength(125)
  })
  it('interpretation text for the sample (es)', () => {
    expect(buildInterpretation(r, true)).toContain(
      '✅ <strong>Proceso Capaz.</strong> Cpk de 1.629 cumple el estándar Six Sigma (≥1.33). Proceso bajo control con buena capacidad.',
    )
  })
})

describe('behaviors worth pinning', () => {
  it('parser keeps numeric prefixes and treats comma as separator', () => {
    expect(parseData('1.5 2abc nope 3,14')).toEqual([1.5, 2, 3, 14])
  })
  it('one-sided specs: Cp/Pp/Cpm stay null and PPM uses the failing tail', () => {
    const r = sample({ lsl: '' })
    expect([r.Cp, r.Pp, r.Cpm, r.Cpl]).toEqual([null, null, null, null])
    expect(r.Cpk).toBe(r.Cpu)
  })
  it('Cmk is an alias of Cpk', () => {
    const r = sample()
    expect(r.Cmk).toBe(r.Cpk)
  })
  it('subgroup falls back to 1 when empty or zero', () => {
    expect(sample({ subgroupSize: '' }).subgroupSize).toBe(1)
    expect(sample({ subgroupSize: '0' }).subgroupSize).toBe(1)
  })
  it('chart models: 125 points give 12 bins, 25-point run window, 5 subgroup X-bar/R', () => {
    const r = sample()
    expect(buildHistogram(r).bins).toBe(12)
    expect(buildHistogram(r).curve).toHaveLength(181)
    const rc = buildRunChart(r, 'screen')
    expect([rc.N, rc.startIndex]).toEqual([25, 100])
    expect(buildBoxPlot(r).outliers).toContain(73.967)
    const cc = buildControlChartScreen(r, 'auto', 'es')
    expect(cc.chartType).toBe('xr')
    expect(cc.topPts).toHaveLength(25)
  })
})

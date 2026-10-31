import { label } from './labels'
import { getSPCConstants, makeSubgroups, weViolations } from './spc'
import { mean, stddev } from './stats'
import type { AnalysisResult, CCType, CCTypeChoice, ControlChart, Lang } from './types'

/** Automatic chart type: n<=1 I-MR, n<10 X̄-R, otherwise X̄-S. */
export function autoCCType(n: number): CCType {
  if (n <= 1) return 'imr'
  if (n < 10) return 'xr'
  return 'xs'
}

type Core = Omit<ControlChart, 'topViol' | 'topOOC' | 'botViol' | 'botOOC'>

function movingRanges(data: number[]): number[] {
  return data.map((v, i) => (i === 0 ? null : Math.abs(v - data[i - 1]))).filter((v) => v !== null) as number[]
}

function imr(data: number[], lang: Lang): Core {
  const topCL = mean(data)
  const mr = movingRanges(data)
  const mrBar = mean(mr)
  const sigmaI = mrBar / 1.128
  return {
    topPts: data, topCL, topUCL: topCL + 3 * sigmaI, topLCL: topCL - 3 * sigmaI, topSigma: sigmaI,
    topLabel: `I — ${label(lang, 'cc.individuals')}`,
    botPts: [null, ...mr], botCL: mrBar, botUCL: 3.267 * mrBar, botLCL: 0, botSigma: mrBar / 3.267,
    botLabel: `MR — ${label(lang, 'cc.movingRange')}`,
  }
}

function xr(groups: number[][], n: number, lang: Lang): Core {
  const C = getSPCConstants(Math.max(2, Math.min(25, n <= 1 ? 2 : n)))
  const xbars = groups.map((g) => mean(g))
  const ranges = groups.map((g) => Math.max(...g) - Math.min(...g))
  const xDblBar = mean(xbars)
  const rBar = mean(ranges)
  return {
    topPts: xbars, topCL: xDblBar, topUCL: xDblBar + C.A2 * rBar, topLCL: xDblBar - C.A2 * rBar,
    topSigma: (C.A2 * rBar) / 3, topLabel: `X̄ — ${label(lang, 'cc.means')} (n=${n})`,
    botPts: ranges, botCL: rBar, botUCL: C.D4 * rBar, botLCL: C.D3 * rBar,
    botSigma: ((C.D4 - C.D3) * rBar) / 6, botLabel: `R — ${label(lang, 'cc.ranges')} (n=${n})`,
  }
}

function xs(groups: number[][], n: number, lang: Lang): Core {
  const C = getSPCConstants(Math.max(2, Math.min(25, n <= 1 ? 2 : n)))
  const xbars = groups.map((g) => mean(g))
  const stdevs = groups.map((g) => stddev(g))
  const xDblBar = mean(xbars)
  const sBar = mean(stdevs)
  return {
    topPts: xbars, topCL: xDblBar, topUCL: xDblBar + C.A3 * sBar, topLCL: xDblBar - C.A3 * sBar,
    topSigma: (C.A3 * sBar) / 3, topLabel: `X̄ — ${label(lang, 'cc.means')} (n=${n})`,
    botPts: stdevs, botCL: sBar, botUCL: C.B4 * sBar, botLCL: C.B3 * sBar,
    botSigma: ((C.B4 - C.B3) * sBar) / 6, botLabel: `S — ${label(lang, 'cc.stddevBot')} (n=${n})`,
  }
}

function core(r: AnalysisResult, n: number, type: CCType, lang: Lang): Core {
  if (type === 'imr') return imr(r.data, lang)
  const groups = makeSubgroups(r.data, n <= 1 ? 1 : n)
  return type === 'xr' ? xr(groups, n, lang) : xs(groups, n, lang)
}

function withViolations(c: Core, botSigmaForRules: number): ControlChart {
  const topViol = weViolations(c.topPts.filter((v) => v !== null), c.topCL, c.topSigma)
  const botViol = weViolations(c.botPts.filter((v) => v !== null) as number[], c.botCL, botSigmaForRules)
  return { ...c, topViol, topOOC: topViol.length, botViol, botOOC: botViol.length }
}

export interface ScreenControlChart extends ControlChart {
  chartType: CCType
  noteText: string
}

/** Note under the charts: constants substituted one %s / %.3f at a time, like the original. */
function ccNote(type: CCType, n: number, lang: Lang): string {
  if (type === 'imr') return label(lang, 'cc.noteIMR')
  const C = getSPCConstants(Math.max(2, Math.min(25, n <= 1 ? 2 : n)))
  const f = type === 'xr' ? [C.A2, C.D3, C.D4] : [C.A3, C.B3, C.B4]
  return label(lang, type === 'xr' ? 'cc.noteXR' : 'cc.noteXS')
    .replace('%s', String(n)).replace('%.3f', f[0].toFixed(3))
    .replace('%.3f', f[1].toFixed(3)).replace('%.3f', f[2].toFixed(3))
}

/** On-screen builder: bottom-chart rules use sigma clamped to >= 1e-10. */
export function buildControlChartScreen(r: AnalysisResult, choice: CCTypeChoice | undefined, lang: Lang): ScreenControlChart {
  const n = r.subgroupSize || 1
  const chartType = !choice || choice === 'auto' ? autoCCType(n) : choice
  const c = core(r, n, chartType, lang)
  return { ...withViolations(c, Math.max(c.botSigma, 1e-10)), chartType, noteText: ccNote(chartType, n, lang) }
}

/** Executive-PNG builder: bottom-chart rules use sigma, or CL/3 (or 0.001) when sigma is not positive. */
export function buildControlChartExport(r: AnalysisResult, n: number, chartType: CCType, lang: Lang): ControlChart {
  const c = core(r, n, chartType, lang)
  return withViolations(c, c.botSigma > 0 ? c.botSigma : c.botCL / 3 || 0.001)
}

/** Vertical extent used to draw one chart; null when fewer than two valid points. */
export function controlChartYExtent(pts: (number | null)[], cl: number, ucl: number, lcl: number) {
  const vals = pts.filter((v) => v !== null) as number[]
  if (vals.length < 2) return null
  const allVals = [...vals, ucl, lcl > 0 ? lcl : 0]
  let yMin = Math.min(...allVals)
  let yMax = Math.max(...allVals)
  const yPad = (yMax - yMin) * 0.15 || Math.abs(cl) * 0.1 || 0.01
  yMin -= yPad
  yMax += yPad
  return { yMin, yMax, count: vals.length }
}

import { label } from './labels'
import { median, quartile, stddev } from './stats'
import type { AnalysisResult, Lang } from './types'

export interface RunChartModel {
  data: number[]
  startIndex: number
  N: number
  med: number
  yMin: number
  yMax: number
  /** Only for the on-screen variant. */
  runs: number | null
  expectedRuns: number | null
}

/** On-screen: last 25 points with their own median. PNG: all data with the full-data median. */
export function buildRunChart(r: AnalysisResult, mode: 'screen' | 'png'): RunChartModel {
  if (mode === 'png') {
    const ext = r.sOverall * 0.5
    return { data: r.data, startIndex: 0, N: r.data.length, med: r.med, yMin: r.minV - ext, yMax: r.maxV + ext, runs: null, expectedRuns: null }
  }
  const maxPoints = 25
  const data = r.data.slice(-maxPoints)
  const startIndex = r.data.length - data.length
  const N = data.length
  const med = median(data)
  let runs = 1
  let currentSide = data[0] > med ? 1 : data[0] < med ? -1 : 0
  for (let i = 1; i < N; i++) {
    const side = data[i] > med ? 1 : data[i] < med ? -1 : 0
    if (side !== 0 && side !== currentSide) {
      runs++
      currentSide = side
    }
  }
  const expectedRuns = Math.round((2 * N - 1) / 3)
  const ext = stddev(data, true) * 0.5
  return { data, startIndex, N, med, runs, expectedRuns, yMin: Math.min(...data) - ext, yMax: Math.max(...data) + ext }
}

export function runChartNote(runs: number, expectedRuns: number, lang: Lang): string {
  const es = lang === 'es'
  return `${label(lang, 'rc.runCount')}: ${runs} | ${label(lang, 'rc.expected')}: ~${expectedRuns} | ` +
    (es ? 'Variación aleatoria esperada si los datos son independientes (aprox. (2n-1)/3).' : 'Random variation expected when data is independent (approx. (2n-1)/3).')
}

/** Beasley-Springer-Moro approximation of the inverse normal CDF. */
export function probit(p: number): number {
  const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637]
  const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833]
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
    0.0276438810333863, 0.0038405729373609, 0.0003951896511349,
    0.0000321767881768, 0.0000002888167364, 0.0000003960315187]
  const q = p - 0.5
  if (Math.abs(q) < 0.42) {
    const r2 = q * q
    return q * (((a[3] * r2 + a[2]) * r2 + a[1]) * r2 + a[0]) / ((((b[3] * r2 + b[2]) * r2 + b[1]) * r2 + b[0]) * r2 + 1)
  }
  const r2 = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p))
  let x = c[0]
  for (let i = 1; i < 9; i++) x += c[i] * Math.pow(r2, i)
  return p < 0.5 ? -x : x
}

export interface QQModel {
  pts: { obs: number; th: number }[]
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  xPad: number
  yPad: number
  se: number
  /** 1.36 * se, the half-width of the fixed "confidence" band (the confidence field is not used). */
  bandHalf: number
}

/** Screen orientation: X = observed, Y = theoretical. */
export function buildQQ(r: AnalysisResult): QQModel {
  const sorted = [...r.data].sort((a, b) => a - b)
  const N = sorted.length
  const mu = r.xBar
  const sigma = r.sOverall
  const pts = sorted.map((v, i) => ({ obs: v, th: mu + sigma * probit((i + 0.5) / N) }))
  const obsVals = pts.map((p) => p.obs)
  const thVals = pts.map((p) => p.th)
  const xMin = Math.min(...obsVals)
  const xMax = Math.max(...obsVals)
  const yMin = Math.min(...thVals)
  const yMax = Math.max(...thVals)
  const xPad = (xMax - xMin) * 0.08 || 0.01
  const yPad = (yMax - yMin) * 0.08 || 0.01
  const se = sigma * Math.sqrt((Math.PI / 2) / N)
  return { pts, xMin, xMax, yMin, yMax, xPad, yPad, se, bandHalf: 1.36 * se }
}

export interface BoxPlotModel {
  Q1: number
  Q2: number
  Q3: number
  IQR: number
  lowerFence: number
  upperFence: number
  outliers: number[]
  minWhisker: number
  maxWhisker: number
  xMin: number
  xMax: number
}

export function buildBoxPlot(r: AnalysisResult): BoxPlotModel {
  const sorted = [...r.data].sort((a, b) => a - b)
  const N = sorted.length
  const Q1 = quartile(sorted, 0.25)
  const Q2 = r.med
  const Q3 = quartile(sorted, 0.75)
  const IQR = Q3 - Q1
  const lowerFence = Q1 - 1.5 * IQR
  const upperFence = Q3 + 1.5 * IQR
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence)
  const inliers = sorted.filter((v) => v >= lowerFence && v <= upperFence)
  const minWhisker = inliers.length > 0 ? Math.min(...inliers) : sorted[0]
  const maxWhisker = inliers.length > 0 ? Math.max(...inliers) : sorted[N - 1]
  const xMin = Math.min(r.minV, !isNaN(r.lsl) ? r.lsl : r.minV) - r.sOverall * 0.5
  const xMax = Math.max(r.maxV, !isNaN(r.usl) ? r.usl : r.maxV) + r.sOverall * 0.5
  return { Q1, Q2, Q3, IQR, lowerFence, upperFence, outliers, minWhisker, maxWhisker, xMin, xMax }
}

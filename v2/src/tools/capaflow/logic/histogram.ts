import { normPDF } from './stats'
import type { AnalysisResult } from './types'

export interface HistogramModel {
  bins: number
  minV: number
  maxV: number
  binW: number
  counts: number[]
  maxC: number
  /** 181 points; y is the fraction (0..0.90) of the plot height. */
  curve: { x: number; y: number }[]
}

/** Binning (8..20 bins, +-0.7 sigma margin) and the overall-sigma normal curve. */
export function buildHistogram(r: AnalysisResult): HistogramModel {
  const data = r.data
  const bins = Math.max(8, Math.min(20, Math.ceil(Math.sqrt(data.length))))
  const ext = r.sOverall * 0.7
  const minV = r.minV - ext
  const maxV = r.maxV + ext
  const binW = (maxV - minV) / bins
  const counts: number[] = new Array(bins).fill(0)
  data.forEach((v) => {
    const i = Math.min(Math.max(Math.floor((v - minV) / binW), 0), bins - 1)
    counts[i]++
  })
  const maxC = Math.max(...counts)
  const maxPDF = normPDF(r.xBar, r.xBar, r.sOverall)
  const curve: { x: number; y: number }[] = []
  for (let i = 0; i <= 180; i++) {
    const xv = minV + (i / 180) * (maxV - minV)
    curve.push({ x: xv, y: (normPDF(xv, r.xBar, r.sOverall) / maxPDF) * 0.9 })
  }
  return { bins, minV, maxV, binW, counts, maxC, curve }
}

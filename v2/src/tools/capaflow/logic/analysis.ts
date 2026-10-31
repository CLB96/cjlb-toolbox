import { andersonDarlingTest } from './normality'
import { mean, median, normCDF, parseData, stddev, withinSigma } from './stats'
import type { AnalysisErrorCode, AnalysisInput, AnalysisOutcome, Lang } from './types'

export function sigmaLevel(cpk: number): number {
  return cpk * 3
}

/** Original alert() texts for the two validation failures. */
export function analysisErrorMessage(code: AnalysisErrorCode, lang: Lang): string {
  return code === 'minData'
    ? lang === 'es' ? 'Necesitas al menos 5 datos.' : 'Need at least 5 data points.'
    : lang === 'es' ? 'Ingresa al menos un límite de especificación.' : 'Enter at least one specification limit.'
}

/**
 * Port of runAnalysis' calculation part. Inputs are the raw field strings, as in the original form.
 * Two-sided PPM uses both tails of the single Cpk/Ppk distance (original behavior, see mejoras doc).
 */
export function runAnalysis(input: AnalysisInput): AnalysisOutcome {
  const data = parseData(input.raw)
  if (data.length < 5) return { ok: false, error: 'minData' }
  const lsl = parseFloat(input.lsl)
  const usl = parseFloat(input.usl)
  const targetVal = parseFloat(input.target)
  const n = parseInt(input.subgroupSize) || 1
  const pointName = input.pointName.trim()
  const hasLSL = !isNaN(lsl)
  const hasUSL = !isNaN(usl)
  const hasBoth = hasLSL && hasUSL
  if (!hasLSL && !hasUSL) return { ok: false, error: 'noLimit' }

  const xBar = mean(data)
  const sOverall = stddev(data)
  const sWithin = withinSigma(data, n)
  const N = data.length
  const minV = Math.min(...data)
  const maxV = Math.max(...data)
  const med = median(data)
  const range = maxV - minV
  const adTest = andersonDarlingTest(data)
  const isNormal = adTest.p >= 0.05
  const tolerance = hasBoth ? usl - lsl : null
  const Cp = tolerance !== null ? tolerance / (6 * sWithin) : null
  const Pp = tolerance !== null ? tolerance / (6 * sOverall) : null
  const Cpu = hasUSL ? (usl - xBar) / (3 * sWithin) : null
  const Cpl = hasLSL ? (xBar - lsl) / (3 * sWithin) : null
  const Ppu = hasUSL ? (usl - xBar) / (3 * sOverall) : null
  const Ppl = hasLSL ? (xBar - lsl) / (3 * sOverall) : null
  const Cpk = Cpu !== null && Cpl !== null ? Math.min(Cpu, Cpl) : Cpu !== null ? Cpu : Cpl
  const Ppk = Ppu !== null && Ppl !== null ? Math.min(Ppu, Ppl) : Ppu !== null ? Ppu : Ppl
  let Cpm: number | null = null
  if (tolerance !== null && !isNaN(targetVal)) {
    const tau = Math.sqrt(sOverall ** 2 + (xBar - targetVal) ** 2)
    Cpm = tolerance / (6 * tau)
  }
  const Cmk = Cpk
  const sigLvl = Cpk !== null ? sigmaLevel(Cpk) : null
  const ppmFromCpk = (cpkV: number | null): number | null => {
    if (cpkV === null) return null
    const z = 3 * cpkV
    return hasBoth ? (normCDF(-z) + (1 - normCDF(z))) * 1e6 : (1 - normCDF(z)) * 1e6
  }
  const ppm = ppmFromCpk(Cpk)
  const ppmOverall = ppmFromCpk(Ppk)

  return {
    ok: true,
    result: {
      data, xBar, sOverall, sWithin, N, minV, maxV, med, range,
      Cp, Cpk, Cpu, Cpl, Pp, Ppk, Ppu, Ppl, Cpm, Cmk,
      sigLvl, ppm, ppmOverall, adTest, isNormal, lsl, usl, targetVal, hasLSL, hasUSL, hasBoth,
      subgroupSize: n, pointName,
    },
  }
}

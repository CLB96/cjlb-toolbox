import { andersonDarlingTest } from './normality'
import { mean, median, normCDF, parseDataTokens, stddev, withinSigma } from './stats'
import type { AnalysisErrorCode, AnalysisInput, AnalysisOutcome, AnalysisWarning, Lang } from './types'

export const MAX_SUBGROUP = 25
const DEFAULT_CONFIDENCE = 95

export function sigmaLevel(cpk: number): number {
  return cpk * 3
}

const ERROR_TEXT: Record<AnalysisErrorCode, Record<Lang, string>> = {
  minData: { es: 'Necesitas al menos 5 datos.', en: 'Need at least 5 data points.' },
  noLimit: { es: 'Ingresa al menos un límite de especificación.', en: 'Enter at least one specification limit.' },
  badLimits: { es: 'El USL debe ser mayor que el LSL.', en: 'USL must be greater than LSL.' },
  infinite: { es: 'Hay valores infinitos (Infinity); corrígelos antes de calcular.', en: 'There are infinite values (Infinity); fix them before calculating.' },
  noVariation: { es: 'Los datos no tienen variación (sin variación); no se pueden calcular los índices.', en: 'The data have no variation; the indices cannot be calculated.' },
}

const WARNING_TEXT: Record<AnalysisWarning, Record<Lang, string>> = {
  subgroupClamped: {
    es: 'El subgrupo debe estar entre 1 y 25 y no superar el número de datos; se ajustó.',
    en: 'Subgroup size must be between 1 and 25 and not exceed the number of data points; it was adjusted.',
  },
  confidenceInvalid: {
    es: 'La confianza debe estar entre 0 y 100 (sin incluirlos); se usó 95.',
    en: 'Confidence must be between 0 and 100 (exclusive); 95 was used.',
  },
}

/** Texts of the validation failures (the first two are the original alert() texts). */
export function analysisErrorMessage(code: AnalysisErrorCode, lang: Lang): string {
  return ERROR_TEXT[code][lang]
}

export function analysisWarningMessage(code: AnalysisWarning, lang: Lang): string {
  return WARNING_TEXT[code][lang]
}

/**
 * Port of runAnalysis' calculation part. Inputs are the raw field strings, as in the original form.
 * Two-sided PPM adds the real upper (Cpu) and lower (Cpl) tails.
 */
export function runAnalysis(input: AnalysisInput): AnalysisOutcome {
  const warnings: AnalysisWarning[] = []
  const parsed = parseDataTokens(input.raw)
  const data = parsed.values
  const lsl = parseFloat(input.lsl)
  const usl = parseFloat(input.usl)
  if (parsed.infinite > 0 || lsl === Infinity || lsl === -Infinity || usl === Infinity || usl === -Infinity) {
    return { ok: false, error: 'infinite' }
  }
  if (data.length < 5) return { ok: false, error: 'minData' }
  const targetVal = parseFloat(input.target)
  const pointName = input.pointName.trim()
  const hasLSL = !isNaN(lsl)
  const hasUSL = !isNaN(usl)
  const hasBoth = hasLSL && hasUSL
  if (!hasLSL && !hasUSL) return { ok: false, error: 'noLimit' }
  if (hasBoth && usl <= lsl) return { ok: false, error: 'badLimits' }

  const N = data.length
  const rawN = parseInt(input.subgroupSize) || 1
  const n = Math.max(1, Math.min(MAX_SUBGROUP, N, rawN))
  if (rawN < 0 || rawN > n) warnings.push('subgroupClamped')

  const confText = (input.confidence ?? '').trim()
  let confidence = DEFAULT_CONFIDENCE
  if (confText !== '') {
    const c = parseFloat(confText)
    if (c > 0 && c < 100) confidence = c
    else warnings.push('confidenceInvalid')
  }
  const alpha = (100 - confidence) / 100

  const xBar = mean(data)
  const sOverall = stddev(data)
  const sWithin = withinSigma(data, n)
  if (!(sOverall > 0) || !(sWithin > 0)) return { ok: false, error: 'noVariation' }
  const minV = Math.min(...data)
  const maxV = Math.max(...data)
  const med = median(data)
  const range = maxV - minV
  const adTest = andersonDarlingTest(data)
  const isNormal = adTest.p >= alpha
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
  const sigLvl = Cpk !== null ? sigmaLevel(Cpk) : null
  const ppmOf = (upper: number | null, lower: number | null, k: number | null): number | null => {
    if (k === null) return null
    if (hasBoth) return (normCDF(-3 * (upper as number)) + normCDF(-3 * (lower as number))) * 1e6
    return (1 - normCDF(3 * k)) * 1e6
  }
  const ppm = ppmOf(Cpu, Cpl, Cpk)
  const ppmOverall = ppmOf(Ppu, Ppl, Ppk)

  return {
    ok: true,
    warnings,
    result: {
      data, xBar, sOverall, sWithin, N, minV, maxV, med, range,
      Cp, Cpk, Cpu, Cpl, Pp, Ppk, Ppu, Ppl, Cpm,
      sigLvl, ppm, ppmOverall, adTest, isNormal, alpha, lsl, usl, targetVal, hasLSL, hasUSL, hasBoth,
      subgroupSize: n, pointName,
    },
  }
}

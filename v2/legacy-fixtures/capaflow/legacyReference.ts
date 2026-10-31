// Referencia legacy de CapaFlow: copia literal de las expresiones del original
// (capaflow/index.html) con las lecturas de DOM y globales reemplazadas por parametros.
// Origen por funcion:
//   legacyParseData .. legacyColorForCpk  <- lineas 3735-3807 (utilidades puras)
//   legacyLoadSample / SAMPLE_*            <- loadSampleData, lineas 3812-3822
//   legacyRunAnalysis                      <- runAnalysis, lineas 3824-3868 (alert() -> codigo de error)
//   legacyFmt / legacyFmtN / sigmaBarW     <- renderResults, lineas 3879-3887
//   legacySigmaTooltipClass                <- tooltip de la barra sigma, lineas 4140-4144
//   legacyBuildInterpretation              <- buildInterpretation, lineas 4800-4826
//   legacyBuildInterpretationPlain         <- _buildInterpretationPlain, lineas 6849-6869
//   legacyHistogram                        <- drawHistogram, lineas 4618-4631 y 4693-4699 (curva normal)
//   legacyRunChart                         <- drawRunChart, lineas 4838-4858 (pantalla) y _pngRunChart 6507-6510 (PNG)
//   legacyQQ                               <- drawQQPlot, lineas 4966-5006
//   legacyBoxPlot                          <- drawBoxPlot, lineas 5115-5131 y 5136-5137
//   SPC_CONSTANTS .. legacyMakeSubgroups   <- lineas 6872-6948
//   legacyBuildCCScreen                    <- drawControlCharts, lineas 6959-7057 (+ violaciones 7059-7062)
//   legacyBuildCCExport                    <- _buildCCData, lineas 7279-7326
//   legacyCCYExtent                        <- _drawCCChart, lineas 7138-7148
//   legacySummaryCpkColor                  <- generateComparativeSummary, linea 5496
// Los textos de TRANSLATIONS usados por estas funciones se copiaron literalmente (ES y EN).

export type LegacyLang = 'es' | 'en'

export const LEGACY_LABELS: Record<LegacyLang, Record<string, string>> = {
  es: {
    'classify.worldClass': 'World Class',
    'classify.capable': 'Capaz',
    'classify.marginal': 'Marginal',
    'classify.notCapable': 'No Capaz',
    'classify.potential': 'Potencial',
    'cc.individuals': 'Individuales',
    'cc.means': 'Medias',
    'cc.ranges': 'Rangos',
    'cc.stddevBot': 'Desv. Est.',
    'cc.movingRange': 'Rango Móvil',
    'cc.noteIMR': 'Datos individuales (subgrupo=1). Se usa gráfica I-MR con rango móvil entre observaciones consecutivas.',
    'cc.noteXR': 'Subgrupos de tamaño n=%s. Constantes: A₂=%.3f, D₃=%.3f, D₄=%.3f',
    'cc.noteXS': 'Subgrupos de tamaño n=%s. Constantes: A₃=%.3f, B₃=%.3f, B₄=%.3f',
    'cc.ooc': 'Fuera de control',
    'cc.inControl': 'Bajo control',
    'rc.runCount': 'Total de rachas',
    'rc.expected': 'Esperado',
    'png.normal': 'Distribución Normal ✓',
    'png.notNormal': 'Posible No-Normalidad',
  },
  en: {
    'classify.worldClass': 'World Class',
    'classify.capable': 'Capable',
    'classify.marginal': 'Marginal',
    'classify.notCapable': 'Not Capable',
    'classify.potential': 'Potential',
    'cc.individuals': 'Individuals',
    'cc.means': 'Means',
    'cc.ranges': 'Ranges',
    'cc.stddevBot': 'Std Dev',
    'cc.movingRange': 'Moving Range',
    'cc.noteIMR': 'Individual data (subgroup=1). I-MR chart using moving range between consecutive observations.',
    'cc.noteXR': 'Subgroup size n=%s. Constants: A₂=%.3f, D₃=%.3f, D₄=%.3f',
    'cc.noteXS': 'Subgroup size n=%s. Constants: A₃=%.3f, B₃=%.3f, B₄=%.3f',
    'cc.ooc': 'Out of control',
    'cc.inControl': 'In control',
    'rc.runCount': 'Total runs',
    'rc.expected': 'Expected',
    'png.normal': 'Normal Distribution ✓',
    'png.notNormal': 'Possible Non-Normality',
  },
}

// ── Datos de ejemplo (loadSampleData) ──
export const SAMPLE_LSL = '73.95'
export const SAMPLE_USL = '74.05'
export const SAMPLE_TARGET = '74'
export const SAMPLE_SUBGROUP = '5'
export const SAMPLE_DATA = `74.03, 74.002, 74.019, 73.992, 74.008, 73.995, 73.992, 74.001, 74.011, 74.004, 73.988, 74.024, 74.021, 74.005, 74.002, 74.002, 73.996, 73.993, 74.015, 74.009, 73.992, 74.007, 74.015, 73.989, 74.014, 74.009, 73.994, 73.997, 73.985, 73.993, 73.995, 74.006, 73.994, 74.0, 74.005, 73.985, 74.003, 73.993, 74.015, 73.988, 74.008, 73.995, 74.009, 74.005, 74.004, 73.998, 74.0, 73.99, 74.007, 73.995, 73.994, 73.998, 73.994, 73.995, 73.99, 74.004, 74.0, 74.007, 74.0, 73.996, 73.983, 74.002, 73.998, 73.997, 74.012, 74.006, 73.967, 73.994, 74.0, 73.984, 74.012, 74.014, 73.998, 73.999, 74.007, 74.0, 73.984, 74.005, 73.998, 73.996, 73.994, 74.012, 73.986, 74.005, 74.007, 74.006, 74.01, 74.018, 74.003, 74.0, 73.984, 74.002, 74.003, 74.005, 73.997, 74.0, 74.01, 74.013, 74.02, 74.003, 73.982, 74.001, 74.015, 74.005, 73.996, 74.004, 73.999, 73.99, 74.006, 74.009, 74.01, 73.989, 73.99, 74.009, 74.014, 74.015, 74.008, 73.993, 74.0, 74.01, 73.982, 73.984, 73.995, 74.017, 74.013`

// ── Utilidades puras (3735-3807) ──
export function legacyParseData(raw: string): number[] {
  return raw.split(/[\s,;\n\t]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
}
export function legacyMean(arr: number[]): number { return arr.reduce((a, b) => a + b, 0) / arr.length }
export function legacyStddev(arr: number[], pop = false): number {
  const m = legacyMean(arr)
  const sq = arr.map(v => (v - m) ** 2)
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / (pop ? arr.length : arr.length - 1))
}
export function legacyMedian(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
export function legacyWithinSigma(data: number[], n: number): number {
  if (n === 1) {
    const mr: number[] = []
    for (let i = 1; i < data.length; i++) mr.push(Math.abs(data[i] - data[i - 1]))
    return legacyMean(mr) / 1.128
  }
  const d2Map: Record<number, number> = { 1: 1, 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078, 11: 3.173, 12: 3.258, 13: 3.336, 14: 3.407, 15: 3.472, 16: 3.532, 17: 3.588, 18: 3.640, 19: 3.689, 20: 3.735, 21: 3.778, 22: 3.819, 23: 3.858, 24: 3.895, 25: 3.931 }
  const d2 = d2Map[n] || 2.326
  const groups: number[][] = []
  for (let i = 0; i < data.length; i += n) {
    const group = data.slice(i, i + n)
    if (group.length === n) groups.push(group)
  }
  const ranges = groups.map(g => Math.max(...g) - Math.min(...g))
  return legacyMean(ranges) / d2
}
export function legacyNormCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1; x = Math.abs(x) / Math.sqrt(2)
  const t2 = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t2 + a4) * t2 + a3) * t2 + a2) * t2 + a1) * t2 * Math.exp(-x * x))
  return 0.5 * (1 + sign * y)
}
export function legacyNormPDF(x: number, mu: number, sigma: number): number { return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2) }
export function legacyQuartile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos), rest = pos - base
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base]
}
export function legacyAndersonDarlingTest(data: number[]): { stat: number; p: number } {
  const n = data.length, sorted = [...data].sort((a, b) => a - b), m = legacyMean(sorted), s = legacyStddev(sorted)
  let A2 = 0
  for (let i = 0; i < n; i++) {
    const z1 = legacyNormCDF((sorted[i] - m) / s), z2 = legacyNormCDF((sorted[n - 1 - i] - m) / s)
    A2 += (2 * (i + 1) - 1) * (Math.log(Math.max(z1, 1e-10)) + Math.log(Math.max(1 - z2, 1e-10)))
  }
  A2 = (-n - A2 / n)
  const A2adj = A2 * (1 + 4 / n - 25 / n ** 2)
  let pv: number
  if (A2adj >= 0.6) pv = Math.exp(1.2937 - 5.709 * A2adj + 0.0186 * A2adj ** 2)
  else if (A2adj >= 0.34) pv = Math.exp(0.9177 - 4.279 * A2adj - 1.38 * A2adj ** 2)
  else if (A2adj >= 0.2) pv = 1 - Math.exp(-8.318 + 42.796 * A2adj - 59.938 * A2adj ** 2)
  else pv = 1 - Math.exp(-13.436 + 101.14 * A2adj - 223.73 * A2adj ** 2)
  return { stat: A2adj, p: Math.min(1, Math.max(0, pv)) }
}
export function legacySigmaLevel(cpk: number): number { return cpk * 3 }
export function legacyClassifyCpk(v: number, lang: LegacyLang): { label: string; cls: string } {
  const t = (k: string) => LEGACY_LABELS[lang][k] || k
  if (v >= 1.67) return { label: t('classify.worldClass'), cls: 'green' }
  if (v >= 1.33) return { label: t('classify.capable'), cls: 'green' }
  if (v >= 1.00) return { label: t('classify.marginal'), cls: 'yellow' }
  return { label: t('classify.notCapable'), cls: 'red' }
}
export function legacyColorForCpk(v: number): string {
  if (v >= 1.33) return 'var(--accent-green)'
  if (v >= 1.00) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

// ── runAnalysis (3824-3868) ──
export interface LegacyResult {
  data: number[]
  xBar: number; sOverall: number; sWithin: number; N: number; minV: number; maxV: number; med: number; range: number
  Cp: number | null; Cpk: number | null; Cpu: number | null; Cpl: number | null
  Pp: number | null; Ppk: number | null; Ppu: number | null; Ppl: number | null
  Cpm: number | null; Cmk: number | null
  sigLvl: number | null; ppm: number | null; ppmOverall: number | null
  adTest: { stat: number; p: number }; isNormal: boolean
  lsl: number; usl: number; targetVal: number; hasLSL: boolean; hasUSL: boolean; hasBoth: boolean
  subgroupSize: number; pointName: string
}
export type LegacyAnalysisError = 'minData' | 'noLimit'
export function legacyAlertMessage(code: LegacyAnalysisError, lang: LegacyLang): string {
  return code === 'minData'
    ? (lang === 'es' ? 'Necesitas al menos 5 datos.' : 'Need at least 5 data points.')
    : (lang === 'es' ? 'Ingresa al menos un límite de especificación.' : 'Enter at least one specification limit.')
}
export function legacyRunAnalysis(
  raw: string, lslStr: string, uslStr: string, targetStr: string, subgroupStr: string, pointNameStr: string,
): LegacyResult | { error: LegacyAnalysisError } {
  const data = legacyParseData(raw)
  if (data.length < 5) return { error: 'minData' }
  const lsl = parseFloat(lslStr)
  const usl = parseFloat(uslStr)
  const targetVal = parseFloat(targetStr)
  const n = parseInt(subgroupStr) || 1
  const pointName = pointNameStr.trim()
  const hasLSL = !isNaN(lsl), hasUSL = !isNaN(usl), hasBoth = hasLSL && hasUSL
  if (!hasLSL && !hasUSL) return { error: 'noLimit' }

  const xBar = legacyMean(data), sOverall = legacyStddev(data), sWithin = legacyWithinSigma(data, n)
  const N = data.length, minV = Math.min(...data), maxV = Math.max(...data), med = legacyMedian(data), range = maxV - minV
  const adTest = legacyAndersonDarlingTest(data), isNormal = adTest.p >= 0.05
  const tolerance = hasBoth ? usl - lsl : null
  const Cp = hasBoth ? tolerance! / (6 * sWithin) : null
  const Pp = hasBoth ? tolerance! / (6 * sOverall) : null
  const Cpu = hasUSL ? (usl - xBar) / (3 * sWithin) : null
  const Cpl = hasLSL ? (xBar - lsl) / (3 * sWithin) : null
  const Ppu = hasUSL ? (usl - xBar) / (3 * sOverall) : null
  const Ppl = hasLSL ? (xBar - lsl) / (3 * sOverall) : null
  const Cpk = (Cpu !== null && Cpl !== null) ? Math.min(Cpu, Cpl) : (Cpu !== null ? Cpu : Cpl)
  const Ppk = (Ppu !== null && Ppl !== null) ? Math.min(Ppu, Ppl) : (Ppu !== null ? Ppu : Ppl)
  let Cpm: number | null = null
  if (hasBoth && !isNaN(targetVal)) { const tau = Math.sqrt(sOverall ** 2 + (xBar - targetVal) ** 2); Cpm = tolerance! / (6 * tau) }
  const Cmk = Cpk
  const sigLvl = Cpk !== null ? legacySigmaLevel(Cpk) : null
  const ppmFromCpk = (cpkV: number | null): number | null => {
    if (cpkV === null) return null
    const z = 3 * cpkV
    return hasBoth
      ? (legacyNormCDF(-z) + (1 - legacyNormCDF(z))) * 1e6   // upper + lower tail
      : (1 - legacyNormCDF(z)) * 1e6                          // one-sided: failing tail only
  }
  const ppm = ppmFromCpk(Cpk), ppmOverall = ppmFromCpk(Ppk)

  return {
    data, xBar, sOverall, sWithin, N, minV, maxV, med, range,
    Cp, Cpk, Cpu, Cpl, Pp, Ppk, Ppu, Ppl, Cpm, Cmk,
    sigLvl, ppm, ppmOverall, adTest, isNormal, lsl, usl, targetVal, hasLSL, hasUSL, hasBoth,
    subgroupSize: n, pointName,
  }
}

// ── Formato (renderResults 3883-3887) ──
export const legacyFmt = (v: number | null, d = 3): string => v !== null && !isNaN(v) ? v.toFixed(d) : '—'
export const legacyFmtN = (v: number | null): string => v !== null && !isNaN(v) ? Math.round(v).toLocaleString() : '—'
export const legacySigmaBarW = (sigLvl: number | null): number => sigLvl !== null ? Math.min(100, (sigLvl / 6) * 100) : 0
// Clasificacion del tooltip de la barra sigma (4140-4144): textos fijos en espanol, umbrales en sigma.
export function legacySigmaTooltipClass(sigmaValue: number): string {
  let classification = 'No Capaz'
  if (sigmaValue >= 5) classification = 'World Class'
  else if (sigmaValue >= 4) classification = 'Capaz'
  else if (sigmaValue >= 3) classification = 'Marginal'
  return classification
}
// Color del resumen comparativo (5496) con una paleta P simbolica.
export const legacySummaryCpkColor = (v: number | null): string => v === null ? 'accent' : v >= 1.33 ? 'green' : v >= 1.0 ? 'yellow' : 'red'

// ── Interpretacion (4800-4826): devuelve las lineas en lugar de escribir en el DOM ──
export function legacyBuildInterpretation(r: LegacyResult, es: boolean): string {
  const lines: string[] = []
  const cpk = r.Cpk

  if (cpk !== null) {
    if (cpk >= 1.67) lines.push(es ? `✅ <strong>Proceso World Class.</strong> Tu Cpk de ${cpk.toFixed(3)} supera 1.67 — variación mínima, perfectamente centrado. Menos de 0.6 PPM esperados.` : `✅ <strong>World Class Process.</strong> Your Cpk of ${cpk.toFixed(3)} exceeds 1.67 — minimal variation, perfectly centered. Less than 0.6 PPM expected.`)
    else if (cpk >= 1.33) lines.push(es ? `✅ <strong>Proceso Capaz.</strong> Cpk de ${cpk.toFixed(3)} cumple el estándar Six Sigma (≥1.33). Proceso bajo control con buena capacidad.` : `✅ <strong>Capable Process.</strong> Cpk of ${cpk.toFixed(3)} meets the Six Sigma standard (≥1.33). Process under control with good capability.`)
    else if (cpk >= 1.00) lines.push(es ? `⚠️ <strong>Proceso Marginal.</strong> Cpk de ${cpk.toFixed(3)} entre 1.0 y 1.33 — el proceso produce defectos. Se recomienda mejora.` : `⚠️ <strong>Marginal Process.</strong> Cpk of ${cpk.toFixed(3)} between 1.0 and 1.33 — producing some defects. Improvement recommended.`)
    else lines.push(es ? `❌ <strong>Proceso No Capaz.</strong> Cpk de ${cpk.toFixed(3)} menor a 1.0. Produciendo defectos fuera de especificación. <strong>Acción correctiva urgente.</strong>` : `❌ <strong>Not Capable.</strong> Cpk of ${cpk.toFixed(3)} below 1.0. Producing out-of-spec defects. <strong>Urgent corrective action needed.</strong>`)
  }

  if (r.Cp !== null && cpk !== null && r.Cp / cpk > 1.15)
    lines.push(es ? `📍 <strong>Problema de centrado:</strong> Cp (${r.Cp.toFixed(3)}) > Cpk (${cpk.toFixed(3)}) — el proceso tiene potencial pero no está centrado. Ajustar la media hacia el target puede mejorar significativamente.` : `📍 <strong>Centering issue:</strong> Cp (${r.Cp.toFixed(3)}) > Cpk (${cpk.toFixed(3)}) — the process has potential but is off-center. Shifting the mean toward target may significantly improve capability.`)

  if (r.Ppk !== null && r.Cpk !== null && Math.abs(r.Cpk - r.Ppk) > 0.15)
    lines.push(es ? `📊 <strong>Variación entre subgrupos:</strong> Diferencia Cpk/Ppk (${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}) sugiere causas asignables (turnos, materiales, operadores). Investiga con gráficas de control.` : `📊 <strong>Between-subgroup variation:</strong> Cpk/Ppk gap (${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}) suggests assignable causes (shifts, materials, operators). Investigate with control charts.`)

  if (!r.isNormal)
    lines.push(es ? `🔔 <strong>Precaución — no normalidad:</strong> Anderson-Darling p=${r.adTest.p.toFixed(4)} sugiere distribución no normal. Los índices Cpk asumen normalidad. Considera transformación de datos o análisis no-paramétrico.` : `🔔 <strong>Non-normality warning:</strong> Anderson-Darling p=${r.adTest.p.toFixed(4)} suggests non-normal distribution. Cpk indices assume normality. Consider data transformation or non-parametric analysis.`)

  return lines.join('<br><br>')
}

// ── Interpretacion en texto plano para el PNG ejecutivo (6849-6869) ──
export function legacyBuildInterpretationPlain(r: LegacyResult, es: boolean): string[] {
  const lines: string[] = []
  const cpk = r.Cpk
  if (cpk !== null) {
    if (cpk >= 1.67) lines.push(es ? `Proceso World Class. Cpk=${cpk.toFixed(3)} supera 1.67 — variacion minima, perfectamente centrado. PPM esperados: ${Math.round(r.ppm || 0)}.` : `World Class Process. Cpk=${cpk.toFixed(3)} exceeds 1.67 — minimal variation, perfectly centered. Expected PPM: ${Math.round(r.ppm || 0)}.`)
    else if (cpk >= 1.33) lines.push(es ? `Proceso Capaz. Cpk=${cpk.toFixed(3)} cumple el estandar Six Sigma (>= 1.33). Proceso bajo control con buena capacidad. PPM: ${Math.round(r.ppm || 0)}.` : `Capable Process. Cpk=${cpk.toFixed(3)} meets Six Sigma standard (>= 1.33). Process under control with good capability. PPM: ${Math.round(r.ppm || 0)}.`)
    else if (cpk >= 1.00) lines.push(es ? `Proceso Marginal. Cpk=${cpk.toFixed(3)} entre 1.0 y 1.33 — produce defectos. Accion de mejora recomendada. PPM: ${Math.round(r.ppm || 0)}.` : `Marginal Process. Cpk=${cpk.toFixed(3)} between 1.0 and 1.33 — producing some defects. Improvement action recommended. PPM: ${Math.round(r.ppm || 0)}.`)
    else lines.push(es ? `Proceso No Capaz. Cpk=${cpk.toFixed(3)} menor a 1.0. Produciendo defectos fuera de especificacion. Accion correctiva urgente requerida. PPM: ${Math.round(r.ppm || 0)}.` : `Not Capable. Cpk=${cpk.toFixed(3)} below 1.0. Producing out-of-spec defects. Urgent corrective action required. PPM: ${Math.round(r.ppm || 0)}.`)
  }
  if (r.Cp !== null && cpk !== null && r.Cp > 0 && r.Cp / cpk > 1.15)
    lines.push(es ? `Problema de centrado: Cp (${r.Cp.toFixed(3)}) es mayor que Cpk (${cpk.toFixed(3)}). El proceso tiene potencial pero no esta centrado en el target. Ajustar la media puede mejorar significativamente.` : `Centering issue: Cp (${r.Cp.toFixed(3)}) > Cpk (${cpk.toFixed(3)}). The process has potential but is off-center. Shifting the mean toward target may significantly improve capability.`)
  if (r.Ppk !== null && r.Cpk !== null && Math.abs(r.Cpk - r.Ppk) > 0.15)
    lines.push(es ? `Variacion entre subgrupos detectada: diferencia Cpk/Ppk = ${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}. Investiga causas asignables como turnos, cambios de material u operadores distintos.` : `Between-subgroup variation detected: Cpk/Ppk = ${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}. Investigate assignable causes such as shifts, material changes, or different operators.`)
  if (!r.isNormal)
    lines.push(es ? `Precaucion — no normalidad: Anderson-Darling p=${r.adTest.p.toFixed(4)}. Los indices Cpk asumen distribucion normal. Considera una transformacion de datos o analisis no-parametrico.` : `Non-normality warning: Anderson-Darling p=${r.adTest.p.toFixed(4)}. Cpk indices assume normal distribution. Consider a data transformation or non-parametric analysis.`)
  return lines
}

// ── Histograma (drawHistogram 4618-4631, curva 4693-4699) ──
export function legacyHistogram(r: LegacyResult) {
  const data = r.data
  const bins = Math.max(8, Math.min(20, Math.ceil(Math.sqrt(data.length))))
  const ext = r.sOverall * 0.7
  const minV = r.minV - ext, maxV = r.maxV + ext
  const binW = (maxV - minV) / bins
  const counts: number[] = new Array(bins).fill(0)
  data.forEach(v => {
    const i = Math.min(Math.max(Math.floor((v - minV) / binW), 0), bins - 1)
    counts[i]++
  })
  const maxC = Math.max(...counts)
  const maxPDF = legacyNormPDF(r.xBar, r.xBar, r.sOverall)
  const curve: { x: number; y: number }[] = []
  for (let i = 0; i <= 180; i++) {
    const xv = minV + (i / 180) * (maxV - minV)
    curve.push({ x: xv, y: (legacyNormPDF(xv, r.xBar, r.sOverall) / maxPDF) * 0.90 })
  }
  return { bins, minV, maxV, binW, counts, maxC, curve }
}

// ── Run chart: pantalla (ultimos 25, 4838-4858) y PNG (todos los datos, _pngRunChart 6507-6510) ──
export function legacyRunChart(r: LegacyResult, mode: 'screen' | 'png') {
  if (mode === 'png') {
    const data = r.data, N = data.length, med = r.med
    const ext = r.sOverall * 0.5
    return { data, startIndex: 0, N, med, yMin: r.minV - ext, yMax: r.maxV + ext, runs: null as number | null, expectedRuns: null as number | null }
  }
  const maxPoints = 25
  const fullData = r.data
  const data = fullData.slice(-maxPoints)
  const startIndex = fullData.length - data.length
  const N = data.length
  const med = legacyMedian(data)
  let runs = 1, currentSide = data[0] > med ? 1 : data[0] < med ? -1 : 0
  for (let i = 1; i < N; i++) {
    const side = data[i] > med ? 1 : data[i] < med ? -1 : 0
    if (side !== 0 && side !== currentSide) { runs++; currentSide = side }
  }
  const expectedRuns = Math.round((2 * N - 1) / 3)
  const ext = legacyStddev(data, true) * 0.5
  const yMin = Math.min(...data) - ext, yMax = Math.max(...data) + ext
  return { data, startIndex, N, med, runs: runs as number | null, expectedRuns: expectedRuns as number | null, yMin, yMax }
}
// Texto de conteo de rachas (4919-4920)
export function legacyRunNote(runs: number, expectedRuns: number, lang: LegacyLang): string {
  const t = (k: string) => LEGACY_LABELS[lang][k] || k
  const es = lang === 'es'
  return `${t('rc.runCount')}: ${runs} | ${t('rc.expected')}: ~${expectedRuns} | ` +
    (es ? `Variación aleatoria esperada si los datos son independientes (aprox. (2n-1)/3).` : `Random variation expected when data is independent (approx. (2n-1)/3).`)
}

// ── Q-Q plot (4966-5006) ──
export function legacyQQ(r: LegacyResult) {
  const sorted = [...r.data].sort((a, b) => a - b)
  const N = sorted.length
  const mu = r.xBar, sigma = r.sOverall
  const probit = (p: number): number => {
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
    let x = c[0]; for (let i = 1; i < 9; i++) x += c[i] * Math.pow(r2, i)
    return p < 0.5 ? -x : x
  }
  const pts = sorted.map((v, i) => {
    const pi = (i + 0.5) / N
    const th = mu + sigma * probit(pi)
    return { obs: v, th }
  })
  const obsVals = pts.map(p => p.obs)
  const thVals = pts.map(p => p.th)
  const xMin = Math.min(...obsVals), xMax = Math.max(...obsVals)
  const yMin = Math.min(...thVals), yMax = Math.max(...thVals)
  const xPad = (xMax - xMin) * 0.08 || 0.01
  const yPad = (yMax - yMin) * 0.08 || 0.01
  const se = sigma * Math.sqrt((Math.PI / 2) / N)
  return { pts, xMin, xMax, yMin, yMax, xPad, yPad, se, bandHalf: 1.36 * se, probit }
}

// ── Box plot (5115-5131, 5136-5137) ──
export function legacyBoxPlot(r: LegacyResult) {
  const sorted = [...r.data].sort((a, b) => a - b)
  const N = sorted.length
  const Q1 = legacyQuartile(sorted, 0.25)
  const Q2 = r.med
  const Q3 = legacyQuartile(sorted, 0.75)
  const IQR = Q3 - Q1
  const lowerFence = Q1 - 1.5 * IQR
  const upperFence = Q3 + 1.5 * IQR
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence)
  const inliers = sorted.filter(v => v >= lowerFence && v <= upperFence)
  const minWhisker = inliers.length > 0 ? Math.min(...inliers) : sorted[0]
  const maxWhisker = inliers.length > 0 ? Math.max(...inliers) : sorted[N - 1]
  const xMin = Math.min(r.minV, !isNaN(r.lsl) ? r.lsl : r.minV) - r.sOverall * 0.5
  const xMax = Math.max(r.maxV, !isNaN(r.usl) ? r.usl : r.maxV) + r.sOverall * 0.5
  return { Q1, Q2, Q3, IQR, lowerFence, upperFence, outliers, minWhisker, maxWhisker, xMin, xMax }
}

// ── Constantes SPC y reglas (6872-6948) ──
export interface LegacySpc { A2: number; D3: number; D4: number; A3: number; B3: number; B4: number; c4: number; d2: number }
export const LEGACY_SPC_CONSTANTS: Record<number, LegacySpc> = {
  2: { A2: 1.880, D3: 0, D4: 3.267, A3: 2.659, B3: 0, B4: 3.267, c4: 0.7979, d2: 1.128 },
  3: { A2: 1.023, D3: 0, D4: 2.574, A3: 1.954, B3: 0, B4: 2.568, c4: 0.8862, d2: 1.693 },
  4: { A2: 0.729, D3: 0, D4: 2.282, A3: 1.628, B3: 0, B4: 2.266, c4: 0.9213, d2: 2.059 },
  5: { A2: 0.577, D3: 0, D4: 2.114, A3: 1.427, B3: 0, B4: 2.089, c4: 0.9400, d2: 2.326 },
  6: { A2: 0.483, D3: 0, D4: 2.004, A3: 1.287, B3: 0.030, B4: 1.970, c4: 0.9515, d2: 2.534 },
  7: { A2: 0.419, D3: 0.076, D4: 1.924, A3: 1.182, B3: 0.118, B4: 1.882, c4: 0.9594, d2: 2.704 },
  8: { A2: 0.373, D3: 0.136, D4: 1.864, A3: 1.099, B3: 0.185, B4: 1.815, c4: 0.9650, d2: 2.847 },
  9: { A2: 0.337, D3: 0.184, D4: 1.816, A3: 1.032, B3: 0.239, B4: 1.761, c4: 0.9693, d2: 2.970 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777, A3: 0.975, B3: 0.284, B4: 1.716, c4: 0.9727, d2: 3.078 },
  15: { A2: 0.223, D3: 0.347, D4: 1.653, A3: 0.789, B3: 0.428, B4: 1.572, c4: 0.9823, d2: 3.472 },
  20: { A2: 0.180, D3: 0.415, D4: 1.585, A3: 0.680, B3: 0.510, B4: 1.490, c4: 0.9869, d2: 3.735 },
  25: { A2: 0.153, D3: 0.459, D4: 1.541, A3: 0.606, B3: 0.565, B4: 1.435, c4: 0.9896, d2: 3.931 },
}

export function legacyGetSPCConstants(n: number): LegacySpc {
  const SPC_CONSTANTS = LEGACY_SPC_CONSTANTS
  if (SPC_CONSTANTS[n]) return SPC_CONSTANTS[n]
  const keys = Object.keys(SPC_CONSTANTS).map(Number).sort((a, b) => a - b)
  for (let i = 0; i < keys.length - 1; i++) {
    if (n > keys[i] && n < keys[i + 1]) {
      const lo = SPC_CONSTANTS[keys[i]], hi = SPC_CONSTANTS[keys[i + 1]]
      const f = (n - keys[i]) / (keys[i + 1] - keys[i])
      const lerp = (a: number, b: number) => a + (b - a) * f
      return {
        A2: lerp(lo.A2, hi.A2), D3: lerp(lo.D3, hi.D3), D4: lerp(lo.D4, hi.D4),
        A3: lerp(lo.A3, hi.A3), B3: lerp(lo.B3, hi.B3), B4: lerp(lo.B4, hi.B4),
        c4: lerp(lo.c4, hi.c4), d2: lerp(lo.d2, hi.d2),
      }
    }
  }
  return SPC_CONSTANTS[25]
}

export function legacyWesternRule1(pts: number[], ucl: number, lcl: number): number[] { return pts.filter(p => p > ucl || p < lcl) }

export function legacyWeViolations(pts: number[], cl: number, sigma: number): number[] {
  const viol = new Set<number>()
  const n = pts.length
  // Rule 1: beyond 3σ
  pts.forEach((p, i) => { if (Math.abs(p - cl) > 3 * sigma) viol.add(i) })
  // Rule 2: 2 of 3 beyond 2σ same side
  for (let i = 2; i < n; i++) {
    const w = [pts[i], pts[i - 1], pts[i - 2]]
    const abv = w.filter(v => v > cl + 2 * sigma).length
    const blw = w.filter(v => v < cl - 2 * sigma).length
    if (abv >= 2 || blw >= 2) {
      viol.add(i); if (abv >= 2) { if (pts[i - 1] > cl + 2 * sigma) viol.add(i - 1); if (pts[i - 2] > cl + 2 * sigma) viol.add(i - 2) }
      if (blw >= 2) { if (pts[i - 1] < cl - 2 * sigma) viol.add(i - 1); if (pts[i - 2] < cl - 2 * sigma) viol.add(i - 2) }
    }
  }
  // Rule 3: 6 consecutive trending
  for (let i = 5; i < n; i++) {
    let up = true, dn = true
    for (let j = i - 4; j <= i; j++) { if (pts[j] <= pts[j - 1]) up = false; if (pts[j] >= pts[j - 1]) dn = false }
    if (up || dn) for (let j = i - 5; j <= i; j++) viol.add(j)
  }
  // Rule 4: 8 consecutive same side
  for (let i = 7; i < n; i++) {
    const seg = pts.slice(i - 7, i + 1)
    if (seg.every(v => v > cl) || seg.every(v => v < cl)) for (let j = i - 7; j <= i; j++) viol.add(j)
  }
  return [...viol].sort((a, b) => a - b)
}

export function legacyMakeSubgroups(data: number[], n: number): number[][] {
  if (n <= 1) return data.map(v => [v])
  const groups: number[][] = []
  for (let i = 0; i < data.length; i += n) {
    const g = data.slice(i, i + n)
    if (g.length === n) groups.push(g)
  }
  return groups
}

// Tipo automatico (6967-6972)
export function legacyAutoCCType(n: number): 'imr' | 'xr' | 'xs' {
  if (n <= 1) return 'imr'
  else if (n < 10) return 'xr'
  return 'xs'
}

export interface LegacyCC {
  topPts: number[]; topCL: number; topUCL: number; topLCL: number; topLabel: string; topSigma: number; topViol: number[]; topOOC: number
  botPts: (number | null)[]; botCL: number; botUCL: number; botLCL: number; botLabel: string; botSigma: number; botViol: number[]; botOOC: number
  noteText: string
}

// drawControlCharts (pantalla)
export function legacyBuildCCScreen(r: LegacyResult, forceType: string | undefined, lang: LegacyLang): LegacyCC & { chartType: string } {
  const t = (k: string) => LEGACY_LABELS[lang][k] || k
  const n = r.subgroupSize || 1
  const data = r.data
  const es = lang === 'es'

  let chartType = forceType || 'auto'
  if (chartType === 'auto') {
    if (n <= 1) chartType = 'imr'
    else if (n < 10) chartType = 'xr'
    else chartType = 'xs'
  }

  const groups = legacyMakeSubgroups(data, n <= 1 ? 1 : n)

  let topPts: number[] = [], topCL: number, topUCL: number, topLCL: number, topLabel: string, topSigma: number
  let botPts: (number | null)[] = [], botCL: number, botUCL: number, botLCL: number, botLabel: string, botSigma: number
  let noteText = ''
  if (chartType === 'imr') {
    topPts = data
    topCL = legacyMean(data)
    const mr = data.map((v, i) => i === 0 ? null : Math.abs(v - data[i - 1])).filter(v => v !== null) as number[]
    const mrBar = legacyMean(mr)
    const sigmaI = mrBar / 1.128
    topUCL = topCL + 3 * sigmaI
    topLCL = topCL - 3 * sigmaI
    topLabel = es ? `I — ${t('cc.individuals')}` : `I — ${t('cc.individuals')}`
    topSigma = sigmaI

    botPts = [null, ...mr]
    botCL = mrBar
    botUCL = 3.267 * mrBar
    botLCL = 0
    botLabel = `MR — ${t('cc.movingRange')}`
    botSigma = mrBar / 3.267

    noteText = t('cc.noteIMR')
  } else if (chartType === 'xr') {
    const C = legacyGetSPCConstants(Math.max(2, Math.min(25, n <= 1 ? 2 : n)))
    const xbars = groups.map(g => legacyMean(g))
    const ranges = groups.map(g => Math.max(...g) - Math.min(...g))
    const xDblBar = legacyMean(xbars)
    const rBar = legacyMean(ranges)

    topPts = xbars
    topCL = xDblBar
    topUCL = xDblBar + C.A2 * rBar
    topLCL = xDblBar - C.A2 * rBar
    topLabel = `X̄ — ${t('cc.means')} (n=${n})`
    topSigma = C.A2 * rBar / 3

    botPts = ranges
    botCL = rBar
    botUCL = C.D4 * rBar
    botLCL = C.D3 * rBar
    botLabel = `R — ${t('cc.ranges')} (n=${n})`
    botSigma = (C.D4 - C.D3) * rBar / 6

    noteText = t('cc.noteXR')
      .replace('%s', String(n)).replace('%.3f', C.A2.toFixed(3))
      .replace('%.3f', C.D3.toFixed(3)).replace('%.3f', C.D4.toFixed(3))
  } else { // xs
    const C = legacyGetSPCConstants(Math.max(2, Math.min(25, n <= 1 ? 2 : n)))
    const xbars = groups.map(g => legacyMean(g))
    const stdevs = groups.map(g => legacyStddev(g))
    const xDblBar = legacyMean(xbars)
    const sBar = legacyMean(stdevs)

    topPts = xbars
    topCL = xDblBar
    topUCL = xDblBar + C.A3 * sBar
    topLCL = xDblBar - C.A3 * sBar
    topLabel = `X̄ — ${t('cc.means')} (n=${n})`
    topSigma = C.A3 * sBar / 3

    botPts = stdevs
    botCL = sBar
    botUCL = C.B4 * sBar
    botLCL = C.B3 * sBar
    botLabel = `S — ${t('cc.stddevBot')} (n=${n})`
    botSigma = (C.B4 - C.B3) * sBar / 6

    noteText = t('cc.noteXS')
      .replace('%s', String(n)).replace('%.3f', C.A3.toFixed(3))
      .replace('%.3f', C.B3.toFixed(3)).replace('%.3f', C.B4.toFixed(3))
  }

  const topFiltered = topPts.filter(v => v !== null)
  const topViol = legacyWeViolations(topFiltered, topCL, topSigma)
  const botFiltered = botPts.filter(v => v !== null) as number[]
  const botViol = legacyWeViolations(botFiltered, botCL, Math.max(botSigma, 1e-10))

  return {
    chartType, noteText,
    topPts, topCL, topUCL, topLCL, topSigma, topLabel, topViol, topOOC: topViol.length,
    botPts, botCL, botUCL, botLCL, botSigma, botLabel, botViol, botOOC: botViol.length,
  }
}

// _buildCCData (PNG ejecutivo): distinta salvaguarda de sigma inferior (linea 7320)
export function legacyBuildCCExport(r: LegacyResult, n: number, chartType: string, lang: LegacyLang): Omit<LegacyCC, 'noteText'> {
  const t = (k: string) => LEGACY_LABELS[lang][k] || k
  const data = r.data
  const groups = legacyMakeSubgroups(data, n <= 1 ? 1 : n)

  let topPts: number[], topCL: number, topUCL: number, topLCL: number, topSigma: number, topLabel: string
  let botPts: (number | null)[], botCL: number, botUCL: number, botLCL: number, botSigma: number, botLabel: string

  if (chartType === 'imr') {
    topPts = data
    topCL = legacyMean(data)
    const mr = data.map((v, i) => i === 0 ? null : Math.abs(v - data[i - 1])).filter(v => v !== null) as number[]
    const mrBar = legacyMean(mr)
    const sigmaI = mrBar / 1.128
    topUCL = topCL + 3 * sigmaI; topLCL = topCL - 3 * sigmaI; topSigma = sigmaI
    topLabel = `I — ${t('cc.individuals')}`
    botPts = [null, ...mr]; botCL = mrBar
    botUCL = 3.267 * mrBar; botLCL = 0; botSigma = mrBar / 3.267
    botLabel = `MR — ${t('cc.movingRange')}`
  } else if (chartType === 'xr') {
    const C = legacyGetSPCConstants(Math.max(2, Math.min(25, n)))
    const xbars = groups.map(g => legacyMean(g))
    const ranges = groups.map(g => Math.max(...g) - Math.min(...g))
    const xDblBar = legacyMean(xbars), rBar = legacyMean(ranges)
    topPts = xbars; topCL = xDblBar; topUCL = xDblBar + C.A2 * rBar; topLCL = xDblBar - C.A2 * rBar
    topSigma = C.A2 * rBar / 3; topLabel = `X̄ — ${t('cc.means')} (n=${n})`
    botPts = ranges; botCL = rBar; botUCL = C.D4 * rBar; botLCL = C.D3 * rBar
    botSigma = (C.D4 - C.D3) * rBar / 6; botLabel = `R — ${t('cc.ranges')} (n=${n})`
  } else {
    const C = legacyGetSPCConstants(Math.max(2, Math.min(25, n)))
    const xbars = groups.map(g => legacyMean(g))
    const stdevs = groups.map(g => legacyStddev(g))
    const xDblBar = legacyMean(xbars), sBar = legacyMean(stdevs)
    topPts = xbars; topCL = xDblBar; topUCL = xDblBar + C.A3 * sBar; topLCL = xDblBar - C.A3 * sBar
    topSigma = C.A3 * sBar / 3; topLabel = `X̄ — ${t('cc.means')} (n=${n})`
    botPts = stdevs; botCL = sBar; botUCL = C.B4 * sBar; botLCL = C.B3 * sBar
    botSigma = (C.B4 - C.B3) * sBar / 6; botLabel = `S — ${t('cc.stddevBot')} (n=${n})`
  }

  const topF = topPts.filter(v => v !== null), botF = botPts.filter(v => v !== null) as number[]
  const topViol = legacyWeViolations(topF, topCL, topSigma)
  const botViol = legacyWeViolations(botF, botCL, botSigma > 0 ? botSigma : botCL / 3 || 0.001)
  return {
    topPts, topCL, topUCL, topLCL, topSigma, topLabel, topViol, topOOC: topViol.length,
    botPts, botCL, botUCL, botLCL, botSigma, botLabel, botViol, botOOC: botViol.length,
  }
}

// Extension vertical de una grafica de control (_drawCCChart 7138-7148)
export function legacyCCYExtent(pts: (number | null)[], cl: number, ucl: number, lcl: number) {
  const validPts = pts.map((v, i) => ({ v, i })).filter(p => p.v !== null)
  if (validPts.length < 2) return null
  const vals = validPts.map(p => p.v as number)
  const allVals = [...vals, ucl, lcl > 0 ? lcl : 0]
  let yMin = Math.min(...allVals)
  let yMax = Math.max(...allVals)
  const yPad = (yMax - yMin) * 0.15 || Math.abs(cl) * 0.1 || 0.01
  yMin -= yPad; yMax += yPad
  return { yMin, yMax, count: validPts.length }
}

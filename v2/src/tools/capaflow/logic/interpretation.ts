import type { AnalysisResult } from './types'

/** On-screen interpretation (HTML with <strong>), lines joined by a double <br>. */
export function buildInterpretation(r: AnalysisResult, es: boolean): string {
  const lines: string[] = []
  const cpk = r.Cpk

  if (cpk !== null) {
    if (cpk >= 1.67) lines.push(es ? `✅ <strong>Proceso World Class.</strong> Tu Cpk de ${cpk.toFixed(3)} supera 1.67 — variación mínima, perfectamente centrado. Menos de 0.6 PPM esperados.` : `✅ <strong>World Class Process.</strong> Your Cpk of ${cpk.toFixed(3)} exceeds 1.67 — minimal variation, perfectly centered. Less than 0.6 PPM expected.`)
    else if (cpk >= 1.33) lines.push(es ? `✅ <strong>Proceso Capaz.</strong> Cpk de ${cpk.toFixed(3)} cumple el estándar Six Sigma (≥1.33). Proceso bajo control con buena capacidad.` : `✅ <strong>Capable Process.</strong> Cpk of ${cpk.toFixed(3)} meets the Six Sigma standard (≥1.33). Process under control with good capability.`)
    else if (cpk >= 1.0) lines.push(es ? `⚠️ <strong>Proceso Marginal.</strong> Cpk de ${cpk.toFixed(3)} entre 1.0 y 1.33 — el proceso produce defectos. Se recomienda mejora.` : `⚠️ <strong>Marginal Process.</strong> Cpk of ${cpk.toFixed(3)} between 1.0 and 1.33 — producing some defects. Improvement recommended.`)
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

/** Plain-text interpretation for the executive PNG (adds PPM, drops markup and accents). */
export function buildInterpretationPlain(r: AnalysisResult, es: boolean): string[] {
  const lines: string[] = []
  const cpk = r.Cpk
  if (cpk !== null) {
    if (cpk >= 1.67) lines.push(es ? `Proceso World Class. Cpk=${cpk.toFixed(3)} supera 1.67 — variacion minima, perfectamente centrado. PPM esperados: ${Math.round(r.ppm || 0)}.` : `World Class Process. Cpk=${cpk.toFixed(3)} exceeds 1.67 — minimal variation, perfectly centered. Expected PPM: ${Math.round(r.ppm || 0)}.`)
    else if (cpk >= 1.33) lines.push(es ? `Proceso Capaz. Cpk=${cpk.toFixed(3)} cumple el estandar Six Sigma (>= 1.33). Proceso bajo control con buena capacidad. PPM: ${Math.round(r.ppm || 0)}.` : `Capable Process. Cpk=${cpk.toFixed(3)} meets Six Sigma standard (>= 1.33). Process under control with good capability. PPM: ${Math.round(r.ppm || 0)}.`)
    else if (cpk >= 1.0) lines.push(es ? `Proceso Marginal. Cpk=${cpk.toFixed(3)} entre 1.0 y 1.33 — produce defectos. Accion de mejora recomendada. PPM: ${Math.round(r.ppm || 0)}.` : `Marginal Process. Cpk=${cpk.toFixed(3)} between 1.0 and 1.33 — producing some defects. Improvement action recommended. PPM: ${Math.round(r.ppm || 0)}.`)
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

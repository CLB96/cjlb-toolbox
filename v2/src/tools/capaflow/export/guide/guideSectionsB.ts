// Guía de Lectura, segunda mitad: secciones 6 a 10 y pie (textos literales del original).
import { guideBoxPlot, guideDistComp, guideQQPlot, guideRunChart } from './guideCharts'
import type { Guide } from './guideKit'

/** Secciones 6 (Cp vs Cpk) y 7 (tabla de referencia). */
export function guideCpVsTable(g: Guide, Y0: number): number {
  const { c, P, isDark, es, W, PAD, VGAP, rr, hl, txt, sectionTitle } = g
  let Y = Y0
  sectionTitle(es ? '⑥ DIFERENCIA ENTRE Cp y Cpk' : '⑥ DIFFERENCE BETWEEN Cp and Cpk',
    es ? 'Por qué ambos importan' : 'Why both matter', PAD, Y, W - PAD * 2, '114,168,255')
  Y += 56 + 16

  const diffW = (W - PAD * 2 - 24) / 2
  rr(PAD, Y, diffW, 200, 12, P.surface, P.border, 1.5)
  guideDistComp(c, PAD, Y, diffW, 200, P, isDark, true, es)
  rr(PAD + diffW + 24, Y, diffW, 200, 12, P.surface, P.border, 1.5)
  guideDistComp(c, PAD + diffW + 24, Y, diffW, 200, P, isDark, false, es)
  Y += 200 + VGAP

  sectionTitle(es ? '⑦ TABLA DE REFERENCIA RÁPIDA' : '⑦ QUICK REFERENCE TABLE',
    es ? 'Todos los índices de un vistazo' : 'All indices at a glance', PAD, Y, W - PAD * 2, '226,180,255')
  Y += 56 + 16

  const refRows = es ? [
    ['Índice', 'Fórmula base', 'Usa σ', '¿Qué mide?', 'Meta mínima'],
    ['Cp', '(USL-LSL) / 6σ_within', 'Within', 'Capacidad potencial (espacio disponible)', '≥ 1.33'],
    ['Cpk', 'min(Cpu,Cpl)', 'Within', 'Capacidad real (centrado + variación)', '≥ 1.33'],
    ['Cpu', '(USL-x̄) / 3σ_within', 'Within', 'Capacidad hacia el límite superior', '≥ 1.00'],
    ['Cpl', '(x̄-LSL) / 3σ_within', 'Within', 'Capacidad hacia el límite inferior', '≥ 1.00'],
    ['Cpm', '(USL-LSL) / 6τ', 'Overall', 'Centrado respecto al Target (Taguchi)', '≥ 1.33'],
    ['Pp', '(USL-LSL) / 6σ_overall', 'Overall', 'Desempeño potencial (largo plazo)', '≥ 1.33'],
    ['Ppk', 'min(Ppu,Ppl)', 'Overall', 'Desempeño real (largo plazo)', '≥ 1.33'],
  ] : [
    ['Index', 'Base Formula', 'Uses σ', 'What it measures', 'Min. target'],
    ['Cp', '(USL-LSL) / 6σ_within', 'Within', 'Potential capability (available space)', '≥ 1.33'],
    ['Cpk', 'min(Cpu,Cpl)', 'Within', 'Real capability (centering + variation)', '≥ 1.33'],
    ['Cpu', '(USL-x̄) / 3σ_within', 'Within', 'Capability toward upper limit', '≥ 1.00'],
    ['Cpl', '(x̄-LSL) / 3σ_within', 'Within', 'Capability toward lower limit', '≥ 1.00'],
    ['Cpm', '(USL-LSL) / 6τ', 'Overall', 'Centering vs Target (Taguchi)', '≥ 1.33'],
    ['Pp', '(USL-LSL) / 6σ_overall', 'Overall', 'Potential performance (long term)', '≥ 1.33'],
    ['Ppk', 'min(Ppu,Ppl)', 'Overall', 'Real performance (long term)', '≥ 1.33'],
  ]
  const tW = W - PAD * 2, rowH = 44
  const cols = [120, 320, 120, 700, 160]
  refRows.forEach((row, ri) => {
    const ry = Y + ri * rowH
    if (ri % 2 === 1) rr(PAD, ry, tW, rowH, 0, isDark ? 'rgba(255,255,255,0.025)' : 'rgba(30,60,120,0.03)', null)
    if (ri === 0) {
      rr(PAD, ry, tW, rowH, 0, isDark ? 'rgba(226,180,255,0.08)' : 'rgba(139,63,217,0.06)', null)
      hl(PAD, PAD + tW, ry + rowH, P.border, 1.5)
    }
    let cx2 = PAD + 12
    row.forEach((cell, ci) => {
      const font = ri === 0 ? '700 17px "Space Grotesk", Inter, sans-serif' : '400 17px Inter, sans-serif'
      const color2 = ri === 0 ? P.accent : ci === 0 ? P.accent : ci === 4 ? P.green : P.textSub
      txt(cell, cx2, ry + rowH / 2 + 6, font, color2, 'left', cols[ci]! - 8)
      cx2 += cols[ci]!
    })
    hl(PAD, PAD + tW, ry + rowH, P.borderLight, 1)
  })
  return Y + refRows.length * rowH + VGAP
}

/** Secciones 8 (corrida), 9 (Q-Q) y 10 (caja) con sus recuadros de aviso. */
export function guideRunQqBox(g: Guide, Y0: number): number {
  const { c, P, isDark, es, W, PAD, VGAP, rr, sectionTitle, callout, annotations } = g
  let Y = Y0
  sectionTitle(es ? '⑧ GRÁFICA DE CORRIDA (RUN CHART)' : '⑧ RUN CHART',
    es ? '¿Los datos muestran tendencias o patrones en el tiempo?' : 'Do the data show trends or patterns over time?', PAD, Y, W - PAD * 2, '167,139,250')
  Y += 56 + 16

  const rcW = 760, rcH = 220
  rr(PAD, Y, rcW, rcH, 12, P.surface, P.border, 1.5)
  guideRunChart(c, PAD, Y, rcW, rcH, P, isDark, es)
  const rcItems = [
    { color: P.green, text: es ? 'PUNTOS VERDES = Por encima de la mediana. Valores superiores al valor central del proceso.' : 'GREEN POINTS = Above median. Values higher than the process center.' },
    { color: P.red, text: es ? 'PUNTOS ROJOS = Por debajo de la mediana. Valores inferiores al valor central del proceso.' : 'RED POINTS = Below median. Values below the process center.' },
    { color: P.yellow, text: es ? 'LÍNEA AMARILLA = Mediana (Md). Separa la mitad superior de la inferior. Más robusta que la media ante outliers.' : 'YELLOW LINE = Median (Md). Splits the upper half from the lower. More robust than the mean against outliers.' },
    { color: P.purple, text: es ? 'RACHAS = Secuencias de puntos en el mismo lado. Pocas rachas indican tendencia o patrón. Muchas indican alta variabilidad.' : 'RUNS = Sequences of points on the same side. Few runs indicate a trend or pattern. Many indicate high variability.' },
  ]
  const rcEnd = annotations(rcItems, PAD + rcW + 28, Y, W - PAD * 2 - rcW - 28, 62, 70, 20)
  Y += Math.max(rcH, rcEnd - Y) + VGAP

  Y += callout('📊', es ? '¿Cuántas rachas son "normales"?' : 'How many runs are "normal"?',
    es ? 'Con n₁ puntos sobre la mediana y n₂ bajo ella, el número esperado de rachas aleatorias es 1 + 2·n₁·n₂/(n₁+n₂) (≈ n/2 + 1). Si hay muy pocas rachas (tendencias largas), el proceso puede tener drift. Si hay demasiadas, puede haber sobre-ajuste o alternancia sistemática.'
      : 'With n₁ points above the median and n₂ below it, the expected number of random runs is 1 + 2·n₁·n₂/(n₁+n₂) (≈ n/2 + 1). Too few runs (long trends) may indicate process drift. Too many may indicate over-adjustment or systematic alternation.',
    PAD, Y, W - PAD * 2, P.purple, isDark ? 'rgba(167,139,250,0.08)' : 'rgba(124,58,237,0.06)', isDark ? 'rgba(167,139,250,0.25)' : 'rgba(124,58,237,0.22)')

  sectionTitle(es ? '⑨ PROBABILIDAD NORMAL (Q-Q PLOT)' : '⑨ NORMAL PROBABILITY PLOT (Q-Q)',
    es ? '¿Siguen tus datos una distribución normal?' : 'Do your data follow a normal distribution?', PAD, Y, W - PAD * 2, '251,146,60')
  Y += 56 + 16

  const qqW = 760, qqH = 260
  rr(PAD, Y, qqW, qqH, 12, P.surface, P.border, 1.5)
  guideQQPlot(c, PAD, Y, qqW, qqH, P, isDark, es)
  const qqItems = [
    { color: P.green, text: es ? 'LÍNEA VERDE = Distribución normal teórica. Si tus datos la siguen, el proceso es normal.' : 'GREEN LINE = Theoretical normal distribution. If your data follow it, the process is normal.' },
    { color: P.green, text: es ? 'PUNTOS VERDES = Datos con comportamiento normal. Idealmente todos deben caer sobre la línea.' : 'GREEN POINTS = Normally behaving data. Ideally all points should land on the line.' },
    { color: P.yellow, text: es ? 'PUNTOS AMARILLOS = Leve desviación de la normalidad. Monitorear.' : 'YELLOW POINTS = Slight deviation from normality. Monitor.' },
    { color: P.red, text: es ? 'PUNTOS ROJOS = Desviación significativa. Colas pesadas o outliers. Cpk puede no ser válido.' : 'RED POINTS = Significant deviation. Heavy tails or outliers. Cpk may not be valid.' },
  ]
  const qqEnd = annotations(qqItems, PAD + qqW + 28, Y, W - PAD * 2 - qqW - 28, 62, 70, 20)
  Y += Math.max(qqH, qqEnd - Y) + VGAP

  Y += callout('🔔', es ? 'Anderson-Darling — ¿cómo interpretar la p-value?' : 'Anderson-Darling — how to interpret the p-value?',
    es ? 'El test Anderson-Darling verifica si tus datos provienen de una distribución normal. Si p ≥ 0.05: sin evidencia de no-normalidad (Cpk válido). Si p < 0.05: posible no-normalidad — considera transformación Box-Cox o análisis no-paramétrico.'
      : 'The Anderson-Darling test checks whether your data come from a normal distribution. If p ≥ 0.05: no evidence of non-normality (Cpk is valid). If p < 0.05: possible non-normality — consider Box-Cox transformation or non-parametric analysis.',
    PAD, Y, W - PAD * 2, P.orange, isDark ? 'rgba(251,146,60,0.08)' : 'rgba(194,65,12,0.06)', isDark ? 'rgba(251,146,60,0.25)' : 'rgba(194,65,12,0.22)')

  sectionTitle(es ? '⑩ DIAGRAMA DE CAJA (BOX PLOT)' : '⑩ BOX PLOT',
    es ? 'Detecta outliers y visualiza la distribución de tus datos' : 'Detect outliers and visualize your data distribution', PAD, Y, W - PAD * 2, '139,92,246')
  Y += 56 + 16

  const boxW = 760, boxH = 280
  rr(PAD, Y, boxW, boxH, 12, P.surface, P.border, 1.5)
  guideBoxPlot(c, PAD, Y, boxW, boxH, P, isDark)
  const boxItems = [
    { color: isDark ? '#8b5cf6' : '#6d28d9', text: es ? 'CAJA (BOX) = Rango intercuartílico (IQR = Q3 - Q1). Contiene el 50% central de los datos.' : 'BOX = Interquartile range (IQR = Q3 - Q1). Contains the middle 50% of data.' },
    { color: isDark ? '#f8b84f' : '#f59e0b', text: es ? 'LÍNEA AMARILLA = Mediana (Q2). Divide los datos en dos mitades iguales.' : 'YELLOW LINE = Median (Q2). Divides data into two equal halves.' },
    { color: isDark ? '#06b6d4' : '#0891b2', text: es ? 'PUNTO CYAN = Media (x̄). Compara con mediana para detectar asimetría.' : 'CYAN POINT = Mean (x̄). Compare with median to detect skewness.' },
    { color: P.red, text: es ? 'PUNTOS ROJOS = Outliers (valores >1.5×IQR fuera de Q1/Q3). Investigar causas especiales.' : 'RED POINTS = Outliers (values >1.5×IQR outside Q1/Q3). Investigate special causes.' },
  ]
  const boxEnd = annotations(boxItems, PAD + boxW + 28, Y, W - PAD * 2 - boxW - 28, 68, 76, 20)
  Y += Math.max(boxH, boxEnd - Y) + VGAP

  Y += callout('⚠️', es ? 'Outliers — ¿removerlos o investigarlos?' : 'Outliers — remove or investigate?',
    es ? 'NUNCA remuevas outliers sin investigar. Pueden indicar: (1) Errores de medición → corregir; (2) Causas especiales del proceso → eliminar la causa raíz; (3) Variación natural extrema → aceptar si no hay causa asignable. Documentar siempre la decisión.'
      : 'NEVER remove outliers without investigation. They may indicate: (1) Measurement errors → correct; (2) Process special causes → eliminate root cause; (3) Natural extreme variation → accept if no assignable cause. Always document the decision.',
    PAD, Y, W - PAD * 2, P.red, isDark ? 'rgba(255,118,131,0.08)' : 'rgba(217,58,76,0.06)', isDark ? 'rgba(255,118,131,0.25)' : 'rgba(217,58,76,0.22)')
  return Y
}

/** Pie de la guía; devuelve la Y final (sin el margen de 60 px). */
export function guideFooter(g: Guide, Y0: number): number {
  const { P, es, W, PAD, hl, txt } = g
  let Y = Y0 + 16
  hl(PAD, W - PAD, Y, P.borderLight, 1)
  Y += 20
  txt('CapaFlow — capaflow.app', PAD, Y + 20, '700 18px "Space Grotesk", Inter, sans-serif', P.textDim, 'left')
  txt(es ? 'Esta guía es un resumen educativo basado en la metodología Six Sigma. Para análisis críticos consulta a un Black Belt certificado.' : 'This guide is an educational summary based on Six Sigma methodology. For critical analyses, consult a certified Black Belt.',
    W / 2, Y + 20, '400 16px Inter, sans-serif', P.textDim, 'center', W - PAD * 2 - 200)
  const now = new Date().toLocaleDateString(es ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  txt(now, W - PAD, Y + 20, '400 16px Inter, sans-serif', P.textDim, 'right')
  return Y
}

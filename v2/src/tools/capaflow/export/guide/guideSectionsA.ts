// Guía de Lectura, primera mitad: encabezado, introducción y secciones 1 a 5 (textos literales del original).
import { guideCCChart, guideHistogram } from './guideCharts'
import { drawBrandMark } from '../nebulaKit'
import { wrapText, type Guide } from './guideKit'

export function guideHeader(g: Guide): number {
  const { c, P, isDark, es, W, PAD, VGAP, rr, hl, txt } = g
  const hg = c.createLinearGradient(0, 0, W, 120)
  hg.addColorStop(0, isDark ? 'rgba(226,180,255,0.10)' : 'rgba(139,63,217,0.08)'); hg.addColorStop(1, 'transparent')
  c.fillStyle = hg; c.fillRect(0, 0, W, 120)
  hl(0, W, 120, P.border, 1.5)

  drawBrandMark(c, PAD, 20, 60)
  txt('CapaFlow', PAD + 76, 54, '800 38px "Space Grotesk", Inter, sans-serif', P.text, 'left')
  txt(es ? 'Análisis de Capacidad de Proceso · Six Sigma' : 'Process Capability Analysis · Six Sigma', PAD + 76, 80, '400 19px Inter, sans-serif', P.textSub, 'left')

  const guideTitle = es ? 'GUÍA RÁPIDA DE LECTURA' : 'QUICK READING GUIDE'
  txt(guideTitle, W - PAD, 52, '800 28px "Space Grotesk", Inter, sans-serif', P.accent, 'right')
  txt(es ? 'Cómo interpretar tu análisis Six Sigma' : 'How to interpret your Six Sigma analysis', W - PAD, 78, '400 18px Inter, sans-serif', P.textSub, 'right')
  let Y = 120 + VGAP

  rr(PAD, Y, W - PAD * 2, 72, 14, isDark ? 'rgba(226,180,255,0.07)' : 'rgba(139,63,217,0.06)', P.border, 1.5)
  txt(es ? 'Este reporte te dice si tu proceso de producción está bajo control y cumple los estándares de calidad. Aquí aprenderás a leer cada sección.' : 'This report tells you whether your production process is in control and meets quality standards. Here you will learn to read each section.',
    PAD + 24, Y + 28, '400 20px Inter, sans-serif', P.text, 'left', W - PAD * 2 - 48)
  txt(es ? 'No necesitas ser experto — sigue esta guía de arriba a abajo.' : 'No expertise needed — follow this guide from top to bottom.',
    PAD + 24, Y + 52, '400 17px Inter, sans-serif', P.textSub, 'left')
  Y += 72 + VGAP
  return Y
}

/** Secciones 1 (los 3 números clave) y la escala Cpk. */
export function guideKeyNumbers(g: Guide, Y0: number): number {
  const { c, P, isDark, es, W, PAD, VGAP, rr, hl, txt, sectionTitle } = g
  let Y = Y0
  sectionTitle(es ? '① LOS 3 NÚMEROS CLAVE' : '① THE 3 KEY NUMBERS',
    es ? 'Lo primero que debes mirar' : 'The first thing to look at', PAD, Y, W - PAD * 2, '226,180,255')
  Y += 56 + 16

  const k3W = (W - PAD * 2 - 32) / 3
  const kpiDefs = [
    {
      key: 'Cpk', color: '226,180,255',
      name: es ? 'Capacidad Real' : 'Real Capability',
      what: es ? 'Mide qué tan bien CABE la distribución dentro de los límites, considerando si está centrada o no.' : 'Measures how well the distribution FITS within the limits, considering whether it is centered or not.',
      rule: es ? 'Meta mínima: Cpk ≥ 1.33' : 'Minimum target: Cpk ≥ 1.33',
    },
    {
      key: 'Cp', color: '114,168,255',
      name: es ? 'Capacidad Potencial' : 'Potential Capability',
      what: es ? 'Mide el espacio disponible vs el tamaño de la distribución. No considera si está centrada.' : 'Measures available space vs distribution size. Does NOT consider centering.',
      rule: es ? 'Si Cp >> Cpk: el proceso no está centrado' : 'If Cp >> Cpk: process is off-center',
    },
    {
      key: 'Ppk', color: '89,201,127',
      name: es ? 'Desempeño Real' : 'Real Performance',
      what: es ? 'Como Cpk pero usa la variación TOTAL histórica (largo plazo). Incluye todas las fuentes de variación.' : 'Like Cpk but uses TOTAL historical variation (long term). Includes all sources of variation.',
      rule: es ? 'Si Ppk << Cpk: hay variación entre turnos/lotes' : 'If Ppk << Cpk: variation between shifts/batches',
    },
  ]
  kpiDefs.forEach((k, i) => {
    const kx = PAD + i * (k3W + 16), ky = Y
    rr(kx, ky, k3W, 220, 16, P.surface, `rgba(${k.color},0.20)`, 2)
    rr(kx, ky, k3W, 5, [2, 2, 0, 0], `rgba(${k.color},0.9)`, null)
    txt(k.key, kx + k3W / 2, ky + 52, '800 48px "Space Grotesk", Inter, sans-serif', `rgba(${k.color},0.95)`, 'center')
    txt(k.name, kx + k3W / 2, ky + 76, '600 18px Inter, sans-serif', P.textSub, 'center')
    hl(kx + 20, kx + k3W - 20, ky + 88, P.borderLight, 1)
    c.font = '400 16px Inter, sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left'
    wrapText(c, k.what, k3W - 32, '400 16px Inter, sans-serif').forEach((ln, j) => c.fillText(ln, kx + 16, ky + 108 + j * 21))
    rr(kx + 16, ky + 188, k3W - 32, 24, 8, `rgba(${k.color},0.10)`, `rgba(${k.color},0.25)`, 1)
    txt(k.rule, kx + k3W / 2, ky + 204, '500 14px Inter, sans-serif', `rgba(${k.color},0.9)`, 'center')
  })
  Y += 220 + VGAP

  rr(PAD, Y, W - PAD * 2, 100, 12, P.surface, P.border, 1.5)
  const scaleW = W - PAD * 2 - 170
  const scaleX = PAD + 110, scaleY2 = Y + 38, scaleH = 22
  const zones2 = [
    { from: 0, to: 1.0, label: es ? 'No Capaz' : 'Not Capable', color: P.red, bg: P.redBg },
    { from: 1.0, to: 1.33, label: 'Marginal', color: P.yellow, bg: P.yellowBg },
    { from: 1.33, to: 1.67, label: es ? 'Capaz' : 'Capable', color: P.green, bg: P.greenBg },
    { from: 1.67, to: 2.0, label: 'World Class', color: P.accent2, bg: isDark ? 'rgba(114,168,255,0.14)' : 'rgba(79,140,255,0.10)' },
  ]
  const maxCpk = 2.0
  txt(es ? 'Escala Cpk:' : 'Cpk Scale:', PAD + 12, scaleY2 + scaleH / 2 + 6, '600 16px Inter, sans-serif', P.textDim, 'left')
  zones2.forEach((z) => {
    const zx = scaleX + (z.from / maxCpk) * scaleW, zw = (z.to - z.from) / maxCpk * scaleW
    rr(zx, scaleY2, zw, scaleH, 0, z.bg, z.color, 1.5)
    c.font = '600 14px Inter, sans-serif'; c.fillStyle = z.color; c.textAlign = 'center'
    c.fillText(z.label, zx + zw / 2, scaleY2 + scaleH / 2 + 5)
  })
  ;[0, 1.0, 1.33, 1.67, 2.0].forEach((v) => {
    const tx = scaleX + (v / maxCpk) * scaleW
    txt(v.toFixed(v % 1 === 0 ? 0 : 2), tx, scaleY2 + scaleH + 18, '500 14px Inter, sans-serif', P.textDim, 'center')
  })
  return Y + 100 + VGAP
}

/** Secciones 2 (histograma) y 3 (PPM). */
export function guideHistogramPpm(g: Guide, Y0: number): number {
  const { c, P, isDark, es, W, PAD, VGAP, rr, hl, txt, sectionTitle } = g
  let Y = Y0
  sectionTitle(es ? '② EL HISTOGRAMA + CURVA NORMAL' : '② HISTOGRAM + NORMAL CURVE',
    es ? 'La foto de tu proceso' : 'The picture of your process', PAD, Y, W - PAD * 2, '89,201,127')
  Y += 56 + 16

  const hW = 760, hH = 280
  rr(PAD, Y, hW, hH, 14, P.surface, P.border, 1.5)
  guideHistogram(c, PAD, Y, hW, hH, isDark)
  const annX = PAD + hW + 28, annW = W - PAD * 2 - hW - 28
  let annY = Y
  const annotationItems = [
    { color: P.accent2, icon: '▬', text: es ? 'BARRAS — Frecuencia de cada valor. La altura = cuántas veces ocurrió ese valor en tu proceso.' : 'BARS — Frequency of each value. Height = how many times that value occurred in your process.' },
    { color: P.green, icon: '~', text: es ? 'CURVA NORMAL — La distribución teórica. Si las barras siguen la curva, tu proceso es estable y predecible.' : 'NORMAL CURVE — Theoretical distribution. If bars follow the curve, your process is stable and predictable.' },
    { color: P.red, icon: '|', text: es ? 'LSL / USL — Límites de especificación. Barras fuera de estas líneas = DEFECTOS. Quieres que TODO esté entre ellas.' : 'LSL / USL — Specification limits. Bars outside these lines = DEFECTS. You want EVERYTHING between them.' },
    { color: isDark ? P.accent : P.accent2, icon: '--', text: es ? 'MEDIA (x̄) — El valor promedio de tu proceso. Idealmente debería estar centrada entre LSL y USL.' : 'MEAN (x̄) — Average value of your process. Ideally should be centered between LSL and USL.' },
  ]
  annotationItems.forEach((item) => {
    rr(annX, annY, annW, 64, 10, P.surface, P.borderLight, 1)
    rr(annX, annY, 4, 64, [2, 0, 0, 2], item.color, null)
    txt(item.icon, annX + 14, annY + 22, 'bold 18px "Space Grotesk", Inter, sans-serif', item.color, 'left')
    c.font = '400 16px Inter, sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left'
    wrapText(c, item.text, annW - 36, '400 16px Inter, sans-serif').forEach((l, i) => c.fillText(l, annX + 36, annY + 20 + i * 20))
    annY += 72
  })
  Y += Math.max(hH, annY - Y) + VGAP

  sectionTitle(es ? '③ PPM — DEFECTOS ESPERADOS' : '③ PPM — EXPECTED DEFECTS',
    es ? 'Cuántas piezas defectuosas esperas por millón' : 'How many defective parts to expect per million', PAD, Y, W - PAD * 2, '248,184,79')
  Y += 56 + 16

  const ppmCards = [
    { cpk: '< 1.00', ppm: '> 2,700 PPM', icon: '❌', desc: es ? 'Más de 2,700 defectos por millón de piezas. Proceso fuera de control.' : 'More than 2,700 defects per million parts. Out-of-control process.', col: P.red, bg: P.redBg, bd: P.redBd },
    { cpk: '1.00–1.33', ppm: '64–2,700 PPM', icon: '⚠️', desc: es ? 'Proceso marginal. Mejoras necesarias para alcanzar Six Sigma.' : 'Marginal process. Improvements needed to reach Six Sigma.', col: P.yellow, bg: P.yellowBg, bd: P.yellowBd },
    { cpk: '1.33–1.67', ppm: '< 64 PPM', icon: '✅', desc: es ? 'Proceso capaz. Estándar de la industria. Menos de 64 defectos por millón.' : 'Capable process. Industry standard. Less than 64 defects per million.', col: P.green, bg: P.greenBg, bd: P.greenBd },
    { cpk: '≥ 1.67', ppm: '< 0.6 PPM', icon: '⭐', desc: es ? 'World Class / Six Sigma. Virtualmente cero defectos.' : 'World Class / Six Sigma. Virtually zero defects.', col: P.accent2, bg: isDark ? 'rgba(114,168,255,0.12)' : 'rgba(79,140,255,0.08)', bd: isDark ? 'rgba(114,168,255,0.38)' : 'rgba(79,140,255,0.30)' },
  ]
  const pW4 = (W - PAD * 2 - 48) / 4
  ppmCards.forEach((p, i) => {
    const px = PAD + i * (pW4 + 16), py = Y
    rr(px, py, pW4, 160, 14, p.bg, p.bd, 2)
    txt(p.icon, px + pW4 / 2, py + 38, '32px Inter, sans-serif', p.col, 'center')
    txt('Cpk ' + p.cpk, px + pW4 / 2, py + 66, '700 17px "Space Grotesk", Inter, sans-serif', p.col, 'center')
    txt(p.ppm, px + pW4 / 2, py + 90, '800 22px "Space Grotesk", Inter, sans-serif', p.col, 'center')
    hl(px + 16, px + pW4 - 16, py + 102, P.borderLight, 1)
    c.font = '400 14px Inter, sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'center'
    wrapText(c, p.desc, pW4 - 24, '400 14px Inter, sans-serif').forEach((l, j) => c.fillText(l, px + pW4 / 2, py + 120 + j * 18))
  })
  return Y + 160 + VGAP
}

/** Secciones 4 (gráficas de control) y 5 (reglas Western Electric). */
export function guideControlCharts(g: Guide, Y0: number): number {
  const { c, P, isDark, es, W, PAD, VGAP, rr, txt, sectionTitle, annotations } = g
  let Y = Y0
  sectionTitle(es ? '④ GRÁFICAS DE CONTROL (X̄-R / I-MR)' : '④ CONTROL CHARTS (X̄-R / I-MR)',
    es ? '¿El proceso es estable en el tiempo?' : 'Is the process stable over time?', PAD, Y, W - PAD * 2, '167,139,250')
  Y += 56 + 16

  const ccW = 760, ccH = 200
  rr(PAD, Y, ccW, ccH, 12, P.surface, P.border, 1.5)
  guideCCChart(c, PAD, Y, ccW, ccH, P, isDark)
  const ccItems = [
    { color: P.red, text: es ? 'PUNTO ROJO = Fuera de control. Algo inusual pasó en ese momento (cambio de material, operador, máquina). ¡Investiga!' : 'RED POINT = Out of control. Something unusual happened at that moment (material change, operator, machine). Investigate!' },
    { color: isDark ? P.accent : P.accent2, text: es ? 'LÍNEA CENTRAL (CL) = El promedio del proceso. Los puntos deberían oscilar aleatoriamente alrededor de esta línea.' : 'CENTER LINE (CL) = Process average. Points should randomly fluctuate around this line.' },
    { color: P.red, text: es ? 'UCL / LCL = Límites de control estadístico (±3σ). Son calculados, NO son las especificaciones del cliente.' : 'UCL / LCL = Statistical control limits (±3σ). These are CALCULATED, NOT customer specifications.' },
    { color: P.yellow, text: es ? 'ZONA ±2σ = Señal de advertencia. 2 de 3 puntos consecutivos aquí indican una tendencia preocupante.' : '±2σ ZONE = Warning signal. 2 of 3 consecutive points here indicate a concerning trend.' },
  ]
  const ccEnd = annotations(ccItems, PAD + ccW + 28, Y, W - PAD * 2 - ccW - 28, 62, 70, 20)
  Y += Math.max(ccH, ccEnd - Y) + VGAP

  sectionTitle(es ? '⑤ REGLAS WESTERN ELECTRIC — ¿Cuándo actuar?' : '⑤ WESTERN ELECTRIC RULES — When to act?',
    es ? '4 señales que indican que tu proceso necesita atención' : '4 signals indicating your process needs attention', PAD, Y, W - PAD * 2, '251,146,60')
  Y += 56 + 16

  const weRules = [
    { num: '1', color: P.red, title: es ? 'Regla 1 — Un punto más allá de 3σ' : 'Rule 1 — One point beyond 3σ',
      desc: es ? 'Si cualquier punto individual cae fuera de los límites UCL o LCL, hay una causa especial de variación. Requiere investigación inmediata.' : 'If any individual point falls outside UCL or LCL, there is a special cause of variation. Requires immediate investigation.' },
    { num: '2', color: P.yellow, title: es ? 'Regla 2 — 2 de 3 puntos más allá de 2σ (mismo lado)' : 'Rule 2 — 2 of 3 points beyond 2σ (same side)',
      desc: es ? 'Cuando 2 de 3 puntos consecutivos están en la zona de advertencia del mismo lado de la línea central, indica una tendencia emergente.' : 'When 2 of 3 consecutive points are in the warning zone on the same side of the center line, it indicates an emerging trend.' },
    { num: '3', color: P.orange, title: es ? 'Regla 3 — 6 puntos consecutivos en tendencia' : 'Rule 3 — 6 consecutive points trending',
      desc: es ? 'Seis puntos seguidos subiendo o bajando indican que el proceso está a la deriva (drift). Busca desgaste de herramienta, temperatura, etc.' : 'Six consecutive points going up or down indicate process drift. Look for tool wear, temperature changes, etc.' },
    { num: '4', color: P.purple, title: es ? 'Regla 4 — 8 puntos consecutivos en el mismo lado' : 'Rule 4 — 8 consecutive points on the same side',
      desc: es ? 'Ocho puntos seguidos al mismo lado de la línea central indican un cambio sostenido en el nivel del proceso (shift). El proceso se desplazó.' : 'Eight consecutive points on the same side of the center line indicate a sustained shift in process level. The process has shifted.' },
  ]
  const weW = (W - PAD * 2 - 48) / 2
  weRules.forEach((rule, i) => {
    const wx = PAD + (i % 2) * (weW + 16), wy = Y + Math.floor(i / 2) * 120
    rr(wx, wy, weW, 110, 12, isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)', rule.color, 1.5)
    rr(wx, wy, 4, 110, [2, 0, 0, 2], rule.color, null)
    rr(wx + 14, wy + 14, 30, 30, 15, rule.color, null)
    txt(rule.num, wx + 29, wy + 34, '800 17px "Space Grotesk", Inter, sans-serif', isDark ? '#160c2e' : '#fff', 'center')
    txt(rule.title, wx + 54, wy + 32, '700 18px "Space Grotesk", Inter, sans-serif', P.text, 'left', weW - 70)
    c.font = '400 16px Inter, sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left'
    wrapText(c, rule.desc, weW - 60, '400 16px Inter, sans-serif').forEach((l, j) => c.fillText(l, wx + 54, wy + 56 + j * 20, weW - 70))
  })
  return Y + 240 + VGAP
}

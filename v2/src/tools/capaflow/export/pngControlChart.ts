// Gráfica de control del Resumen Ejecutivo PNG (_pngCCChart). Límites y violaciones vienen de logic/controlCharts.
import type { ExportEnv, ExportPalette } from './exportEnv'

export interface PngCCInput {
  pts: (number | null)[]
  cl: number
  ucl: number
  lcl: number
  sigma: number
  violIdx: number[]
  chartLabel: string
  oocCount: number
  isTop: boolean
}

export function pngCCChart(c: CanvasRenderingContext2D, cardX: number, cardY: number, cardW: number, cardH: number, d: PngCCInput, P: ExportPalette, env: ExportEnv): void {
  const { isDark, t } = env
  const { pts, cl, ucl, lcl, sigma, violIdx, chartLabel, oocCount, isTop } = d
  const PAD_L = 72, PAD_R = 100, PAD_T = 46, PAD_B = 44
  const pW = cardW - PAD_L - PAD_R, pH = cardH - PAD_T - PAD_B
  const ox = cardX + PAD_L, oy = cardY + PAD_T

  const rr = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string, sw = 1.5) => {
    c.beginPath(); c.roundRect(x, y, w, h, r)
    c.fillStyle = fill; c.fill()
    c.strokeStyle = stroke; c.lineWidth = sw; c.stroke()
  }

  const validPts = pts.map((v, i) => ({ v, i })).filter((p) => p.v !== null) as { v: number; i: number }[]
  if (validPts.length < 2) return
  const vals = validPts.map((p) => p.v)

  const safeUCL = isFinite(ucl) ? ucl : cl * 2
  const safeLCL = isFinite(lcl) ? lcl : 0
  const allV = [...vals, safeUCL, safeLCL]
  let yMin = Math.min(...allV), yMax = Math.max(...allV)
  const yPad = (yMax - yMin) * 0.18 || Math.abs(cl) * 0.1 || 0.001
  yMin -= yPad; yMax += yPad

  const toY = (v: number) => oy + pH - ((v - yMin) / (yMax - yMin)) * pH
  const toX = (i: number) => ox + (i / Math.max(validPts.length - 1, 1)) * pW

  c.font = '600 20px Inter, sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left'
  c.fillText(chartLabel, cardX + PAD_L, cardY + 28)
  const badgeText = oocCount > 0 ? `⚠ ${oocCount} ${t('png.ccOOC')}` : `✓ ${t('png.ccInControl')}`
  const badgeColor = oocCount > 0 ? P.red : P.green
  const badgeBg = oocCount > 0 ? P.redBg : P.greenBg
  const badgeBd = oocCount > 0 ? P.redBorder : P.greenBorder
  c.font = '500 17px Inter, sans-serif'
  const labelW = c.measureText(chartLabel).width
  const bw = c.measureText(badgeText).width + 28
  rr(cardX + PAD_L + labelW + 16, cardY + 12, bw, 24, 12, badgeBg, badgeBd, 1.5)
  c.fillStyle = badgeColor; c.textAlign = 'left'
  c.fillText(badgeText, cardX + PAD_L + labelW + 30, cardY + 28)

  for (let g = 0; g <= 4; g++) {
    const gy = oy + (g / 4) * pH
    c.beginPath(); c.moveTo(ox, gy); c.lineTo(ox + pW, gy)
    c.strokeStyle = P.grid; c.lineWidth = 1; c.stroke()
  }

  const sigmaForZone = sigma > 0 ? sigma : (yMax - yMin) / 6
  const u2 = toY(cl + 2 * sigmaForZone), u3 = toY(safeUCL)
  const l2 = toY(cl - 2 * sigmaForZone), l3 = toY(safeLCL > yMin ? safeLCL : yMin + 0.001)
  c.fillStyle = isDark ? 'rgba(248,184,79,0.06)' : 'rgba(176,112,0,0.04)'
  if (u3 < u2) c.fillRect(ox, u3, pW, Math.max(0, u2 - u3))
  if (l2 < l3) c.fillRect(ox, l2, pW, Math.max(0, l3 - l2))

  const hLn = (y: number, col: string, dash: number[], lw: number) => {
    if (!isFinite(y) || y < oy - 10 || y > oy + pH + 10) return
    c.beginPath(); c.setLineDash(dash); c.moveTo(ox, y); c.lineTo(ox + pW, y)
    c.strokeStyle = col; c.lineWidth = lw; c.stroke(); c.setLineDash([])
  }
  hLn(toY(safeUCL), P.red, [8, 6], 2.5)
  if (safeLCL > yMin) hLn(toY(safeLCL), P.red, [8, 6], 2.5)
  hLn(toY(cl + 2 * sigmaForZone), isDark ? 'rgba(248,184,79,0.5)' : 'rgba(176,112,0,0.45)', [4, 5], 1.5)
  if (cl - 2 * sigmaForZone > yMin) hLn(toY(cl - 2 * sigmaForZone), isDark ? 'rgba(248,184,79,0.5)' : 'rgba(176,112,0,0.45)', [4, 5], 1.5)
  const clColor = isTop ? (isDark ? 'rgba(226,180,255,0.75)' : 'rgba(139,63,217,0.75)') : (isDark ? 'rgba(114,168,255,0.75)' : 'rgba(79,140,255,0.75)')
  hLn(toY(cl), clColor, [], 2.5)

  c.font = 'bold 14px "Space Grotesk", Inter, sans-serif'; c.textAlign = 'left'
  const uclY2 = toY(safeUCL)
  if (uclY2 > oy && uclY2 < oy + pH) { c.fillStyle = P.red; c.fillText('UCL', ox + pW + 8, uclY2 + 5) }
  const clY2 = toY(cl)
  if (clY2 > oy && clY2 < oy + pH) { c.fillStyle = isTop ? P.accent : P.accent2; c.fillText('CL', ox + pW + 8, clY2 + 5) }
  if (safeLCL > yMin) { const lclY2 = toY(safeLCL); if (lclY2 > oy && lclY2 < oy + pH) { c.fillStyle = P.red; c.fillText('LCL', ox + pW + 8, lclY2 + 5) } }

  c.font = '13px Inter, sans-serif'; c.fillStyle = P.textDim; c.textAlign = 'right'
  for (let g = 0; g <= 4; g++) {
    const v = yMin + (g / 4) * (yMax - yMin)
    const dp = Math.abs(v) < 1 ? 4 : v < 100 ? 3 : 1
    c.fillText(v.toFixed(dp), ox - 10, oy + pH - (g / 4) * pH + 5)
  }

  const lineCol = isTop ? clColor : (isDark ? 'rgba(114,168,255,0.85)' : 'rgba(79,140,255,0.85)')
  c.beginPath()
  validPts.forEach((p, i) => { if (i === 0) c.moveTo(toX(i), toY(p.v)); else c.lineTo(toX(i), toY(p.v)) })
  c.strokeStyle = lineCol; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke()

  const vSet = new Set(violIdx)
  validPts.forEach((p, i) => {
    const x = toX(i), y = toY(p.v), isV = vSet.has(i)
    c.beginPath(); c.arc(x, y, isV ? 6 : 4, 0, Math.PI * 2)
    if (isV) {
      c.fillStyle = P.red; c.shadowColor = P.red; c.shadowBlur = 14; c.fill(); c.shadowBlur = 0
      c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2)
      c.strokeStyle = isDark ? 'rgba(255,118,131,0.4)' : 'rgba(217,58,76,0.4)'; c.lineWidth = 1.5; c.stroke()
    } else {
      c.fillStyle = lineCol; c.fill()
    }
  })

  c.font = '13px Inter, sans-serif'; c.fillStyle = P.textDim; c.textAlign = 'center'
  const step = Math.max(1, Math.ceil(validPts.length / 16))
  validPts.forEach((_p, i) => {
    if (i % step === 0 || i === validPts.length - 1) c.fillText(String(i + 1), toX(i), oy + pH + 28)
  })

  const legY = oy + pH + 40
  const dot = (x: number, y: number, col: string) => { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.fill() }
  const dash2 = (x: number, y: number, col: string, dd: number[]) => {
    c.beginPath(); c.setLineDash(dd); c.moveTo(x, y); c.lineTo(x + 22, y)
    c.strokeStyle = col; c.lineWidth = 2; c.stroke(); c.setLineDash([])
  }
  c.font = '13px Inter, sans-serif'; c.fillStyle = P.textDim; c.textAlign = 'left'
  dot(ox + 10, legY, lineCol); c.fillText(t('cc.cl'), ox + 20, legY + 5)
  dash2(ox + 70, legY, P.red, [6, 4]); c.fillText('UCL/LCL', ox + 98, legY + 5)
  dash2(ox + 185, legY, isDark ? 'rgba(248,184,79,0.65)' : 'rgba(176,112,0,0.65)', [4, 3])
  c.fillText('±2σ', ox + 213, legY + 5)
  dot(ox + 270, legY, P.red); c.fillText(t('png.ccOOC'), ox + 280, legY + 5)
}

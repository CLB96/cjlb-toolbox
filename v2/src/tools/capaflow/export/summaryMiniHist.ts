// Mini histograma de cada punto en el resumen comparativo (_summaryDrawMiniHist): renderer propio, no el de pantalla.
import { normPDF, type AnalysisResult } from '../logic'
import { fmt, type ExportEnv, type ExportPalette } from './exportEnv'
import type { CpkColorFn } from './summaryParts'

export function summaryDrawMiniHist(
  c: CanvasRenderingContext2D, bx: number, by: number, bw: number, bh: number, r: AnalysisResult, posNum: number,
  P: ExportPalette, cpkColor: CpkColorFn, env: ExportEnv,
): void {
  const HDR = 32
  const PAD_L = 40, PAD_R = 6, PAD_T = HDR + 6, PAD_B = 22
  const pW = bw - PAD_L - PAD_R
  const pH = bh - PAD_T - PAD_B
  const ox = bx + PAD_L, oy = by + PAD_T

  if (pH < 20 || pW < 30) return

  c.fillStyle = P.surface; c.fillRect(bx, by, bw, bh)
  const cpkCol = cpkColor(r.Cpk)
  c.fillStyle = cpkCol; c.fillRect(bx, by, 3, bh)

  c.beginPath(); c.rect(bx, by, bw, bh)
  c.strokeStyle = P.border; c.lineWidth = 0.8; c.stroke()

  c.fillStyle = P.headerBg; c.fillRect(bx, by, bw, HDR)

  c.font = '700 11px "Space Grotesk", Inter, sans-serif'; c.fillStyle = cpkCol
  c.textAlign = 'left'; c.fillText(`#${posNum}`, bx + 6, by + 21)

  // Nombre truncado. Quirk original: la comparación usa el texto de respaldo en español, así que en EN sin nombre añade "…".
  const maxNameW = bw - 90
  let displayName = r.pointName || (env.lang === 'es' ? `Punto ${posNum}` : `Point ${posNum}`)
  c.font = '600 10px Inter, sans-serif'; c.fillStyle = P.textSub
  while (c.measureText(displayName).width > maxNameW && displayName.length > 3) {
    displayName = displayName.slice(0, -1)
  }
  if (displayName !== (r.pointName || `Punto ${posNum}`)) displayName += '…'
  c.textAlign = 'left'; c.fillText(displayName, bx + 26, by + 21)

  c.font = '700 10px "Space Grotesk", Inter, sans-serif'; c.fillStyle = cpkCol
  c.textAlign = 'right'; c.fillText(`Cpk ${fmt(r.Cpk)}`, bx + bw - 5, by + 21)

  if (!r.data || r.data.length < 2) {
    c.font = '400 11px Inter, sans-serif'; c.fillStyle = P.textDim
    c.textAlign = 'center'; c.fillText('Sin datos', bx + bw / 2, by + bh / 2)
    return
  }

  const bins = Math.max(6, Math.min(14, Math.ceil(Math.sqrt(r.data.length))))
  const ext = r.sOverall * 0.55
  const dMin = r.minV - ext, dMax = r.maxV + ext
  const bwBin = (dMax - dMin) / bins
  const counts: number[] = new Array(bins).fill(0)
  r.data.forEach((v) => {
    const i = Math.max(0, Math.min(bins - 1, Math.floor((v - dMin) / bwBin)))
    counts[i]!++
  })
  const maxC = Math.max(...counts, 1)

  for (let g = 1; g <= 3; g++) {
    const gy = oy + pH - (g / 3) * pH
    c.beginPath(); c.moveTo(ox, gy); c.lineTo(ox + pW, gy)
    c.strokeStyle = P.grid; c.lineWidth = 0.5; c.stroke()
  }

  counts.forEach((cnt, i) => {
    if (!cnt) return
    const barX = ox + (i / bins) * pW
    const barW = Math.max(1, pW / bins - 1)
    const barH = (cnt / maxC) * pH
    const barY = oy + pH - barH
    const g = c.createLinearGradient(0, barY, 0, barY + barH)
    g.addColorStop(0, P.barA); g.addColorStop(1, P.barB)
    c.fillStyle = g
    c.beginPath(); c.roundRect(barX, barY, barW, barH, [2, 2, 0, 0]); c.fill()
  })

  c.beginPath(); c.moveTo(ox, oy + pH); c.lineTo(ox + pW, oy + pH)
  c.strokeStyle = P.borderLight; c.lineWidth = 1; c.stroke()

  const maxPDF = normPDF(r.xBar, r.xBar, r.sOverall)
  if (maxPDF > 0) {
    c.beginPath()
    for (let i = 0; i <= 100; i++) {
      const xv = dMin + (i / 100) * (dMax - dMin)
      const px = ox + ((xv - dMin) / (dMax - dMin)) * pW
      const py = oy + pH - (normPDF(xv, r.xBar, r.sOverall) / maxPDF) * pH * 0.88
      if (i === 0) c.moveTo(px, py)
      else c.lineTo(px, py)
    }
    c.strokeStyle = P.curve; c.lineWidth = 1.5
    c.shadowColor = P.curve; c.shadowBlur = 3; c.stroke(); c.shadowBlur = 0
  }

  const drawV = (val: number, col: string, lbl: string) => {
    if (isNaN(val)) return
    const px = ox + ((val - dMin) / (dMax - dMin)) * pW
    if (px < ox - 2 || px > ox + pW + 2) return
    c.save(); c.beginPath(); c.setLineDash([4, 3])
    c.moveTo(px, oy); c.lineTo(px, oy + pH)
    c.strokeStyle = col; c.lineWidth = 1.5; c.stroke()
    c.setLineDash([]); c.restore()
    c.font = 'bold 8px "Space Grotesk", Inter, sans-serif'; c.fillStyle = col; c.textAlign = 'center'
    c.fillText(lbl, px, oy + 9)
  }
  if (r.hasLSL) drawV(r.lsl, P.specLine, 'L')
  if (r.hasUSL) drawV(r.usl, P.specLine, 'U')

  const mpx = ox + ((r.xBar - dMin) / (dMax - dMin)) * pW
  if (mpx >= ox && mpx <= ox + pW) {
    c.save(); c.beginPath(); c.setLineDash([3, 3])
    c.moveTo(mpx, oy); c.lineTo(mpx, oy + pH)
    c.strokeStyle = P.meanLine; c.lineWidth = 1; c.stroke()
    c.setLineDash([]); c.restore()
  }

  c.font = '400 8px Inter, sans-serif'; c.fillStyle = P.textDim; c.textAlign = 'center'
  for (let i = 0; i <= 2; i++) {
    const xv = dMin + (i / 2) * (dMax - dMin)
    c.fillText(xv.toFixed(2), ox + (i / 2) * pW, oy + pH + 14)
  }

  c.font = '400 8px Inter, sans-serif'; c.fillStyle = P.textDim; c.textAlign = 'right'
  c.fillText(String(maxC), ox - 2, oy + 8)
}

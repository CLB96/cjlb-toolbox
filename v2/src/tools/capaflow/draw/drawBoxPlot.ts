import { buildBoxPlot, type AnalysisResult } from '../logic'
import { prepareCanvas, type DrawEnv, type Pad } from './canvas'

const PAD: Pad = { t: 15, r: 120, b: 35, l: 100 }
const GAP = 15

type StatsType = 'overall' | 'within' | null

function statLines(r: AnalysisResult, type: Exclude<StatsType, null>): string[] {
  const f = (v: number | null | undefined, d: number, fallback = '*') => (v !== null && v !== undefined ? v.toFixed(d) : fallback)
  if (type === 'overall') {
    return [`StDev ${f(r.sOverall, 4)}`, `Pp    ${f(r.Pp, 2)}`, `Ppk   ${f(r.Ppk, 2)}`, `Cpm   ${f(r.Cpm, 2)}`, `PPM   ${f(r.ppmOverall, 2, '0.00')}`]
  }
  return [`StDev ${f(r.sWithin, 4)}`, `Cp    ${f(r.Cp, 2)}`, `Cpk   ${f(r.Cpk, 2)}`, `PPM   ${f(r.ppm, 2, '0.00')}`]
}

/** Diagrama de caja horizontal estilo Minitab, tres secciones (drawBoxPlot, original 5104-5334). */
export function drawBoxPlot(canvas: HTMLCanvasElement, r: AnalysisResult, env: DrawEnv): void {
  const ctx = prepareCanvas(canvas, 340, 700)
  if (!ctx) return
  const { isDark } = env
  const W = canvas.width
  const H = canvas.height
  const m = buildBoxPlot(r)
  const { Q1, Q2, Q3, outliers, minWhisker, maxWhisker, xMin, xMax } = m
  const pad = PAD
  const sectionH = (H - pad.t - pad.b - GAP * 2) / 3
  const plotW = W - pad.l - pad.r
  const toX = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * plotW
  const violet = isDark ? 'rgba(139,92,246,0.7)' : 'rgba(109,40,217,0.7)'
  const red = isDark ? '#ef4444' : '#dc2626'

  const drawSection = (yTop: number, label: string, statsType: StatsType) => {
    const centerY = yTop + sectionH / 2
    const boxH = sectionH * 0.4

    ctx.font = 'bold 13px system-ui,sans-serif'
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(30,60,120,0.9)'
    ctx.textAlign = 'center'
    ctx.fillText(label, pad.l / 2, centerY + 4)

    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,60,120,0.05)'
    ctx.lineWidth = 1
    for (let g = 0; g <= 4; g++) {
      const x = pad.l + (g / 4) * plotW
      ctx.beginPath()
      ctx.moveTo(x, yTop)
      ctx.lineTo(x, yTop + sectionH)
      ctx.stroke()
    }

    ;[r.lsl, r.usl].forEach((limit) => {
      if (isNaN(limit)) return
      ctx.beginPath()
      ctx.moveTo(toX(limit), yTop + 5)
      ctx.lineTo(toX(limit), yTop + sectionH - 5)
      ctx.strokeStyle = red
      ctx.lineWidth = 2
      ctx.stroke()
    })

    const q1X = toX(Q1)
    const q2X = toX(Q2)
    const q3X = toX(Q3)
    const minX = toX(minWhisker)
    const maxX = toX(maxWhisker)

    const seg = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    ctx.strokeStyle = violet
    ctx.lineWidth = 2
    seg(minX, centerY, q1X, centerY)
    seg(minX, centerY - boxH / 6, minX, centerY + boxH / 6)
    seg(q3X, centerY, maxX, centerY)
    seg(maxX, centerY - boxH / 6, maxX, centerY + boxH / 6)

    const gradient = ctx.createLinearGradient(q1X, 0, q3X, 0)
    gradient.addColorStop(0, isDark ? 'rgba(139,92,246,0.45)' : 'rgba(109,40,217,0.38)')
    gradient.addColorStop(1, isDark ? 'rgba(139,92,246,0.15)' : 'rgba(109,40,217,0.12)')
    ctx.fillStyle = gradient
    ctx.fillRect(q1X, centerY - boxH / 2, q3X - q1X, boxH)
    ctx.strokeStyle = isDark ? 'rgba(139,92,246,0.9)' : 'rgba(109,40,217,0.9)'
    ctx.lineWidth = 2
    ctx.strokeRect(q1X, centerY - boxH / 2, q3X - q1X, boxH)

    ctx.beginPath()
    ctx.moveTo(q2X, centerY - boxH / 2)
    ctx.lineTo(q2X, centerY + boxH / 2)
    ctx.strokeStyle = isDark ? '#fbbf24' : '#f59e0b'
    ctx.lineWidth = 2.5
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(toX(r.xBar), centerY, 4, 0, Math.PI * 2)
    ctx.fillStyle = isDark ? '#06b6d4' : '#0891b2'
    ctx.fill()

    outliers.forEach((v) => {
      ctx.beginPath()
      ctx.arc(toX(v), centerY, 5, 0, Math.PI * 2)
      ctx.fillStyle = red
      ctx.fill()
    })

    if (statsType) {
      ctx.font = '11px DM Mono,monospace'
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,60,120,0.7)'
      ctx.textAlign = 'left'
      statLines(r, statsType).forEach((s, i) => ctx.fillText(s, pad.l + plotW + 10, yTop + 15 + i * 15))
    }
  }

  drawSection(pad.t, 'Overall', 'overall')
  drawSection(pad.t + sectionH + GAP, 'Within', 'within')
  drawSection(pad.t + (sectionH + GAP) * 2, 'Specs', null)

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(30,60,120,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad.l, H - pad.b)
  ctx.lineTo(W - pad.r, H - pad.b)
  ctx.stroke()

  ctx.font = '10px DM Mono,monospace'
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(30,60,120,0.5)'
  ctx.textAlign = 'center'
  for (let g = 0; g <= 4; g++) {
    ctx.fillText((xMin + (g / 4) * (xMax - xMin)).toFixed(3), pad.l + (g / 4) * plotW, H - pad.b + 12)
  }
  ctx.fillStyle = red
  ctx.font = 'bold 10px DM Mono,monospace'
  if (!isNaN(r.lsl)) ctx.fillText('LSL', toX(r.lsl), H - pad.b + 25)
  if (!isNaN(r.usl)) ctx.fillText('USL', toX(r.usl), H - pad.b + 25)
}

/** Nota bajo el diagrama de caja (idéntica en ambos idiomas, como el original). */
export function boxPlotNote(r: AnalysisResult): string {
  const m = buildBoxPlot(r)
  return `Q1=${m.Q1.toFixed(3)}, Q2=${m.Q2.toFixed(3)}, Q3=${m.Q3.toFixed(3)}, Outliers=${m.outliers.length}`
}

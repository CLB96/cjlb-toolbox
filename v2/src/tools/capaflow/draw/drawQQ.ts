import { buildQQ, type AnalysisResult } from '../logic'
import { nearest, prepareCanvas, type DrawEnv, type HitTest, type Pad } from './canvas'

const PAD: Pad = { t: 24, r: 24, b: 36, l: 60 }

/** Color por desviación respecto de la línea: verde, amarillo, rojo (original 5043-5051). */
function deviationColor(t2: number, isDark: boolean): string {
  if (t2 < 0.5) {
    const u = t2 * 2
    return isDark
      ? `rgba(${Math.round(74 + 177 * u)},${Math.round(222 - 27 * u)},${Math.round(128 - 128 * u)},0.85)`
      : `rgba(${Math.round(22 + 198 * u)},${Math.round(163 - 107 * u)},${Math.round(74 - 74 * u)},0.85)`
  }
  const u = (t2 - 0.5) * 2
  return isDark
    ? `rgba(${Math.round(251)},${Math.round(191 - 130 * u)},${Math.round(36 - 36 * u)},0.85)`
    : `rgba(${Math.round(220)},${Math.round(56 - 18 * u)},${Math.round(38 - 12 * u)},0.85)`
}

/** Probabilidad normal con X = observado, Y = teórico (drawQQPlot, original 4957-5102). */
export function drawQQ(canvas: HTMLCanvasElement, r: AnalysisResult, env: DrawEnv): HitTest | null {
  const ctx = prepareCanvas(canvas, 200, 700)
  if (!ctx) return null
  const { isDark, lang } = env
  const W = canvas.width
  const H = canvas.height
  const m = buildQQ(r)
  const { pts, xMin, xMax, yMin, yMax, xPad, yPad, bandHalf } = m
  const N = pts.length
  const pad = PAD
  const pW = W - pad.l - pad.r
  const pH = H - pad.t - pad.b
  const toX = (v: number) => pad.l + ((v - (xMin - xPad)) / (xMax + xPad - (xMin - xPad))) * pW
  const toY = (v: number) => pad.t + pH - ((v - (yMin - yPad)) / (yMax + yPad - (yMin - yPad))) * pH

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,60,120,0.06)'
  ctx.lineWidth = 1
  for (let g = 0; g <= 4; g++) {
    const y = pad.t + (g / 4) * pH
    ctx.beginPath()
    ctx.moveTo(pad.l, y)
    ctx.lineTo(pad.l + pW, y)
    ctx.stroke()
    const x = pad.l + (g / 4) * pW
    ctx.beginPath()
    ctx.moveTo(x, pad.t)
    ctx.lineTo(x, pad.t + pH)
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.moveTo(toX(xMin - xPad), toY(xMin - xPad))
  ctx.lineTo(toX(xMax + xPad), toY(xMax + xPad))
  ctx.strokeStyle = isDark ? 'rgba(74,222,128,0.65)' : 'rgba(22,163,74,0.70)'
  ctx.lineWidth = 2
  ctx.shadowColor = ctx.strokeStyle
  ctx.shadowBlur = 6
  ctx.setLineDash([6, 4])
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.setLineDash([])

  pts.forEach((p) => {
    const x = toX(p.obs)
    const y0 = toY(p.th - bandHalf)
    const y1 = toY(p.th + bandHalf)
    if (x >= pad.l && x <= pad.l + pW) {
      ctx.fillStyle = isDark ? 'rgba(74,222,128,0.06)' : 'rgba(22,163,74,0.05)'
      ctx.fillRect(x - 1, Math.min(y0, y1), 2, Math.abs(y1 - y0))
    }
  })

  pts.forEach((p) => {
    const x = toX(p.obs)
    const y = toY(p.th)
    const dev = Math.abs(y - toY(p.obs))
    const t2 = Math.min(dev / (pH * 0.25), 1)
    const col = deviationColor(t2, isDark)
    if (x < pad.l - 4 || x > pad.l + pW + 4 || y < pad.t - 4 || y > pad.t + pH + 4) return
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = col
    ctx.fill()
  })

  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(30,60,120,0.40)'
  ctx.font = '10px DM Mono,monospace'
  ctx.textAlign = 'right'
  for (let g = 0; g <= 4; g++) {
    const v = yMin - yPad + (g / 4) * (yMax - yMin + yPad * 2)
    ctx.fillText(v.toFixed(2), pad.l - 5, toY(v) + 4)
  }
  ctx.textAlign = 'center'
  for (let g = 0; g <= 4; g++) {
    const v = xMin - xPad + (g / 4) * (xMax - xMin + xPad * 2)
    ctx.fillText(v.toFixed(2), toX(v), H - 4)
  }

  ctx.save()
  ctx.translate(14, pad.t + pH / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = isDark ? 'rgba(74,222,128,0.7)' : 'rgba(22,163,74,0.7)'
  ctx.font = '10px DM Mono,monospace'
  ctx.textAlign = 'center'
  ctx.fillText(lang === 'es' ? 'Cuantiles Teóricos' : 'Theoretical Quantiles', 0, 0)
  ctx.restore()
  ctx.fillStyle = isDark ? 'rgba(251,191,36,0.7)' : 'rgba(180,83,9,0.7)'
  ctx.font = '10px DM Mono,monospace'
  ctx.textAlign = 'center'
  ctx.fillText(lang === 'es' ? 'Datos Obs.' : 'Observed', pad.l + pW / 2, H - 8)

  // Tooltip: el original lo deja en español en ambos idiomas.
  return (mx, my) => {
    const hit = nearest(pts, (p) => toX(p.obs), (p) => toY(p.th), mx, my)
    if (!hit) return null
    const { obs, th } = hit.item
    const percentile = (((hit.index + 0.5) / N) * 100).toFixed(1)
    return `Punto #${hit.index + 1} (${percentile}%)\nObservado: ${obs.toFixed(4)}\nTeórico: ${th.toFixed(4)}\nDesviación: ${(th - obs).toFixed(4)}`
  }
}

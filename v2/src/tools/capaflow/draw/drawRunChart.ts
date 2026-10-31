import { buildRunChart, type AnalysisResult } from '../logic'
import { nearest, prepareCanvas, type DrawEnv, type HitTest, type Pad } from './canvas'

const PAD: Pad = { t: 30, r: 28, b: 32, l: 52 }

/** Gráfica de corrida: todos los datos con la mediana global (drawRunChart, original 4829-4955). */
export function drawRunChart(canvas: HTMLCanvasElement, r: AnalysisResult, env: DrawEnv): HitTest | null {
  const ctx = prepareCanvas(canvas, 200, 700)
  if (!ctx) return null
  const { isDark } = env
  const W = canvas.width
  const H = canvas.height
  const { data, N, med, yMin, yMax } = buildRunChart(r)
  const pad = PAD
  const pW = W - pad.l - pad.r
  const pH = H - pad.t - pad.b
  const toX = (i: number) => pad.l + (i / (N - 1)) * pW
  const toY = (v: number) => pad.t + pH - ((v - yMin) / (yMax - yMin)) * pH

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,60,120,0.06)'
  ctx.lineWidth = 1
  for (let g = 0; g <= 4; g++) {
    const y = pad.t + (g / 4) * pH
    ctx.beginPath()
    ctx.moveTo(pad.l, y)
    ctx.lineTo(pad.l + pW, y)
    ctx.stroke()
  }

  const medY = toY(med)
  ctx.fillStyle = isDark ? 'rgba(74,222,128,0.04)' : 'rgba(22,163,74,0.03)'
  ctx.fillRect(pad.l, pad.t, pW, Math.max(0, medY - pad.t))
  ctx.fillStyle = isDark ? 'rgba(248,113,113,0.04)' : 'rgba(220,38,38,0.03)'
  ctx.fillRect(pad.l, medY, pW, Math.max(0, pad.t + pH - medY))

  ctx.beginPath()
  ctx.setLineDash([5, 4])
  ctx.moveTo(pad.l, medY)
  ctx.lineTo(pad.l + pW, medY)
  ctx.strokeStyle = isDark ? 'rgba(251,191,36,0.85)' : 'rgba(180,83,9,0.85)'
  ctx.lineWidth = 2
  ctx.shadowColor = ctx.strokeStyle
  ctx.shadowBlur = 6
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.setLineDash([])
  ctx.font = 'bold 11px DM Mono,monospace'
  ctx.fillStyle = isDark ? 'rgba(251,191,36,0.9)' : 'rgba(180,83,9,0.9)'
  ctx.textAlign = 'right'
  ctx.fillText('M̃=' + med.toFixed(3), pad.l - 4, medY + 4)

  for (let i = 1; i < N; i++) {
    ctx.beginPath()
    ctx.moveTo(toX(i - 1), toY(data[i - 1]!))
    ctx.lineTo(toX(i), toY(data[i]!))
    const above = data[i - 1]! >= med
    ctx.strokeStyle = above ? (isDark ? 'rgba(74,222,128,0.7)' : 'rgba(22,163,74,0.75)') : (isDark ? 'rgba(248,113,113,0.7)' : 'rgba(220,38,38,0.75)')
    ctx.lineWidth = 1.8
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  data.forEach((v, i) => {
    ctx.beginPath()
    ctx.arc(toX(i), toY(v), 3.5, 0, Math.PI * 2)
    ctx.fillStyle = v >= med ? (isDark ? '#4ade80' : 'rgba(22,163,74,0.9)') : (isDark ? '#f87171' : 'rgba(220,38,38,0.9)')
    ctx.fill()
  })

  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(30,60,120,0.40)'
  ctx.font = '10px DM Mono,monospace'
  ctx.textAlign = 'right'
  for (let g = 0; g <= 4; g++) {
    const v = yMin + (g / 4) * (yMax - yMin)
    ctx.fillText(v.toFixed(2), pad.l - 5, pad.t + ((4 - g) / 4) * pH + 4)
  }

  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(30,60,120,0.35)'
  ctx.textAlign = 'center'
  const step = Math.max(1, Math.ceil(N / 12))
  for (let i = 0; i < N; i += step) ctx.fillText(String(i + 1), toX(i), H - 5)

  return (mx, my) => {
    const idxHit = nearest(data.map((v, i) => ({ v, i })), (p) => toX(p.i), (p) => toY(p.v), mx, my)
    if (!idxHit) return null
    const { v, i } = idxHit.item
    const status = v >= med ? env.tr('tooltip.aboveMedian') : env.tr('tooltip.belowMedian')
    return `${env.tr('tooltip.observation')} #${i + 1}\n${env.tr('tooltip.value')}: ${v.toFixed(4)}\n${env.tr('tooltip.median')}: ${med.toFixed(4)}\nΔ: ${(v - med).toFixed(4)}\n${status}`
  }
}

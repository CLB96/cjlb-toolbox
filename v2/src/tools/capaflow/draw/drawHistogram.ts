import { buildHistogram, type AnalysisResult } from '../logic'
import { prepareCanvas, type DrawEnv, type HitTest, type Pad } from './canvas'

const PAD: Pad = { t: 38, r: 4, b: 38, l: 28 }

/** Histograma con zonas fuera de especificación y curva normal (drawHistogram, original 4611-4781). */
export function drawHistogram(canvas: HTMLCanvasElement, r: AnalysisResult, env: DrawEnv): HitTest | null {
  const ctx = prepareCanvas(canvas, 220, 400)
  if (!ctx) return null
  const { isDark } = env
  const W = canvas.width
  const H = canvas.height
  const m = buildHistogram(r)
  const { bins, minV, maxV, binW, counts, maxC } = m
  const pad = PAD
  const plotW = W - pad.l - pad.r
  const plotH = H - pad.t - pad.b
  const toX = (v: number) => pad.l + ((v - minV) / (maxV - minV)) * plotW

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(30,60,120,0.06)'
  ctx.lineWidth = 1
  for (let g = 0; g <= 4; g++) {
    const y = pad.t + (g / 4) * plotH
    ctx.beginPath()
    ctx.moveTo(pad.l, y)
    ctx.lineTo(pad.l + plotW, y)
    ctx.stroke()
  }

  if (!isNaN(r.lsl)) {
    const lslX = Math.max(pad.l, Math.min(pad.l + plotW, toX(r.lsl)))
    if (lslX > pad.l) {
      const zg = ctx.createLinearGradient(pad.l, 0, lslX, 0)
      zg.addColorStop(0, isDark ? 'rgba(217,70,239,0.13)' : 'rgba(162,28,175,0.09)')
      zg.addColorStop(1, isDark ? 'rgba(217,70,239,0.22)' : 'rgba(162,28,175,0.16)')
      ctx.fillStyle = zg
      ctx.fillRect(pad.l, pad.t, lslX - pad.l, plotH)
    }
  }
  if (!isNaN(r.usl)) {
    const uslX = Math.max(pad.l, Math.min(pad.l + plotW, toX(r.usl)))
    if (uslX < pad.l + plotW) {
      const zg = ctx.createLinearGradient(uslX, 0, pad.l + plotW, 0)
      zg.addColorStop(0, isDark ? 'rgba(217,70,239,0.22)' : 'rgba(162,28,175,0.16)')
      zg.addColorStop(1, isDark ? 'rgba(217,70,239,0.13)' : 'rgba(162,28,175,0.09)')
      ctx.fillStyle = zg
      ctx.fillRect(uslX, pad.t, pad.l + plotW - uslX, plotH)
    }
  }
  if (!isNaN(r.lsl) && !isNaN(r.usl)) {
    const lslX = Math.max(pad.l, toX(r.lsl))
    const uslX = Math.min(pad.l + plotW, toX(r.usl))
    if (uslX > lslX) {
      ctx.fillStyle = isDark ? 'rgba(74,222,128,0.04)' : 'rgba(22,163,74,0.03)'
      ctx.fillRect(lslX, pad.t, uslX - lslX, plotH)
    }
  }

  counts.forEach((cnt, i) => {
    if (!cnt) return
    const x = pad.l + (i / bins) * plotW
    const bw = plotW / bins - 1.5
    const bh = (cnt / maxC) * plotH
    const y = pad.t + plotH - bh
    const grad = ctx.createLinearGradient(0, y, 0, y + bh)
    if (isDark) {
      grad.addColorStop(0, 'rgba(79,195,247,0.82)')
      grad.addColorStop(1, 'rgba(0,229,255,0.14)')
    } else {
      grad.addColorStop(0, 'rgba(33,150,243,0.72)')
      grad.addColorStop(1, 'rgba(100,160,240,0.12)')
    }
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x + 0.5, y, bw, bh, [3, 3, 0, 0])
    ctx.fill()
    ctx.strokeStyle = isDark ? 'rgba(79,195,247,0.28)' : 'rgba(33,150,243,0.22)'
    ctx.lineWidth = 1
    ctx.stroke()
  })

  ctx.beginPath()
  m.curve.forEach((p, i) => {
    const px = toX(p.x)
    const py = pad.t + plotH - p.y * plotH
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.strokeStyle = isDark ? 'rgba(105,240,174,0.95)' : 'rgba(22,163,74,0.90)'
  ctx.lineWidth = 2.5
  ctx.shadowColor = ctx.strokeStyle
  ctx.shadowBlur = 8
  ctx.stroke()
  ctx.shadowBlur = 0

  const drawSpecLine = (val: number, lbl: string) => {
    if (isNaN(val)) return
    const px = toX(val)
    if (px < pad.l || px > pad.l + plotW) return
    ctx.beginPath()
    ctx.moveTo(px, pad.t - 5)
    ctx.lineTo(px, pad.t + plotH + 5)
    ctx.strokeStyle = isDark ? '#ef4444' : '#dc2626'
    ctx.lineWidth = 4
    ctx.shadowColor = isDark ? 'rgba(239,68,68,0.8)' : 'rgba(220,38,38,0.7)'
    ctx.shadowBlur = 16
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.save()
    ctx.translate(px, pad.t + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.font = 'bold 16px DM Mono,monospace'
    const labelWidth = ctx.measureText(lbl).width
    const padding = 12
    ctx.fillStyle = isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.2)'
    ctx.beginPath()
    ctx.roundRect(-labelWidth / 2 - padding, -11, labelWidth + padding * 2, 22, 5)
    ctx.fill()
    ctx.fillStyle = isDark ? '#fca5a5' : '#dc2626'
    ctx.textAlign = 'center'
    ctx.fillText(lbl, 0, 6)
    ctx.restore()
  }
  drawSpecLine(r.lsl, 'LSL')
  drawSpecLine(r.usl, 'USL')

  const mpx = toX(r.xBar)
  if (mpx >= pad.l && mpx <= pad.l + plotW) {
    ctx.beginPath()
    ctx.setLineDash([4, 3])
    ctx.moveTo(mpx, pad.t)
    ctx.lineTo(mpx, pad.t + plotH)
    ctx.strokeStyle = isDark ? 'rgba(79,195,247,0.75)' : 'rgba(33,150,243,0.75)'
    ctx.lineWidth = 1.8
    ctx.stroke()
    ctx.setLineDash([])
    ctx.font = 'bold 11px DM Mono,monospace'
    const mlw = ctx.measureText('x̄').width + 10
    ctx.fillStyle = isDark ? 'rgba(79,195,247,0.20)' : 'rgba(33,150,243,0.18)'
    ctx.beginPath()
    ctx.roundRect(mpx - mlw / 2, pad.t + plotH + 3, mlw, 14, 3)
    ctx.fill()
    ctx.fillStyle = isDark ? 'rgba(79,195,247,1)' : 'rgba(33,150,243,1)'
    ctx.textAlign = 'center'
    ctx.fillText('x̄', mpx, pad.t + plotH + 13)
  }

  if (!isNaN(r.targetVal)) {
    const tpx = toX(r.targetVal)
    if (tpx >= pad.l && tpx <= pad.l + plotW) {
      ctx.beginPath()
      ctx.setLineDash([6, 3])
      ctx.moveTo(tpx, pad.t)
      ctx.lineTo(tpx, pad.t + plotH)
      ctx.strokeStyle = isDark ? 'rgba(251,191,36,0.85)' : 'rgba(180,83,9,0.85)'
      ctx.lineWidth = 2
      ctx.shadowColor = ctx.strokeStyle
      ctx.shadowBlur = 6
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.setLineDash([])
      const tbw = 22
      ctx.fillStyle = isDark ? 'rgba(251,191,36,0.85)' : 'rgba(161,98,7,0.88)'
      ctx.beginPath()
      ctx.roundRect(tpx - tbw / 2, pad.t - 2, tbw, 17, 4)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px DM Mono,monospace'
      ctx.textAlign = 'center'
      ctx.fillText('T', tpx, pad.t + 12)
    }
  }

  ctx.fillStyle = isDark ? 'rgba(200,210,255,0.40)' : 'rgba(30,60,120,0.40)'
  ctx.font = '9px DM Mono,monospace'
  ctx.textAlign = 'center'
  for (let i = 0; i <= 5; i++) {
    const xv = minV + (i / 5) * (maxV - minV)
    ctx.fillText(xv.toFixed(2), pad.l + (i / 5) * plotW, H - 5)
  }

  return (mx, my) => {
    if (mx < pad.l || mx > pad.l + plotW || my < pad.t || my > pad.t + plotH) return null
    const binIdx = Math.floor((mx - pad.l) / (plotW / bins))
    if (binIdx < 0 || binIdx >= bins) return null
    const binStart = minV + binIdx * binW
    const freq = counts[binIdx]!
    const pct = ((freq / r.data.length) * 100).toFixed(1)
    return `${env.tr('tooltip.binRange')} ${binStart.toFixed(3)} – ${(binStart + binW).toFixed(3)}\n${env.tr('tooltip.freq')} ${freq} (${pct}%)`
  }
}

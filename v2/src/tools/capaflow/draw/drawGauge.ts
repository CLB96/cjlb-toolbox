import type { Lang } from '../logic'
import type { HitTest } from './canvas'

export const GAUGE_W = 280
export const GAUGE_H = 158
const MAX_V = 2

/**
 * Medidor Cpk (drawGauge, original 4535-4609). El color de la aguja llega ya resuelto
 * (en el original era una variable CSS que el canvas no entendía).
 */
export function drawGauge(canvas: HTMLCanvasElement, cpk: number | null, color: string, lang: Lang): HitTest | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H - 18
  const R = Math.min(W * 0.44, H * 0.88)

  ctx.clearRect(0, 0, W, H)

  ctx.beginPath()
  ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI)
  ctx.lineWidth = 16
  ctx.strokeStyle = 'rgba(128,128,128,0.12)'
  ctx.lineCap = 'round'
  ctx.stroke()

  const zones = [
    { from: 0, to: 1.0, color: 'rgba(255,82,82,0.65)' },
    { from: 1.0, to: 1.33, color: 'rgba(255,215,64,0.65)' },
    { from: 1.33, to: 1.67, color: 'rgba(105,240,174,0.65)' },
    { from: 1.67, to: 2.0, color: 'rgba(0,229,255,0.65)' },
  ]
  zones.forEach((z) => {
    ctx.beginPath()
    ctx.arc(cx, cy, R, Math.PI + (z.from / MAX_V) * Math.PI, Math.PI + (z.to / MAX_V) * Math.PI)
    ctx.lineWidth = 12
    ctx.strokeStyle = z.color
    ctx.lineCap = 'butt'
    ctx.stroke()
  })

  const clamped = Math.max(0, Math.min(cpk !== null ? cpk : 0, MAX_V))
  const ang = Math.PI + (clamped / MAX_V) * Math.PI
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + (R - 4) * Math.cos(ang), cy + (R - 4) * Math.sin(ang))
  ctx.lineWidth = 3
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.shadowColor = color
  ctx.shadowBlur = 14
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.beginPath()
  ctx.arc(cx, cy, 7, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 12
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(128,128,150,0.65)'
  ctx.font = '10px DM Mono, monospace'
  ctx.textAlign = 'center'
  ;[0, 0.5, 1.0, 1.33, 1.67, 2.0].forEach((v) => {
    const a = Math.PI + (v / MAX_V) * Math.PI
    ctx.fillText(v % 1 === 0 ? v.toFixed(0) : v.toFixed(2), cx + (R + 15) * Math.cos(a), cy + (R + 15) * Math.sin(a))
  })

  const innerR = R * 0.18
  return (mx, my) => {
    const dx = mx - cx
    const dy = my - cy
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d < innerR || d > R) return null
    let angle = Math.atan2(dy, dx)
    if (angle < -Math.PI / 2) angle += 2 * Math.PI
    const normAngle = (angle - Math.PI) / Math.PI
    if (normAngle < 0 || normAngle > 1) return null
    const hovered = normAngle * MAX_V
    const es = lang === 'es'
    let label = es ? 'No Capaz' : 'Not Capable'
    if (hovered >= 1.67) label = 'World Class'
    else if (hovered >= 1.33) label = es ? 'Capaz' : 'Capable'
    else if (hovered >= 1.0) label = 'Marginal'
    return `Cpk: ${hovered.toFixed(3)}\n${label}`
  }
}

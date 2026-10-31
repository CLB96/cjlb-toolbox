import { nearest, type DrawEnv, type HitTest, type Pad } from './canvas'

const PAD: Pad = { t: 16, r: 20, b: 30, l: 62 }

export interface CCSeries {
  pts: (number | null)[]
  cl: number
  ucl: number
  lcl: number
  sigma: number
  viol: number[]
  isXbar: boolean
}

/** Una gráfica de control (_drawCCChart, original 7126-7277). El alto lo fija el atributo del canvas. */
export function drawControl(canvas: HTMLCanvasElement, s: CCSeries, env: DrawEnv): HitTest | null {
  canvas.width = canvas.offsetWidth || 900
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const { isDark } = env
  const { cl, ucl, lcl, sigma, isXbar } = s
  const W = canvas.width
  const H = canvas.height
  ctx.clearRect(0, 0, W, H)

  const pW = W - PAD.l - PAD.r
  const pH = H - PAD.t - PAD.b
  const validPts = s.pts.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null)
  if (validPts.length < 2) return null
  const vals = validPts.map((p) => p.v)

  const allVals = [...vals, ucl, lcl > 0 ? lcl : 0]
  let yMin = Math.min(...allVals)
  let yMax = Math.max(...allVals)
  const yPad = (yMax - yMin) * 0.15 || Math.abs(cl) * 0.1 || 0.01
  yMin -= yPad
  yMax += yPad
  const toY = (v: number) => PAD.t + pH - ((v - yMin) / (yMax - yMin)) * pH
  const toX = (i: number) => PAD.l + (i / Math.max(validPts.length - 1, 1)) * pW

  const nGrids = 5
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,60,120,0.05)'
  ctx.lineWidth = 1
  for (let g = 0; g <= nGrids; g++) {
    const y = PAD.t + (g / nGrids) * pH
    ctx.beginPath()
    ctx.moveTo(PAD.l, y)
    ctx.lineTo(W - PAD.r, y)
    ctx.stroke()
  }

  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(30,60,120,0.45)'
  ctx.font = '11px ui-monospace,monospace'
  ctx.textAlign = 'right'
  for (let g = 0; g <= nGrids; g++) {
    const v = yMin + (g / nGrids) * (yMax - yMin)
    ctx.fillText(v.toFixed(3), PAD.l - 6, PAD.t + ((nGrids - g) / nGrids) * pH + 4)
  }

  const ucl2 = cl + 2 * sigma
  const lcl2 = cl - 2 * sigma
  ctx.fillStyle = isDark ? 'rgba(255,215,64,0.04)' : 'rgba(180,83,9,0.04)'
  const y2top = toY(ucl2)
  const y3top = toY(ucl)
  ctx.fillRect(PAD.l, Math.min(y2top, y3top), pW, Math.abs(y2top - y3top))
  const y2bot = toY(lcl2)
  const y3bot = toY(lcl)
  ctx.fillRect(PAD.l, Math.min(y2bot, y3bot), pW, Math.abs(y2bot - y3bot))

  const drawHLine = (y: number, color: string, dash: number[], lw = 1.8) => {
    if (y < PAD.t - 5 || y > PAD.t + pH + 5) return
    ctx.setLineDash(dash)
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(PAD.l, y)
    ctx.lineTo(W - PAD.r, y)
    ctx.stroke()
    ctx.setLineDash([])
  }
  const limitColor = isDark ? 'rgba(255,82,82,0.85)' : 'rgba(211,47,47,0.85)'
  const sigmaColor = isDark ? 'rgba(255,215,64,0.5)' : 'rgba(180,83,9,0.5)'
  drawHLine(toY(ucl), limitColor, [7, 5], 2)
  if (lcl > yMin) drawHLine(toY(lcl), limitColor, [7, 5], 2)
  drawHLine(toY(ucl2), sigmaColor, [4, 4], 1.5)
  if (lcl2 > yMin) drawHLine(toY(lcl2), sigmaColor, [4, 4], 1.5)
  drawHLine(toY(cl), isXbar ? (isDark ? 'rgba(0,229,255,0.7)' : 'rgba(0,103,187,0.7)') : (isDark ? 'rgba(79,195,247,0.7)' : 'rgba(33,150,243,0.7)'), [], 2)

  ctx.fillStyle = isDark ? 'rgba(255,82,82,0.75)' : 'rgba(211,47,47,0.75)'
  ctx.font = 'bold 10px ui-monospace,monospace'
  ctx.textAlign = 'left'
  const uclY = toY(ucl)
  if (uclY > PAD.t && uclY < PAD.t + pH) ctx.fillText('UCL', W - PAD.r + 3, uclY + 4)
  if (lcl > yMin) {
    const lclY = toY(lcl)
    if (lclY > PAD.t && lclY < PAD.t + pH) ctx.fillText('LCL', W - PAD.r + 3, lclY + 4)
  }
  ctx.fillStyle = isDark ? 'rgba(0,229,255,0.7)' : 'rgba(0,103,187,0.7)'
  const clY = toY(cl)
  if (clY > PAD.t && clY < PAD.t + pH) ctx.fillText('CL', W - PAD.r + 3, clY + 4)

  const lineColor = isXbar ? (isDark ? 'rgba(0,229,255,0.85)' : 'rgba(0,103,187,0.85)') : (isDark ? 'rgba(79,195,247,0.85)' : 'rgba(33,150,243,0.85)')
  ctx.beginPath()
  validPts.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(toX(idx), toY(p.v))
    else ctx.lineTo(toX(idx), toY(p.v))
  })
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.stroke()

  const violSet = new Set(s.viol)
  validPts.forEach((p, idx) => {
    const x = toX(idx)
    const y = toY(p.v)
    const isViol = violSet.has(idx)
    ctx.beginPath()
    ctx.arc(x, y, isViol ? 5.5 : 3.5, 0, Math.PI * 2)
    if (isViol) {
      ctx.fillStyle = isDark ? '#FF5252' : '#d32f2f'
      ctx.shadowColor = '#FF5252'
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.strokeStyle = isDark ? 'rgba(255,82,82,0.4)' : 'rgba(211,47,47,0.4)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.fillStyle = lineColor
      ctx.fill()
    }
  })

  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(30,60,120,0.4)'
  ctx.font = '10px ui-monospace,monospace'
  ctx.textAlign = 'center'
  const step = Math.ceil(validPts.length / 12)
  validPts.forEach((_p, idx) => {
    if (idx % step === 0 || idx === validPts.length - 1) ctx.fillText(String(idx + 1), toX(idx), H - 6)
  })

  return (mx, my) => {
    const hit = nearest(validPts, (p) => toX(validPts.indexOf(p)), (p) => toY(p.v), mx, my)
    if (!hit) return null
    const { v } = hit.item
    const status = violSet.has(hit.index) ? `🔴 ${env.tr('cc.ooc')}` : `✅ ${env.tr('cc.inControl')}`
    return `${env.tr('tooltip.observation')} #${hit.index + 1}\n${env.tr('tooltip.value')}: ${v.toFixed(4)}\nUCL: ${ucl.toFixed(4)} (↓${(ucl - v).toFixed(4)})\nCL: ${cl.toFixed(4)}\nLCL: ${lcl.toFixed(4)} (↑${(v - lcl).toFixed(4)})\n${status}`
  }
}

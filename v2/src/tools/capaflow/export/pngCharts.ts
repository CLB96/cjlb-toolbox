// Gráficas del Resumen Ejecutivo PNG (_pngRunChart, _pngQQPlot, _pngBoxPlot, _pngGauge2, _pngHistogram2).
// Dibujo y escalas propios del reporte (distintos de los de pantalla); la matemática viene de logic/.
import { buildBoxPlot, buildQQ, buildRunChart, classifyCpk, normPDF, type AnalysisResult } from '../logic'
import { fmt, type ExportEnv, type ExportPalette } from './exportEnv'

type C = CanvasRenderingContext2D

export function pngRunChart(c: C, cardX: number, cardY: number, cardW: number, cardH: number, r: AnalysisResult, P: ExportPalette, env: ExportEnv): void {
  const { isDark, lang } = env
  const HEADER_OFFSET = 56
  const PAD_L = 70, PAD_R = 28, PAD_T = HEADER_OFFSET + 12, PAD_B = 52
  const pW = cardW - PAD_L - PAD_R, pH = cardH - PAD_T - PAD_B
  const ox = cardX + PAD_L, oy = cardY + PAD_T
  const { data, N, med, yMin, yMax } = buildRunChart(r, 'png')
  const toX = (i: number) => ox + (i / (N - 1)) * pW
  const toY = (v: number) => oy + pH - ((v - yMin) / (yMax - yMin)) * pH
  const medY = toY(med)

  for (let g = 0; g <= 4; g++) { const y = oy + (g / 4) * pH; c.beginPath(); c.moveTo(ox, y); c.lineTo(ox + pW, y); c.strokeStyle = P.grid; c.lineWidth = 1; c.stroke() }

  c.fillStyle = isDark ? 'rgba(74,222,128,0.05)' : 'rgba(22,163,74,0.04)'; c.fillRect(ox, oy, pW, Math.max(0, medY - oy))
  c.fillStyle = isDark ? 'rgba(248,113,113,0.05)' : 'rgba(220,38,38,0.04)'; c.fillRect(ox, medY, pW, Math.max(0, oy + pH - medY))

  c.beginPath(); c.setLineDash([8, 5]); c.moveTo(ox, medY); c.lineTo(ox + pW, medY)
  c.strokeStyle = P.yellow; c.lineWidth = 2.5; c.shadowColor = P.yellow; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0; c.setLineDash([])
  c.font = '600 16px ui-monospace,monospace'; c.fillStyle = P.yellow; c.textAlign = 'right'
  c.fillText('Md=' + med.toFixed(3), ox - 10, medY + 6)

  for (let i = 1; i < N; i++) {
    c.beginPath(); c.moveTo(toX(i - 1), toY(data[i - 1]!)); c.lineTo(toX(i), toY(data[i]!))
    c.strokeStyle = data[i - 1]! >= med ? (isDark ? 'rgba(74,222,128,0.8)' : 'rgba(22,163,74,0.75)') : (isDark ? 'rgba(248,113,113,0.8)' : 'rgba(220,38,38,0.75)')
    c.lineWidth = 2; c.stroke()
  }

  data.forEach((v, i) => {
    c.beginPath(); c.arc(toX(i), toY(v), 4, 0, Math.PI * 2)
    c.fillStyle = v >= med ? (isDark ? '#4ade80' : 'rgba(22,163,74,0.9)') : (isDark ? '#f87171' : 'rgba(220,38,38,0.9)')
    c.fill()
  })

  c.font = '14px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'right'
  for (let g = 0; g <= 4; g++) { const v = yMin + (g / 4) * (yMax - yMin); c.fillText(v.toFixed(2), ox - 8, toY(v) + 5) }
  c.textAlign = 'center'
  const stepX = Math.max(1, Math.ceil(N / 14))
  for (let i = 0; i < N; i += stepX) c.fillText(String(i + 1), toX(i), oy + pH + 28)

  let runs = 1
  let cSide = data[0]! > med ? 1 : data[0]! < med ? -1 : 0
  for (let i = 1; i < N; i++) { const s = data[i]! > med ? 1 : data[i]! < med ? -1 : 0; if (s !== 0 && s !== cSide) { runs++; cSide = s } }
  const es = lang === 'es'
  c.font = '500 15px ui-monospace,monospace'; c.fillStyle = P.textSub; c.textAlign = 'left'
  c.fillText(`${es ? 'Rachas' : 'Runs'}: ${runs}  |  ${es ? 'Esperado' : 'Expected'}: ~${Math.round((2 * N - 1) / 3)}  |  n=${N}`, ox, oy + pH + 46)
}

export function pngQQPlot(c: C, cardX: number, cardY: number, cardW: number, cardH: number, r: AnalysisResult, P: ExportPalette, env: ExportEnv): void {
  const { isDark } = env
  const HEADER_OFFSET = 56
  const PAD_L = 72, PAD_R = 28, PAD_T = HEADER_OFFSET + 12, PAD_B = 52
  const pW = cardW - PAD_L - PAD_R, pH = cardH - PAD_T - PAD_B
  const ox = cardX + PAD_L, oy = cardY + PAD_T
  const { pts, se } = buildQQ(r)
  const thVals = pts.map((p) => p.th), obsVals = pts.map((p) => p.obs)
  // En el PNG el eje X es el teórico y el Y el observado (al revés que en pantalla).
  const xMin = Math.min(...thVals), xMax = Math.max(...thVals)
  const yMin = Math.min(...obsVals), yMax = Math.max(...obsVals)
  const xPad = (xMax - xMin) * 0.08 || 0.01, yPad = (yMax - yMin) * 0.08 || 0.01
  const toX2 = (v: number) => ox + ((v - (xMin - xPad)) / ((xMax + xPad) - (xMin - xPad))) * pW
  const toY2 = (v: number) => oy + pH - ((v - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * pH

  for (let g = 0; g <= 4; g++) {
    const gy = oy + (g / 4) * pH; c.beginPath(); c.moveTo(ox, gy); c.lineTo(ox + pW, gy); c.strokeStyle = P.grid; c.lineWidth = 1; c.stroke()
    const gx = ox + (g / 4) * pW; c.beginPath(); c.moveTo(gx, oy); c.lineTo(gx, oy + pH); c.stroke()
  }

  c.fillStyle = isDark ? 'rgba(74,222,128,0.07)' : 'rgba(22,163,74,0.06)'
  pts.forEach((p) => {
    const x = toX2(p.th), y0 = toY2(p.obs - 1.36 * se), y1 = toY2(p.obs + 1.36 * se)
    if (x >= ox && x <= ox + pW) c.fillRect(x - 1, Math.min(y0, y1), 2, Math.abs(y1 - y0))
  })

  c.beginPath(); c.setLineDash([8, 5])
  c.moveTo(toX2(xMin - xPad), toY2(xMin - xPad)); c.lineTo(toX2(xMax + xPad), toY2(xMax + xPad))
  const refCol = isDark ? 'rgba(74,222,128,0.75)' : 'rgba(22,163,74,0.75)'
  c.strokeStyle = refCol; c.lineWidth = 2.5
  c.shadowColor = refCol; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0; c.setLineDash([])

  pts.forEach((p) => {
    const x = toX2(p.th), y = toY2(p.obs)
    const yIdeal = toY2(p.th), dev = Math.abs(y - yIdeal), maxDev = pH * 0.25, t2 = Math.min(dev / maxDev, 1)
    let col: string
    if (t2 < 0.5) { const u = t2 * 2; col = isDark ? `rgba(${Math.round(74 + 177 * u)},${Math.round(222 - 27 * u)},${Math.round(128 - 128 * u)},0.9)` : `rgba(${Math.round(22 + 198 * u)},${Math.round(163 - 107 * u)},74,0.9)` }
    else { const u = (t2 - 0.5) * 2; col = isDark ? `rgba(251,${Math.round(191 - 130 * u)},${Math.round(36 - 36 * u)},0.9)` : `rgba(220,${Math.round(56 - 18 * u)},38,0.9)` }
    if (x < ox - 4 || x > ox + pW + 4 || y < oy - 4 || y > oy + pH + 4) return
    c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 4; c.fill(); c.shadowBlur = 0
  })

  c.font = '14px ui-monospace,monospace'; c.fillStyle = P.textDim
  c.textAlign = 'right'
  for (let g = 0; g <= 4; g++) { const v = yMin - yPad + (g / 4) * (yMax + yPad - (yMin - yPad)); c.fillText(v.toFixed(2), ox - 8, toY2(v) + 5) }
  c.textAlign = 'center'
  for (let g = 0; g <= 4; g++) { const v = xMin - xPad + (g / 4) * (xMax + xPad - (xMin - xPad)); c.fillText(v.toFixed(2), toX2(v), oy + pH + 26) }

  c.font = '500 15px ui-monospace,monospace'; c.fillStyle = P.textSub; c.textAlign = 'left'
  const normOk = r.adTest.p >= 0.05
  c.fillText(`Anderson-Darling p=${r.adTest.p.toFixed(4)} · ${normOk ? 'Normal ✓' : (env.lang === 'es' ? 'No Normal ⚠' : 'Non-Normal ⚠')}`, ox, oy + pH + 46)
}

export function pngBoxPlot(c: C, cardX: number, cardY: number, cardW: number, cardH: number, r: AnalysisResult, P: ExportPalette, env: ExportEnv): void {
  const { isDark } = env
  const HEADER_OFFSET = 52
  const { Q1, Q2, Q3, outliers, minWhisker, maxWhisker, xMin, xMax } = buildBoxPlot(r)
  const pad = { t: HEADER_OFFSET + 15, r: 180, b: 35, l: 120 }
  const gap = 15
  const sectionH = (cardH - pad.t - pad.b - gap * 2) / 3
  const plotW = cardW - pad.l - pad.r
  const toX = (v: number) => cardX + pad.l + ((v - xMin) / (xMax - xMin)) * plotW
  const star = (v: number | null | undefined, d: number, none = '*') => (v !== null && v !== undefined ? v.toFixed(d) : none)

  const drawSection = (yTop: number, label: string, statsType: 'overall' | 'within' | null) => {
    const centerY = yTop + sectionH / 2, boxH = sectionH * 0.4
    c.font = 'bold 18px ui-monospace,monospace'; c.fillStyle = P.text; c.textAlign = 'center'
    c.fillText(label, cardX + pad.l / 2, centerY + 6)
    c.strokeStyle = P.grid; c.lineWidth = 1
    for (let g = 0; g <= 4; g++) { const x = cardX + pad.l + (g / 4) * plotW; c.beginPath(); c.moveTo(x, yTop); c.lineTo(x, yTop + sectionH); c.stroke() }
    if (!isNaN(r.lsl)) { const lslX = toX(r.lsl); c.beginPath(); c.moveTo(lslX, yTop + 5); c.lineTo(lslX, yTop + sectionH - 5); c.strokeStyle = P.red; c.lineWidth = 2.5; c.stroke() }
    if (!isNaN(r.usl)) { const uslX = toX(r.usl); c.beginPath(); c.moveTo(uslX, yTop + 5); c.lineTo(uslX, yTop + sectionH - 5); c.strokeStyle = P.red; c.lineWidth = 2.5; c.stroke() }
    const q1X = toX(Q1), q2X = toX(Q2), q3X = toX(Q3), minX = toX(minWhisker), maxX = toX(maxWhisker)
    c.beginPath(); c.moveTo(minX, centerY); c.lineTo(q1X, centerY); c.strokeStyle = isDark ? 'rgba(139,92,246,0.75)' : 'rgba(109,40,217,0.75)'; c.lineWidth = 2.5; c.stroke()
    c.beginPath(); c.moveTo(minX, centerY - boxH / 6); c.lineTo(minX, centerY + boxH / 6); c.stroke()
    c.beginPath(); c.moveTo(q3X, centerY); c.lineTo(maxX, centerY); c.stroke()
    c.beginPath(); c.moveTo(maxX, centerY - boxH / 6); c.lineTo(maxX, centerY + boxH / 6); c.stroke()
    const boxWidth = q3X - q1X, gradient = c.createLinearGradient(q1X, 0, q3X, 0)
    if (isDark) { gradient.addColorStop(0, 'rgba(139,92,246,0.45)'); gradient.addColorStop(1, 'rgba(139,92,246,0.15)') }
    else { gradient.addColorStop(0, 'rgba(109,40,217,0.38)'); gradient.addColorStop(1, 'rgba(109,40,217,0.12)') }
    c.fillStyle = gradient; c.fillRect(q1X, centerY - boxH / 2, boxWidth, boxH)
    c.strokeStyle = isDark ? 'rgba(139,92,246,0.9)' : 'rgba(109,40,217,0.9)'; c.lineWidth = 2.5; c.strokeRect(q1X, centerY - boxH / 2, boxWidth, boxH)
    c.beginPath(); c.moveTo(q2X, centerY - boxH / 2); c.lineTo(q2X, centerY + boxH / 2); c.strokeStyle = isDark ? '#fbbf24' : '#f59e0b'; c.lineWidth = 3; c.stroke()
    const meanX = toX(r.xBar); c.beginPath(); c.arc(meanX, centerY, 5, 0, Math.PI * 2); c.fillStyle = isDark ? '#06b6d4' : '#0891b2'; c.fill()
    outliers.forEach((v) => { const px = toX(v); c.beginPath(); c.arc(px, centerY, 6, 0, Math.PI * 2); c.fillStyle = P.red; c.fill() })
    if (statsType) {
      const statsX = cardX + pad.l + plotW + 15; c.font = '15px ui-monospace,monospace'; c.fillStyle = P.textSub; c.textAlign = 'left'
      const stats = statsType === 'overall'
        ? [`StDev ${star(r.sOverall, 4)}`, `Pp    ${star(r.Pp, 2)}`, `Ppk   ${star(r.Ppk, 2)}`, `Cpm   ${star(r.Cpm, 2)}`, `PPM   ${star(r.ppmOverall, 2, '0.00')}`]
        : [`StDev ${star(r.sWithin, 4)}`, `Cp    ${star(r.Cp, 2)}`, `Cpk   ${star(r.Cpk, 2)}`, `PPM   ${star(r.ppm, 2, '0.00')}`]
      stats.forEach((s, i) => c.fillText(s, statsX, yTop + 20 + i * 20))
    }
  }

  drawSection(cardY + pad.t, 'Overall', 'overall')
  drawSection(cardY + pad.t + sectionH + gap, 'Within', 'within')
  drawSection(cardY + pad.t + (sectionH + gap) * 2, 'Specs', null)

  c.strokeStyle = P.textDim; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cardX + pad.l, cardY + cardH - pad.b); c.lineTo(cardX + cardW - pad.r, cardY + cardH - pad.b); c.stroke()
  c.font = '14px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center'
  for (let g = 0; g <= 4; g++) { const v = xMin + (g / 4) * (xMax - xMin); c.fillText(v.toFixed(3), cardX + pad.l + (g / 4) * plotW, cardY + cardH - pad.b + 18) }
  if (!isNaN(r.lsl)) { c.fillStyle = P.red; c.font = 'bold 14px ui-monospace,monospace'; c.fillText('LSL', toX(r.lsl), cardY + cardH - pad.b + 32) }
  if (!isNaN(r.usl)) { c.fillStyle = P.red; c.font = 'bold 14px ui-monospace,monospace'; c.fillText('USL', toX(r.usl), cardY + cardH - pad.b + 32) }
}

export function pngGauge(c: C, cardX: number, cardY: number, cardW: number, cardH: number, cpk: number | null, color: string, P: ExportPalette, env: ExportEnv): void {
  const HEADER_OFFSET = 52
  const cx = cardX + cardW / 2
  const cy = cardY + HEADER_OFFSET + (cardH - HEADER_OFFSET) * 0.52
  const R = Math.min(cardW * 0.36, (cardH - HEADER_OFFSET) * 0.50)

  c.beginPath(); c.arc(cx, cy, R, Math.PI, 2 * Math.PI)
  c.lineWidth = 20; c.strokeStyle = 'rgba(128,128,148,0.1)'; c.lineCap = 'round'; c.stroke()

  const zones = [
    { from: 0, to: 1.00, col: 'rgba(248,113,113,0.75)' },
    { from: 1.00, to: 1.33, col: 'rgba(251,191,36,0.75)' },
    { from: 1.33, to: 1.67, col: 'rgba(74,222,128,0.75)' },
    { from: 1.67, to: 2.00, col: 'rgba(0,229,255,0.75)' },
  ]
  zones.forEach((z) => {
    c.beginPath()
    c.arc(cx, cy, R, Math.PI + (z.from / 2) * Math.PI, Math.PI + (z.to / 2) * Math.PI)
    c.lineWidth = 14; c.strokeStyle = z.col; c.lineCap = 'butt'; c.stroke()
  })

  const cl = Math.max(0, Math.min(cpk !== null && cpk !== undefined ? cpk : 0, 2))
  const ang = Math.PI + (cl / 2) * Math.PI
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + (R - 4) * Math.cos(ang), cy + (R - 4) * Math.sin(ang))
  c.lineWidth = 4; c.strokeStyle = color; c.lineCap = 'round'
  c.shadowColor = color; c.shadowBlur = 18; c.stroke(); c.shadowBlur = 0

  c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2)
  c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 14; c.fill(); c.shadowBlur = 0

  c.font = '500 15px ui-monospace,monospace'; c.fillStyle = 'rgba(160,170,200,0.7)'; c.textAlign = 'center'
  ;[0, 0.5, 1.0, 1.33, 1.67, 2.0].forEach((v) => {
    const a = Math.PI + (v / 2) * Math.PI
    c.fillText(v % 1 === 0 ? v.toFixed(0) : v.toFixed(2), cx + (R + 22) * Math.cos(a), cy + (R + 22) * Math.sin(a) + 5)
  })

  c.font = '800 54px system-ui,sans-serif'; c.fillStyle = color; c.textAlign = 'center'
  c.shadowColor = color; c.shadowBlur = 12
  c.fillText(fmt(cpk), cx, cy + 62)
  c.shadowBlur = 0
  c.font = '500 20px ui-monospace,monospace'; c.fillStyle = P.textSub
  c.fillText('Cpk', cx, cy + 86)

  const verdict = cpk !== null ? classifyCpk(cpk, env.lang).label : '—'
  const vBg = cpk !== null ? (cpk >= 1.33 ? P.greenBg : cpk >= 1.0 ? P.yellowBg : P.redBg) : 'transparent'
  const vBd = cpk !== null ? (cpk >= 1.33 ? P.greenBorder : cpk >= 1.0 ? P.yellowBorder : P.redBorder) : P.border
  c.font = '600 18px ui-monospace,monospace'
  const vw = c.measureText(verdict).width + 32
  const vx = cx - vw / 2, vy = cy + 96
  c.beginPath(); c.roundRect(vx, vy, vw, 28, 14); c.fillStyle = vBg; c.fill()
  c.strokeStyle = vBd; c.lineWidth = 1.5; c.stroke()
  c.fillStyle = color; c.textAlign = 'center'; c.fillText(verdict, cx, vy + 20)
}

export function pngHistogram(c: C, cardX: number, cardY: number, cardW: number, cardH: number, r: AnalysisResult, P: ExportPalette, env: ExportEnv): void {
  void env
  const HEADER_OFFSET = 52
  const PAD_L = 52, PAD_R = 28, PAD_T = HEADER_OFFSET + 14, PAD_B = 58
  const pW = cardW - PAD_L - PAD_R
  const pH = cardH - PAD_T - PAD_B
  const ox = cardX + PAD_L
  const oy = cardY + PAD_T

  const bins = Math.max(8, Math.min(20, Math.ceil(Math.sqrt(r.data.length))))
  const ext = r.sOverall * 0.55
  const dMin = r.minV - ext, dMax = r.maxV + ext
  const bw = (dMax - dMin) / bins
  const counts: number[] = new Array(bins).fill(0)
  r.data.forEach((v) => {
    let i = Math.floor((v - dMin) / bw)
    i = Math.max(0, Math.min(bins - 1, i))
    counts[i]!++
  })
  const maxC = Math.max(...counts)

  for (let g = 1; g <= 4; g++) {
    const gy = oy + pH - (g / 4) * pH
    c.beginPath(); c.moveTo(ox, gy); c.lineTo(ox + pW, gy)
    c.strokeStyle = P.grid; c.lineWidth = 1; c.stroke()
  }

  counts.forEach((cnt, i) => {
    if (!cnt) return
    const bx = ox + (i / bins) * pW
    const bww = pW / bins - 1.5
    const bh = (cnt / maxC) * pH
    const by = oy + pH - bh
    const g = c.createLinearGradient(0, by, 0, by + bh)
    g.addColorStop(0, P.barA); g.addColorStop(1, P.barB)
    c.fillStyle = g
    c.beginPath(); c.roundRect(bx, by, bww, bh, [3, 3, 0, 0]); c.fill()
  })

  c.beginPath(); c.moveTo(ox, oy + pH); c.lineTo(ox + pW, oy + pH)
  c.strokeStyle = P.borderLight; c.lineWidth = 1.5; c.stroke()

  const maxPDF = normPDF(r.xBar, r.xBar, r.sOverall)
  c.beginPath()
  for (let i = 0; i <= 200; i++) {
    const xv = dMin + (i / 200) * (dMax - dMin)
    const px = ox + ((xv - dMin) / (dMax - dMin)) * pW
    const py = oy + pH - (normPDF(xv, r.xBar, r.sOverall) / maxPDF) * pH * 0.92
    if (i === 0) c.moveTo(px, py)
    else c.lineTo(px, py)
  }
  c.strokeStyle = P.curve; c.lineWidth = 3
  c.shadowColor = P.curve; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0

  const drawVline = (val: number, col: string, lbl: string) => {
    if (isNaN(val)) return
    const px = ox + ((val - dMin) / (dMax - dMin)) * pW
    if (px < ox - 2 || px > ox + pW + 2) return
    c.beginPath(); c.setLineDash([6, 5])
    c.moveTo(px, oy); c.lineTo(px, oy + pH)
    c.strokeStyle = col; c.lineWidth = 2.5
    c.shadowColor = col; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0; c.setLineDash([])
    c.font = 'bold 14px ui-monospace,monospace'; c.fillStyle = col; c.textAlign = 'center'
    c.fillText(lbl, px, oy + 14)
  }
  drawVline(r.lsl, P.specLine, 'LSL')
  drawVline(r.usl, P.specLine, 'USL')
  if (!isNaN(r.targetVal)) drawVline(r.targetVal, P.targetLine, 'T')

  const mpx = ox + ((r.xBar - dMin) / (dMax - dMin)) * pW
  c.beginPath(); c.setLineDash([3, 4])
  c.moveTo(mpx, oy); c.lineTo(mpx, oy + pH)
  c.strokeStyle = P.meanLine; c.lineWidth = 1.8; c.stroke(); c.setLineDash([])

  c.font = '400 14px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center'
  for (let i = 0; i <= 5; i++) {
    const xv = dMin + (i / 5) * (dMax - dMin)
    c.fillText(xv.toFixed(2), ox + (i / 5) * pW, oy + pH + 22)
  }

  const legY = oy + pH + 38
  const dot = (x: number, y: number, col: string) => { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.fill() }
  c.font = '400 14px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'left'
  dot(ox + 8, legY, P.barA); c.fillText('Freq.', ox + 19, legY + 5)
  dot(ox + 90, legY, P.curve); c.fillText('Normal', ox + 101, legY + 5)
  dot(ox + 190, legY, P.specLine); c.fillText('LSL/USL', ox + 201, legY + 5)
}

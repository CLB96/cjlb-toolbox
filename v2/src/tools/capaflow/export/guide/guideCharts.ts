// Ejemplos ilustrativos de la Guía de Lectura (_drawGuideRunChart, _drawGuideQQPlot, _drawGuideBoxPlot,
// _drawGuideHistogram, _drawGuideCCChart, _drawGuideDistComp). Datos fijos del original.
import { normPDF, probit, quartile } from '../../logic'
import type { GuidePalette } from './guideKit'

type C = CanvasRenderingContext2D

export function guideRunChart(c: C, ox2: number, oy2: number, W2: number, H2: number, P: GuidePalette, isDark: boolean, es: boolean): void {
  const pad = { t: 28, r: 20, b: 32, l: 50 }
  const pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b
  const pts = [10.0, 10.1, 9.95, 10.15, 10.3, 10.4, 10.25, 10.5, 10.35, 10.6, 10.55, 10.7, 10.4, 10.65, 10.8, 10.6, 10.75, 10.9, 10.8, 11.0]
  const N = pts.length, med = 10.475
  const yMin = 9.7, yMax = 11.2
  const toX = (i: number) => ox2 + pad.l + (i / (N - 1)) * pW
  const toY = (v: number) => oy2 + pad.t + pH - ((v - yMin) / (yMax - yMin)) * pH
  const medY = toY(med)

  c.fillStyle = isDark ? 'rgba(74,222,128,0.05)' : 'rgba(22,163,74,0.04)'; c.fillRect(ox2 + pad.l, oy2 + pad.t, pW, Math.max(0, medY - oy2 - pad.t))
  c.fillStyle = isDark ? 'rgba(248,113,113,0.05)' : 'rgba(220,38,38,0.04)'; c.fillRect(ox2 + pad.l, medY, pW, Math.max(0, oy2 + pad.t + pH - medY))

  c.beginPath(); c.setLineDash([6, 4]); c.moveTo(ox2 + pad.l, medY); c.lineTo(ox2 + pad.l + pW, medY)
  c.strokeStyle = P.yellow; c.lineWidth = 2.5; c.shadowColor = P.yellow; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0; c.setLineDash([])
  c.font = 'bold 13px ui-monospace,monospace'; c.fillStyle = P.yellow; c.textAlign = 'right'
  c.fillText('Md=' + med.toFixed(2), ox2 + pad.l - 5, medY + 4)

  for (let i = 1; i < N; i++) {
    c.beginPath(); c.moveTo(toX(i - 1), toY(pts[i - 1]!)); c.lineTo(toX(i), toY(pts[i]!))
    c.strokeStyle = pts[i - 1]! >= med ? (isDark ? 'rgba(74,222,128,0.7)' : 'rgba(22,163,74,0.75)') : (isDark ? 'rgba(248,113,113,0.7)' : 'rgba(220,38,38,0.75)')
    c.lineWidth = 2; c.stroke()
  }

  pts.forEach((p, i) => {
    c.beginPath(); c.arc(toX(i), toY(p), 4.5, 0, Math.PI * 2)
    c.fillStyle = p >= med ? (isDark ? '#4ade80' : 'rgba(22,163,74,0.9)') : (isDark ? '#f87171' : 'rgba(220,38,38,0.9)'); c.fill()
  })

  const ax0 = toX(2), ax1 = toX(N - 2), ay = oy2 + pad.t + 12
  c.beginPath(); c.moveTo(ax0, ay); c.lineTo(ax1, ay)
  c.strokeStyle = P.red; c.lineWidth = 2; c.setLineDash([4, 3]); c.stroke(); c.setLineDash([])
  c.beginPath(); c.moveTo(ax1 - 10, ay - 5); c.lineTo(ax1, ay); c.lineTo(ax1 - 10, ay + 5); c.strokeStyle = P.red; c.lineWidth = 2; c.stroke()
  c.font = 'bold 13px system-ui,sans-serif'; c.fillStyle = P.red; c.textAlign = 'center'
  c.fillText(es ? 'TENDENCIA (DRIFT) ⚠' : 'DRIFT TREND ⚠', (ax0 + ax1) / 2, ay - 6)
}

export function guideQQPlot(c: C, ox2: number, oy2: number, W2: number, H2: number, P: GuidePalette, isDark: boolean, es: boolean): void {
  const pad = { t: 30, r: 20, b: 40, l: 55 }
  const pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b
  const mu = 10, sig = 0.18
  const demoN = 22
  const demoData: { th: number; obs: number }[] = []
  for (let i = 0; i < demoN; i++) {
    const p = (i + 0.5) / demoN
    let obs = mu + sig * probit(p)
    if (i < 2) obs -= 0.22
    if (i > demoN - 3) obs += 0.25
    demoData.push({ th: mu + sig * probit(p), obs })
  }

  // X = observado, Y = teórico
  const xMin = Math.min(...demoData.map((p) => p.obs)), xMax = Math.max(...demoData.map((p) => p.obs))
  const yMin = Math.min(...demoData.map((p) => p.th)), yMax = Math.max(...demoData.map((p) => p.th))
  const xPad = (xMax - xMin) * 0.1, yPad = (yMax - yMin) * 0.1
  const toX = (v: number) => ox2 + pad.l + ((v - (xMin - xPad)) / ((xMax + xPad) - (xMin - xPad))) * pW
  const toY = (v: number) => oy2 + pad.t + pH - ((v - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * pH

  for (let g = 1; g < 5; g++) {
    const gy = oy2 + pad.t + (g / 5) * pH; c.beginPath(); c.moveTo(ox2 + pad.l, gy); c.lineTo(ox2 + pad.l + pW, gy); c.strokeStyle = P.borderLight; c.lineWidth = 1; c.stroke()
    const gx = ox2 + pad.l + (g / 5) * pW; c.beginPath(); c.moveTo(gx, oy2 + pad.t); c.lineTo(gx, oy2 + pad.t + pH); c.stroke()
  }

  c.beginPath(); c.setLineDash([7, 5])
  c.moveTo(toX(xMin - xPad), toY(xMin - xPad)); c.lineTo(toX(xMax + xPad), toY(xMax + xPad))
  const lineCol = isDark ? 'rgba(74,222,128,0.8)' : 'rgba(22,163,74,0.8)'
  c.strokeStyle = lineCol; c.lineWidth = 2.5
  c.shadowColor = lineCol; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0; c.setLineDash([])
  c.font = 'bold 13px ui-monospace,monospace'; c.fillStyle = lineCol; c.textAlign = 'left'
  c.fillText(es ? 'Línea Normal' : 'Normal Line', ox2 + pad.l + pW * 0.4, oy2 + pad.t + 22)

  demoData.forEach((p) => {
    const x = toX(p.obs), y = toY(p.th), yId = toY(p.obs)
    const dev = Math.abs(y - yId), maxDev = pH * 0.22, t2 = Math.min(dev / maxDev, 1)
    let col: string
    if (t2 < 0.4) col = isDark ? 'rgba(74,222,128,0.9)' : 'rgba(22,163,74,0.85)'
    else if (t2 < 0.75) col = isDark ? 'rgba(251,191,36,0.9)' : 'rgba(180,83,9,0.85)'
    else col = isDark ? 'rgba(248,113,113,0.9)' : 'rgba(220,38,38,0.85)'
    c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 5; c.fill(); c.shadowBlur = 0
  })

  c.font = '12px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center'
  c.fillText(es ? 'Datos Obs. →' : 'Observed →', ox2 + pad.l + pW / 2, oy2 + pad.t + pH + 28)
  c.save(); c.translate(ox2 + pad.l - 38, oy2 + pad.t + pH / 2); c.rotate(-Math.PI / 2)
  c.fillText(es ? 'Cuantiles Teóricos' : 'Theoretical Quantiles', 0, 0); c.restore()

  const outlierX = toX(demoData[demoN - 1]!.obs), outlierY = toY(demoData[demoN - 1]!.th)
  c.beginPath(); c.moveTo(outlierX, outlierY); c.lineTo(outlierX + 40, outlierY - 30)
  c.strokeStyle = P.red; c.lineWidth = 1.5; c.stroke()
  c.font = 'bold 13px system-ui,sans-serif'; c.fillStyle = P.red; c.textAlign = 'left'
  c.fillText(es ? 'Cola pesada' : 'Heavy tail', outlierX + 44, outlierY - 26)
}

export function guideBoxPlot(c: C, ox2: number, oy2: number, W2: number, H2: number, P: GuidePalette, isDark: boolean): void {
  const demoData = [9.5, 9.7, 9.75, 9.8, 9.85, 9.9, 9.92, 9.95, 9.98, 10.0, 10.02, 10.05, 10.08, 10.1, 10.12, 10.15, 10.2, 10.25, 10.3, 10.5, 11.2]
  const sorted = [...demoData].sort((a, b) => a - b), N = sorted.length
  const Q1 = quartile(sorted, 0.25), Q2 = quartile(sorted, 0.5), Q3 = quartile(sorted, 0.75)
  const IQR = Q3 - Q1, lowerFence = Q1 - 1.5 * IQR, upperFence = Q3 + 1.5 * IQR
  const mean = demoData.reduce((a, b) => a + b, 0) / N
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence)
  const inliers = sorted.filter((v) => v >= lowerFence && v <= upperFence)
  const minWhisker = Math.min(...inliers), maxWhisker = Math.max(...inliers)

  const pad = { t: 15, r: 130, b: 35, l: 100 }, gap = 12
  const sectionH = (H2 - pad.t - pad.b - gap * 2) / 3, plotW = W2 - pad.l - pad.r
  const xMin = 9.2, xMax = 11.5
  const toX = (v: number) => ox2 + pad.l + ((v - xMin) / (xMax - xMin)) * plotW
  const lsl = 9.55, usl = 10.45

  const drawSection = (yTop: number, label: string) => {
    const centerY = yTop + sectionH / 2, boxH = sectionH * 0.35
    c.font = 'bold 14px ui-monospace,monospace'; c.fillStyle = P.text; c.textAlign = 'center'
    c.fillText(label, ox2 + pad.l / 2, centerY + 5)
    c.strokeStyle = P.borderLight; c.lineWidth = 0.8
    for (let g = 0; g <= 4; g++) { const x = ox2 + pad.l + (g / 4) * plotW; c.beginPath(); c.moveTo(x, yTop); c.lineTo(x, yTop + sectionH); c.stroke() }
    ;[lsl, usl].forEach((v) => {
      const sx = toX(v); c.beginPath(); c.moveTo(sx, yTop + 4); c.lineTo(sx, yTop + sectionH - 4)
      c.strokeStyle = P.red; c.lineWidth = 2; c.stroke()
    })
    const q1X = toX(Q1), q2X = toX(Q2), q3X = toX(Q3), minX = toX(minWhisker), maxX = toX(maxWhisker)
    c.beginPath(); c.moveTo(minX, centerY); c.lineTo(q1X, centerY)
    c.strokeStyle = isDark ? 'rgba(139,92,246,0.75)' : 'rgba(109,40,217,0.75)'; c.lineWidth = 2; c.stroke()
    c.beginPath(); c.moveTo(minX, centerY - boxH / 6); c.lineTo(minX, centerY + boxH / 6); c.stroke()
    c.beginPath(); c.moveTo(q3X, centerY); c.lineTo(maxX, centerY); c.stroke()
    c.beginPath(); c.moveTo(maxX, centerY - boxH / 6); c.lineTo(maxX, centerY + boxH / 6); c.stroke()
    const boxWidth = q3X - q1X, gradient = c.createLinearGradient(q1X, 0, q3X, 0)
    if (isDark) { gradient.addColorStop(0, 'rgba(139,92,246,0.5)'); gradient.addColorStop(1, 'rgba(139,92,246,0.2)') }
    else { gradient.addColorStop(0, 'rgba(109,40,217,0.4)'); gradient.addColorStop(1, 'rgba(109,40,217,0.15)') }
    c.fillStyle = gradient; c.fillRect(q1X, centerY - boxH / 2, boxWidth, boxH)
    c.strokeStyle = isDark ? 'rgba(139,92,246,0.95)' : 'rgba(109,40,217,0.95)'; c.lineWidth = 2; c.strokeRect(q1X, centerY - boxH / 2, boxWidth, boxH)
    c.beginPath(); c.moveTo(q2X, centerY - boxH / 2); c.lineTo(q2X, centerY + boxH / 2)
    c.strokeStyle = isDark ? '#fbbf24' : '#f59e0b'; c.lineWidth = 2.5; c.stroke()
    const meanX = toX(mean); c.beginPath(); c.arc(meanX, centerY, 4, 0, Math.PI * 2)
    c.fillStyle = isDark ? '#06b6d4' : '#0891b2'; c.fill()
    outliers.forEach((v) => { const px = toX(v); c.beginPath(); c.arc(px, centerY, 5, 0, Math.PI * 2); c.fillStyle = P.red; c.fill() })
  }

  drawSection(oy2 + pad.t, 'Overall')
  drawSection(oy2 + pad.t + sectionH + gap, 'Within')
  drawSection(oy2 + pad.t + (sectionH + gap) * 2, 'Specs')

  c.strokeStyle = P.textDim; c.lineWidth = 1; c.beginPath(); c.moveTo(ox2 + pad.l, oy2 + H2 - pad.b); c.lineTo(ox2 + W2 - pad.r, oy2 + H2 - pad.b); c.stroke()
  c.font = '11px ui-monospace,monospace'; c.fillStyle = P.textDim; c.textAlign = 'center'
  for (let g = 0; g <= 4; g++) { const v = xMin + (g / 4) * (xMax - xMin); c.fillText(v.toFixed(1), ox2 + pad.l + (g / 4) * plotW, oy2 + H2 - pad.b + 14) }
  c.fillStyle = P.red; c.font = 'bold 11px ui-monospace,monospace'
  c.fillText('LSL', toX(lsl), oy2 + H2 - pad.b + 26)
  c.fillText('USL', toX(usl), oy2 + H2 - pad.b + 26)
}

export function guideHistogram(c: C, ox2: number, oy2: number, W2: number, H2: number, isDark: boolean): void {
  const pad = { t: 30, r: 20, b: 30, l: 40 }
  const pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b
  const mu = 10, sig = 0.15
  const lsl = 9.55, usl = 10.45
  const bins = 12
  const dMin = 9.2, dMax = 10.8, binW = (dMax - dMin) / bins

  const toLX = (v: number) => ox2 + pad.l + ((v - dMin) / (dMax - dMin)) * pW
  const lslX = toLX(lsl), uslX = toLX(usl)
  c.fillStyle = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)'
  c.fillRect(ox2 + pad.l, oy2 + pad.t, lslX - ox2 - pad.l, pH)
  c.fillRect(uslX, oy2 + pad.t, ox2 + pad.l + pW - uslX, pH)

  const heights: number[] = []
  for (let i = 0; i < bins; i++) heights.push(normPDF(dMin + (i + 0.5) * binW, mu, sig))
  const maxH = Math.max(...heights)
  heights.forEach((h, i) => {
    const bx = ox2 + pad.l + (i / bins) * pW, bw = pW / bins - 1.5, bh = (h / maxH) * pH * 0.85
    const by = oy2 + pad.t + pH - bh
    const g = c.createLinearGradient(0, by, 0, by + bh)
    if (isDark) { g.addColorStop(0, 'rgba(79,195,247,0.75)'); g.addColorStop(1, 'rgba(0,229,255,0.15)') }
    else { g.addColorStop(0, 'rgba(33,150,243,0.65)'); g.addColorStop(1, 'rgba(100,160,240,0.12)') }
    c.fillStyle = g; c.beginPath(); c.roundRect(bx, by, bw, bh, [2, 2, 0, 0]); c.fill()
  })

  c.beginPath()
  for (let i = 0; i <= 100; i++) {
    const xv = dMin + (i / 100) * (dMax - dMin)
    const px = ox2 + pad.l + ((xv - dMin) / (dMax - dMin)) * pW
    const py = oy2 + pad.t + pH - (normPDF(xv, mu, sig) / maxH) * pH * 0.85
    if (i === 0) c.moveTo(px, py)
    else c.lineTo(px, py)
  }
  const curveCol = isDark ? 'rgba(105,240,174,0.9)' : 'rgba(22,163,74,0.9)'
  c.strokeStyle = curveCol
  c.lineWidth = 3; c.shadowColor = curveCol; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0

  const drawSpecLine = (val: number, lbl: string) => {
    const px = toLX(val)
    c.beginPath(); c.moveTo(px, oy2 + pad.t); c.lineTo(px, oy2 + pad.t + pH)
    const col = isDark ? 'rgba(239,68,68,0.9)' : 'rgba(185,28,28,0.85)'
    c.strokeStyle = col; c.lineWidth = 2.5
    c.shadowColor = col; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0
    c.font = 'bold 13px ui-monospace,monospace'
    const bw = c.measureText(lbl).width + 10
    c.fillStyle = isDark ? 'rgba(239,68,68,0.75)' : 'rgba(185,28,28,0.80)'
    c.beginPath(); c.roundRect(px - bw / 2, oy2 + 4, bw, 18, 4); c.fill()
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(lbl, px, oy2 + 16)
  }
  drawSpecLine(lsl, 'LSL'); drawSpecLine(usl, 'USL')

  const mpx = toLX(mu)
  c.beginPath(); c.setLineDash([4, 3]); c.moveTo(mpx, oy2 + pad.t); c.lineTo(mpx, oy2 + pad.t + pH)
  c.strokeStyle = isDark ? 'rgba(79,195,247,0.8)' : 'rgba(33,150,243,0.8)'; c.lineWidth = 2; c.stroke(); c.setLineDash([])
  c.font = 'bold 12px monospace'; c.fillStyle = isDark ? 'rgba(79,195,247,0.9)' : 'rgba(33,150,243,0.9)'; c.textAlign = 'center'
  c.fillText('x̄', mpx, oy2 + pad.t + pH + 18)
}

export function guideCCChart(c: C, ox2: number, oy2: number, W2: number, H2: number, P: GuidePalette, isDark: boolean): void {
  const pad = { t: 20, r: 20, b: 24, l: 50 }
  const pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b
  const pts = [100, 102, 99, 103, 100.5, 101, 104.5, 99.5, 100, 101.5, 105, 100.2, 101, 99.8, 100.5]
  const cl = 101, ucl = 104.5, lcl = 97.5, sigma = 1.17
  const n = pts.length
  const yMin = 95, yMax = 107
  const toX = (i: number) => ox2 + pad.l + (i / (n - 1)) * pW
  const toY = (v: number) => oy2 + pad.t + pH - ((v - yMin) / (yMax - yMin)) * pH

  c.fillStyle = isDark ? 'rgba(251,191,36,0.05)' : 'rgba(180,83,9,0.04)'
  c.fillRect(ox2 + pad.l, toY(cl + 2 * sigma), pW, toY(cl + sigma) - toY(cl + 2 * sigma))
  c.fillRect(ox2 + pad.l, toY(cl - sigma), pW, toY(cl - 2 * sigma) - toY(cl - sigma))

  const hl2 = (y: number, col: string, dash: number[], lw: number) => {
    c.beginPath(); c.setLineDash(dash); c.moveTo(ox2 + pad.l, y); c.lineTo(ox2 + pad.l + pW, y)
    c.strokeStyle = col; c.lineWidth = lw; c.stroke(); c.setLineDash([])
  }
  hl2(toY(ucl), isDark ? 'rgba(248,113,113,0.85)' : 'rgba(185,28,28,0.85)', [8, 5], 2.5)
  hl2(toY(lcl), isDark ? 'rgba(248,113,113,0.85)' : 'rgba(185,28,28,0.85)', [8, 5], 2.5)
  hl2(toY(cl + 2 * sigma), isDark ? 'rgba(251,191,36,0.5)' : 'rgba(180,83,9,0.5)', [4, 4], 1.5)
  hl2(toY(cl - 2 * sigma), isDark ? 'rgba(251,191,36,0.5)' : 'rgba(180,83,9,0.5)', [4, 4], 1.5)
  hl2(toY(cl), isDark ? 'rgba(0,229,255,0.75)' : 'rgba(0,103,187,0.75)', [], 2.5)

  c.font = 'bold 12px ui-monospace,monospace'; c.fillStyle = isDark ? 'rgba(248,113,113,0.8)' : 'rgba(185,28,28,0.8)'; c.textAlign = 'left'
  c.fillText('UCL', ox2 + pad.l + pW + 4, toY(ucl) + 4)
  c.fillText('LCL', ox2 + pad.l + pW + 4, toY(lcl) + 4)
  c.fillStyle = isDark ? 'rgba(0,229,255,0.8)' : 'rgba(0,103,187,0.8)'
  c.fillText('CL', ox2 + pad.l + pW + 4, toY(cl) + 4)

  const lineCol = isDark ? 'rgba(79,195,247,0.85)' : 'rgba(33,150,243,0.85)'
  c.beginPath(); pts.forEach((p, i) => { if (i === 0) c.moveTo(toX(i), toY(p)); else c.lineTo(toX(i), toY(p)) })
  c.strokeStyle = lineCol; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke()

  const ooc = [6, 10]
  pts.forEach((p, i) => {
    const x = toX(i), y = toY(p), isV = ooc.includes(i)
    c.beginPath(); c.arc(x, y, isV ? 7 : 4, 0, Math.PI * 2)
    if (isV) {
      c.fillStyle = P.red; c.shadowColor = P.red; c.shadowBlur = 12; c.fill(); c.shadowBlur = 0
      c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.strokeStyle = 'rgba(248,113,113,0.3)'; c.lineWidth = 2; c.stroke()
    } else { c.fillStyle = lineCol; c.fill() }
  })
}

export function guideDistComp(c: C, ox2: number, oy2: number, W2: number, H2: number, P: GuidePalette, isDark: boolean, centered: boolean, es: boolean): void {
  const lsl = 9.55, usl = 10.45
  const mu = centered ? 10 : 10.3, sig = 0.12
  const dMin = 9.2, dMax = 10.8
  const pad = { t: 45, r: 20, b: 35, l: 20 }, pW = W2 - pad.l - pad.r, pH = H2 - pad.t - pad.b
  const toX = (v: number) => ox2 + pad.l + ((v - dMin) / (dMax - dMin)) * pW
  const lslX = toX(lsl), uslX = toX(usl)

  c.fillStyle = isDark ? 'rgba(248,113,113,0.1)' : 'rgba(220,38,38,0.07)'
  c.fillRect(ox2 + pad.l, oy2 + pad.t, lslX - ox2 - pad.l, pH)
  c.fillRect(uslX, oy2 + pad.t, ox2 + pad.l + pW - uslX, pH)

  const pts2: { x: number; y: number }[] = []
  for (let i = 0; i <= 100; i++) {
    const xv = dMin + (i / 100) * (dMax - dMin)
    pts2.push({ x: toX(xv), y: oy2 + pad.t + pH - (normPDF(xv, mu, sig) / normPDF(mu, mu, sig)) * pH * 0.85 })
  }
  c.beginPath(); c.moveTo(pts2[0]!.x, oy2 + pad.t + pH)
  pts2.forEach((p) => c.lineTo(p.x, p.y))
  c.lineTo(pts2[pts2.length - 1]!.x, oy2 + pad.t + pH); c.closePath()
  const g = c.createLinearGradient(0, oy2 + pad.t, 0, oy2 + pad.t + pH)
  g.addColorStop(0, centered ? (isDark ? 'rgba(74,222,128,0.45)' : 'rgba(22,163,74,0.35)') : (isDark ? 'rgba(251,191,36,0.35)' : 'rgba(180,83,9,0.30)'))
  g.addColorStop(1, 'transparent')
  c.fillStyle = g; c.fill()
  c.beginPath(); pts2.forEach((p, i) => { if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y) })
  c.strokeStyle = centered ? (isDark ? P.green : 'rgba(22,163,74,0.9)') : (isDark ? P.yellow : 'rgba(180,83,9,0.9)')
  c.lineWidth = 2.5; c.stroke()

  ;[lsl, usl].forEach((v, i) => {
    const px = toX(v)
    c.beginPath(); c.moveTo(px, oy2 + pad.t); c.lineTo(px, oy2 + pad.t + pH)
    const col = isDark ? 'rgba(248,113,113,0.85)' : 'rgba(185,28,28,0.85)'
    c.strokeStyle = col; c.lineWidth = 2
    c.shadowColor = col; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0
    c.font = 'bold 12px monospace'; c.fillStyle = 'rgba(248,113,113,0.9)'; c.textAlign = 'center'
    c.fillText(i === 0 ? 'LSL' : 'USL', px, oy2 + pad.t - 6)
  })

  const lbl = centered ? (es ? '✓ Centrado — Cpk ≈ 1.55' : '✓ Centered — Cpk ≈ 1.55') : (es ? '⚠ Descentrado — Cpk ≈ 0.58' : '⚠ Off-center — Cpk ≈ 0.58')
  const lblCol = centered ? P.green : P.yellow
  const lblBg = centered ? P.greenBg : P.yellowBg
  const lblBd = centered ? P.greenBd : P.yellowBd
  c.font = '600 15px ui-monospace,monospace'
  const lw = c.measureText(lbl).width + 20
  const lx = ox2 + W2 / 2 - lw / 2
  c.beginPath(); c.roundRect(lx, oy2 + 8, lw, 24, 12); c.fillStyle = lblBg; c.fill()
  c.strokeStyle = lblBd; c.lineWidth = 1.5; c.stroke()
  c.fillStyle = lblCol; c.textAlign = 'center'; c.fillText(lbl, ox2 + W2 / 2, oy2 + 24)
}

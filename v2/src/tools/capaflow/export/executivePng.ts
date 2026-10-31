// Resumen Ejecutivo PNG (generateExecutivePNG / _drawPNG del original): 1600 px de ancho, alto calculado.
import { autoCCType, buildControlChartExport, buildInterpretationPlain, classifyCpk, fmtN, type AnalysisResult, type CCTypeChoice } from '../logic'
import { cpkColorOf, exportPalette, fmt, localDate, newCanvas, stamp, triggerDownload, type ExportEnv, type ExportPalette } from './exportEnv'
import { pngBoxPlot, pngGauge, pngHistogram, pngQQPlot, pngRunChart } from './pngCharts'
import { pngCCChart } from './pngControlChart'

interface Row { label: string; val: string; color?: string }

const W = 1600
const PAD = 48
const GAP = 20
const COL2 = (W - PAD * 2 - GAP) / 2
const COL3 = (W - PAD * 2 - GAP * 2) / 3
const ROW_H = 38
const FONT_LABEL = '400 21px ui-monospace,monospace'
const FONT_VALUE = '600 21px ui-monospace,monospace'
const FONT_HEAD = '600 19px ui-monospace,monospace'
const FONT_TITLE = '700 24px ui-monospace,monospace'
const FONT_KPI = '800 56px system-ui,sans-serif'
const FONT_BADGE = '600 19px ui-monospace,monospace'
const SECTION_HEADER_H = 44
const CARD_PAD_X = 20
const CARD_PAD_Y = 16
const H_HEADER = 108, H_BANNER = 72, H_KPI = 170, H_SIGMA = 84, H_CHARTS = 360
const H_CC = 560, H_RC_QQ = 340, H_BOXPLOT = 340, H_FOOTER = 80, VGAP = 20
const WRAP_W = W - PAD * 2 - CARD_PAD_X * 2 - 10

const cpkBgOf = (P: ExportPalette, v: number | null) => (v === null ? 'transparent' : v >= 1.33 ? P.greenBg : v >= 1.0 ? P.yellowBg : P.redBg)
const cpkBdOf = (P: ExportPalette, v: number | null) => (v === null ? P.border : v >= 1.33 ? P.greenBorder : v >= 1.0 ? P.yellowBorder : P.redBorder)

/** Alto de la sección de interpretación: mismas reglas de ajuste de línea que al dibujar. */
function interpretationHeight(c: CanvasRenderingContext2D, lines: string[]): number {
  c.font = '400 20px system-ui,sans-serif'
  let count = 0
  lines.forEach((line) => {
    let row = ''
    line.split(' ').forEach((word) => {
      const test = row + (row ? ' ' : '') + word
      if (c.measureText(test).width > WRAP_W && row) { row = word; count++ } else row = test
    })
    count += 2
  })
  return Math.max(120, count * 28 + SECTION_HEADER_H + CARD_PAD_Y * 2 + 20)
}

/** Dibuja el reporte y devuelve el DataURL (el original lo usa también para el ZIP). */
export function drawExecutivePng(r: AnalysisResult, ccType: CCTypeChoice, env: ExportEnv): string {
  const { isDark, lang, t } = env
  const P = exportPalette(isDark)
  const mCanvas = document.createElement('canvas').getContext('2d')
  if (!mCanvas) throw new Error('Canvas 2D no disponible')

  const capRows: Row[] = [
    { label: 'Cp', val: fmt(r.Cp), color: cpkColorOf(P, r.Cp) },
    { label: 'Cpk', val: fmt(r.Cpk), color: cpkColorOf(P, r.Cpk) },
    { label: 'Cpu', val: fmt(r.Cpu), color: cpkColorOf(P, r.Cpu) },
    { label: 'Cpl', val: fmt(r.Cpl), color: cpkColorOf(P, r.Cpl) },
    { label: 'Cpm (Taguchi)', val: fmt(r.Cpm), color: P.accent2 },
    { label: 'Cmk (Machine)', val: fmt(r.Cmk), color: cpkColorOf(P, r.Cmk) },
  ]
  const perfRows: Row[] = [
    { label: 'Pp', val: fmt(r.Pp), color: cpkColorOf(P, r.Pp) },
    { label: 'Ppk', val: fmt(r.Ppk), color: cpkColorOf(P, r.Ppk) },
    { label: 'Ppu', val: fmt(r.Ppu), color: cpkColorOf(P, r.Ppu) },
    { label: 'Ppl', val: fmt(r.Ppl), color: cpkColorOf(P, r.Ppl) },
  ]
  const statsRows: Row[] = [
    { label: t('png.n'), val: String(r.N) },
    { label: t('png.mean'), val: fmt(r.xBar, 4) },
    { label: t('png.median'), val: fmt(r.med, 4) },
    { label: t('png.stdOverall'), val: fmt(r.sOverall, 5) },
    { label: t('png.stdWithin'), val: fmt(r.sWithin, 5) },
    { label: t('png.min'), val: fmt(r.minV, 4) },
    { label: t('png.max'), val: fmt(r.maxV, 4) },
    { label: t('png.range'), val: fmt(r.range, 4) },
    { label: t('png.lsl'), val: r.hasLSL ? fmt(r.lsl, 3) : '—' },
    { label: t('png.usl'), val: r.hasUSL ? fmt(r.usl, 3) : '—' },
  ]
  if (!isNaN(r.targetVal)) statsRows.push({ label: t('png.target'), val: fmt(r.targetVal, 3) })

  const interpPlain = buildInterpretationPlain(r, lang === 'es')
  const pngN = r.subgroupSize || 1
  const pngCCType = ccType === 'auto' ? autoCCType(pngN) : ccType
  const cc = buildControlChartExport(r, pngN, pngCCType, lang)

  const H_INTERP = interpretationHeight(mCanvas, interpPlain)
  const H_TBL_CAP = SECTION_HEADER_H + capRows.length * ROW_H + 14 + 32 + perfRows.length * ROW_H + CARD_PAD_Y * 2 + 60
  const H_TBL_STAT = SECTION_HEADER_H + statsRows.length * ROW_H + CARD_PAD_Y * 2 + 60
  const H_TABLES = Math.max(H_TBL_CAP, H_TBL_STAT)
  const H = H_HEADER + H_BANNER + VGAP + H_KPI + VGAP + H_SIGMA + VGAP + H_CHARTS + VGAP + H_TABLES + VGAP +
    H_INTERP + VGAP + H_CC + VGAP + H_RC_QQ + VGAP + H_BOXPLOT + VGAP + H_FOOTER + 20

  const { cv, c } = newCanvas(W, H)

  c.fillStyle = P.bg
  c.fillRect(0, 0, W, H)
  const m1 = c.createRadialGradient(180, 180, 0, 180, 180, 700)
  m1.addColorStop(0, isDark ? 'rgba(0,80,180,0.16)' : 'rgba(100,160,255,0.10)')
  m1.addColorStop(1, 'transparent')
  c.fillStyle = m1; c.fillRect(0, 0, W, H)
  const m2 = c.createRadialGradient(W, H * 0.7, 0, W, H * 0.7, 800)
  m2.addColorStop(0, isDark ? 'rgba(0,160,140,0.08)' : 'rgba(60,120,200,0.06)')
  m2.addColorStop(1, 'transparent')
  c.fillStyle = m2; c.fillRect(0, 0, W, H)

  // Ruido de grano: aleatorio también en el original (la imagen no es repetible píxel a píxel).
  c.save(); c.globalAlpha = isDark ? 0.022 : 0.012
  for (let i = 0; i < 5000; i++) {
    const v = 100 + Math.random() * 155 | 0
    c.fillStyle = `rgb(${v},${v},${v + 20})`
    c.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1)
  }
  c.restore()

  const rRect = (x: number, y: number, w: number, h: number, r2: number | number[], fill: string | CanvasGradient | null, stroke: string | null, sw = 1.5) => {
    c.beginPath(); c.roundRect(x, y, w, h, r2)
    if (fill) { c.fillStyle = fill; c.fill() }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke() }
  }
  const hline = (x1: number, x2: number, y: number, color: string, w = 1) => {
    c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y)
    c.strokeStyle = color; c.lineWidth = w; c.stroke()
  }
  const label = (str: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') => {
    c.font = font; c.fillStyle = color; c.textAlign = align
    c.fillText(str, x, y)
  }
  const sectionHeader = (title: string, x: number, y: number, w: number) => {
    rRect(x, y, 3, 22, 1.5, P.accent, null)
    label(title, x + 12, y + 17, FONT_TITLE, P.textDim, 'left')
    hline(x + 12 + c.measureText(title).width + 12, x + w, y + 8, P.borderLight, 1.5)
  }
  const drawTable = (rows: Row[], x: number, y: number, w: number): number => {
    rows.forEach((row, i) => {
      const ry = y + i * ROW_H
      if (i % 2 === 1) rRect(x, ry, w, ROW_H, 0, P.rowAlt, null)
      label(row.label, x + CARD_PAD_X, ry + ROW_H * 0.68, FONT_LABEL, P.textSub, 'left')
      label(row.val, x + w - CARD_PAD_X, ry + ROW_H * 0.68, FONT_VALUE, row.color || P.accent, 'right')
    })
    return y + rows.length * ROW_H
  }

  let Y = 0

  // HEADER
  rRect(0, 0, W, H_HEADER, 0, P.headerBg, null)
  hline(0, W, H_HEADER, P.border, 1.5)
  const lmGrad = c.createLinearGradient(PAD, 18, PAD + 56, 74)
  lmGrad.addColorStop(0, P.accent); lmGrad.addColorStop(1, P.accent2)
  rRect(PAD, 18, 56, 56, 13, lmGrad, null)
  label('C', PAD + 28, 62, '800 33px system-ui,sans-serif', '#050d2a', 'center')
  label('CapaFlow', PAD + 68, 58, '800 36px system-ui,sans-serif', P.text, 'left')
  label(t('png.subtitle'), PAD + 68, 82, '400 19px ui-monospace,monospace', P.textSub, 'left')
  const dateStr = localDate(lang)
  label(t('png.generatedBy'), W - PAD, 46, '400 17px ui-monospace,monospace', P.textDim, 'right')
  label(dateStr, W - PAD, 72, '600 19px ui-monospace,monospace', P.textSub, 'right')
  Y = H_HEADER

  // TITLE BANNER
  rRect(PAD, Y + 12, W - PAD * 2, H_BANNER - 12, 12, P.headerBg, P.border, 1.5)
  label(t('png.title'), W / 2, Y + 12 + (H_BANNER - 12) / 2 + 10, '800 30px system-ui,sans-serif', P.accent, 'center')
  Y += H_BANNER + VGAP

  // 3 KPI CARDS
  const kpiDefs = [
    { label: 'Cpk', val: fmt(r.Cpk), verdict: r.Cpk !== null ? classifyCpk(r.Cpk, lang).label : '—', v: r.Cpk },
    { label: 'Cp', val: fmt(r.Cp), verdict: r.Cp !== null ? classifyCpk(r.Cp, lang).label : t('classify.potential'), v: r.Cp },
    { label: 'Ppk', val: fmt(r.Ppk), verdict: r.Ppk !== null ? classifyCpk(r.Ppk, lang).label : '—', v: r.Ppk },
  ]
  kpiDefs.forEach((k, i) => {
    const kx = PAD + i * (COL3 + GAP)
    const ky = Y
    const kc = cpkColorOf(P, k.v), kbg = cpkBgOf(P, k.v), kbd = cpkBdOf(P, k.v)
    rRect(kx, ky, COL3, H_KPI, 16, P.surface, kbd, 2.5)
    rRect(kx + 2, ky + 2, COL3 - 4, 4, [2, 2, 0, 0], kc, null)
    label(k.label, kx + COL3 / 2, ky + 44, FONT_TITLE, P.textSub, 'center')
    label(k.val, kx + COL3 / 2, ky + 112, FONT_KPI, kc, 'center')
    c.font = FONT_BADGE; c.textAlign = 'center'
    const bw = c.measureText(k.verdict).width + 36
    const bx = kx + COL3 / 2 - bw / 2
    const by = ky + 126
    rRect(bx, by, bw, 30, 15, kbg, kbd, 1.5)
    label(k.verdict, kx + COL3 / 2, by + 21, FONT_BADGE, kc, 'center')
  })
  Y += H_KPI + VGAP

  // SIGMA BAR + PPM
  rRect(PAD, Y, W - PAD * 2, H_SIGMA, 12, P.surface, P.border, 1.5)
  const sigmaBarInnerY = Y + 14
  const sigmaLabelX = PAD + CARD_PAD_X
  label(t('png.sigmaLevel'), sigmaLabelX, sigmaBarInnerY + 20, FONT_HEAD, P.textSub, 'left')
  c.font = FONT_HEAD; c.textAlign = 'left'
  const sigLabelW = c.measureText(t('png.sigmaLevel')).width + 10
  const sigVal = r.sigLvl !== null ? fmt(r.sigLvl, 2) + 'σ' : '—'
  label(sigVal, sigmaLabelX + sigLabelW + 2, sigmaBarInnerY + 20, '700 21px ui-monospace,monospace', cpkColorOf(P, r.Cpk), 'left')
  const ppmRX = W - PAD - CARD_PAD_X
  label(t('png.ppmCpk') + ':  ' + fmtN(r.ppm), ppmRX, sigmaBarInnerY + 18, '500 17px ui-monospace,monospace', P.textSub, 'right')
  label(t('png.ppmPpk') + ':  ' + fmtN(r.ppmOverall), ppmRX, sigmaBarInnerY + 40, '500 17px ui-monospace,monospace', P.textSub, 'right')
  c.font = '400 15px ui-monospace,monospace'; c.textAlign = 'center'; c.fillStyle = P.textDim
  const ppmLabelW = c.measureText(t('png.ppmCpk') + ':  ' + fmtN(r.ppm)).width + 30
  const barXS = sigmaLabelX + sigLabelW + 80
  const barXE = ppmRX - ppmLabelW - 20
  const barTW = barXE - barXS
  const barTY = sigmaBarInnerY + 32
  rRect(barXS, barTY, barTW, 10, 5, isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', null)
  const pct = r.sigLvl !== null ? Math.min(1, r.sigLvl / 6) : 0
  if (pct > 0) {
    const bg = c.createLinearGradient(barXS, 0, barXE, 0)
    bg.addColorStop(0, P.red); bg.addColorStop(0.5, P.yellow); bg.addColorStop(1, P.green)
    rRect(barXS, barTY, barTW * pct, 10, 5, bg, null)
  }
  ;['1σ', '2σ', '3σ', '4σ', '5σ', '6σ'].forEach((lbl, i) => {
    label(lbl, barXS + (i + 1) / 6 * barTW, barTY + 26, '400 14px ui-monospace,monospace', P.textDim, 'center')
  })
  Y += H_SIGMA + VGAP

  // GAUGE | HISTOGRAM
  const chartY = Y
  rRect(PAD, chartY, COL2, H_CHARTS, 14, P.surface, P.border, 1.5)
  sectionHeader(t('png.gauge'), PAD + CARD_PAD_X, chartY + CARD_PAD_Y, COL2 - CARD_PAD_X * 2)
  pngGauge(c, PAD, chartY, COL2, H_CHARTS, r.Cpk, cpkColorOf(P, r.Cpk), P, env)
  const histX = PAD + COL2 + GAP
  rRect(histX, chartY, COL2, H_CHARTS, 14, P.surface, P.border, 1.5)
  sectionHeader(t('png.histogram'), histX + CARD_PAD_X, chartY + CARD_PAD_Y, COL2 - CARD_PAD_X * 2)
  pngHistogram(c, histX, chartY, COL2, H_CHARTS, r, P, env)
  Y += H_CHARTS + VGAP

  // CAPABILITY | STATS
  const tableY = Y
  rRect(PAD, tableY, COL2, H_TABLES, 14, P.surface, P.border, 1.5)
  let tY = tableY + CARD_PAD_Y
  sectionHeader(t('png.capacity'), PAD + CARD_PAD_X, tY, COL2 - CARD_PAD_X * 2)
  tY += SECTION_HEADER_H + 4
  tY = drawTable(capRows, PAD, tY, COL2)
  hline(PAD + CARD_PAD_X, PAD + COL2 - CARD_PAD_X, tY + 8, P.borderLight, 1)
  tY += 16
  sectionHeader(t('png.performance'), PAD + CARD_PAD_X, tY, COL2 - CARD_PAD_X * 2)
  tY += SECTION_HEADER_H + 4
  drawTable(perfRows, PAD, tY, COL2)

  rRect(PAD + COL2 + GAP, tableY, COL2, H_TABLES, 14, P.surface, P.border, 1.5)
  let sY = tableY + CARD_PAD_Y
  sectionHeader(t('png.stats'), PAD + COL2 + GAP + CARD_PAD_X, sY, COL2 - CARD_PAD_X * 2)
  sY += SECTION_HEADER_H + 4
  sY = drawTable(statsRows.map((row) => ({ ...row, color: P.accent })), PAD + COL2 + GAP, sY, COL2)

  const normOk = r.adTest.p >= 0.05
  const npColor = normOk ? P.green : P.yellow
  const npBg = normOk ? P.greenBg : P.yellowBg
  const npBd = normOk ? P.greenBorder : P.yellowBorder
  const npText = t('png.adTest') + ' p=' + fmt(r.adTest.p, 4) + '  ·  ' + (normOk ? t('png.normal') : t('png.notNormal'))
  sY += 14
  rRect(PAD + COL2 + GAP + CARD_PAD_X, sY, COL2 - CARD_PAD_X * 2, 36, 18, npBg, npBd, 1.5)
  c.beginPath(); c.arc(PAD + COL2 + GAP + CARD_PAD_X + 22, sY + 18, 6, 0, Math.PI * 2)
  c.fillStyle = npColor; c.fill()
  label(npText, PAD + COL2 + GAP + CARD_PAD_X + 36, sY + 24, '500 16px ui-monospace,monospace', npColor, 'left')
  Y += H_TABLES + VGAP

  // INTERPRETATION
  rRect(PAD, Y, W - PAD * 2, H_INTERP, 14, P.surface, P.border, 1.5)
  rRect(PAD, Y, 4, H_INTERP, [2, 0, 0, 2], P.accent, null)
  let iY = Y + CARD_PAD_Y
  sectionHeader(t('png.interpretation'), PAD + CARD_PAD_X + 4, iY, W - PAD * 2 - CARD_PAD_X * 2)
  iY += SECTION_HEADER_H + 4
  c.font = '400 20px system-ui,sans-serif'; c.fillStyle = P.textSub; c.textAlign = 'left'
  interpPlain.forEach((line) => {
    let row = ''
    line.split(' ').forEach((word) => {
      const test = row + (row ? ' ' : '') + word
      if (c.measureText(test).width > WRAP_W && row) {
        c.fillText(row, PAD + CARD_PAD_X + 12, iY)
        row = word; iY += 27
      } else row = test
    })
    if (row) { c.fillText(row, PAD + CARD_PAD_X + 12, iY); iY += 27 }
    iY += 8
  })
  Y += H_INTERP + VGAP

  // CONTROL CHARTS
  const H_CC_CARD = (H_CC - SECTION_HEADER_H - CARD_PAD_Y * 2 - GAP) / 2
  const ccW = W - PAD * 2 - CARD_PAD_X * 2
  rRect(PAD, Y, W - PAD * 2, H_CC, 14, P.surface, P.border, 1.5)
  rRect(PAD, Y, 4, H_CC, [2, 0, 0, 2], P.accent2, null)
  let ccY = Y + CARD_PAD_Y
  sectionHeader(t('cc.title'), PAD + CARD_PAD_X + 4, ccY, W - PAD * 2 - CARD_PAD_X * 2)
  ccY += SECTION_HEADER_H + 8
  rRect(PAD + CARD_PAD_X, ccY, ccW, H_CC_CARD, 10, P.bg, P.borderLight, 1)
  pngCCChart(c, PAD + CARD_PAD_X, ccY, ccW, H_CC_CARD,
    { pts: cc.topPts, cl: cc.topCL, ucl: cc.topUCL, lcl: cc.topLCL, sigma: cc.topSigma, violIdx: cc.topViol, chartLabel: cc.topLabel, oocCount: cc.topOOC, isTop: true }, P, env)
  ccY += H_CC_CARD + GAP
  rRect(PAD + CARD_PAD_X, ccY, ccW, H_CC_CARD, 10, P.bg, P.borderLight, 1)
  pngCCChart(c, PAD + CARD_PAD_X, ccY, ccW, H_CC_CARD,
    { pts: cc.botPts, cl: cc.botCL, ucl: cc.botUCL, lcl: cc.botLCL, sigma: cc.botSigma, violIdx: cc.botViol, chartLabel: cc.botLabel, oocCount: cc.botOOC, isTop: false }, P, env)
  Y += H_CC + VGAP

  // RUN CHART | Q-Q
  rRect(PAD, Y, COL2, H_RC_QQ, 14, P.surface, P.border, 1.5)
  rRect(PAD, Y, 4, H_RC_QQ, [2, 0, 0, 2], '#a78bfa', null)
  sectionHeader(t('png.runChart'), PAD + CARD_PAD_X + 4, Y + CARD_PAD_Y, COL2 - CARD_PAD_X * 2)
  pngRunChart(c, PAD, Y, COL2, H_RC_QQ, r, P, env)
  const qqX2 = PAD + COL2 + GAP
  rRect(qqX2, Y, COL2, H_RC_QQ, 14, P.surface, P.border, 1.5)
  rRect(qqX2, Y, 4, H_RC_QQ, [2, 0, 0, 2], '#fb923c', null)
  sectionHeader(t('png.qqPlot'), qqX2 + CARD_PAD_X + 4, Y + CARD_PAD_Y, COL2 - CARD_PAD_X * 2)
  pngQQPlot(c, qqX2, Y, COL2, H_RC_QQ, r, P, env)
  Y += H_RC_QQ + VGAP

  // BOX PLOT
  rRect(PAD, Y, W - PAD * 2, H_BOXPLOT, 14, P.surface, P.border, 1.5)
  rRect(PAD, Y, 4, H_BOXPLOT, [2, 0, 0, 2], '#8b5cf6', null)
  sectionHeader(t('png.boxPlot'), PAD + CARD_PAD_X + 4, Y + CARD_PAD_Y, W - PAD * 2 - CARD_PAD_X * 2)
  pngBoxPlot(c, PAD, Y, W - PAD * 2, H_BOXPLOT, r, P, env)
  Y += H_BOXPLOT + VGAP

  // FOOTER
  hline(PAD, W - PAD, Y + 16, P.borderLight, 1)
  label('CapaFlow', PAD, Y + 48, '700 18px ui-monospace,monospace', P.textDim, 'left')
  label(t('png.footNote'), W / 2, Y + 48, '400 16px ui-monospace,monospace', P.textDim, 'center')
  label(dateStr, W - PAD, Y + 48, '400 16px ui-monospace,monospace', P.textDim, 'right')

  return cv.toDataURL('image/png', 1.0)
}

/** Descarga del botón "Resumen Ejecutivo PNG": CapaFlow_Resumen|Report_AAAA-MM-DD.png */
export function downloadExecutivePng(r: AnalysisResult, ccType: CCTypeChoice, env: ExportEnv): void {
  const dataURL = drawExecutivePng(r, ccType, env)
  triggerDownload(dataURL, `CapaFlow_${env.lang === 'es' ? 'Resumen' : 'Report'}_${stamp()}.png`)
}

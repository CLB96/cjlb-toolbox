// Piezas del resumen comparativo: foto con marcadores y tabla (_summaryDrawPhoto, _summaryDrawTable).
import type { CapaPoint, PhotoMarker } from '../store'
import { fmt, type ExportEnv, type ExportPalette } from './exportEnv'

type C = CanvasRenderingContext2D
export type CpkColorFn = (v: number | null) => string

export function summaryDrawPhoto(
  c: C, x: number, y: number, w: number, h: number, photoImg: HTMLImageElement | null, P: ExportPalette,
  order: CapaPoint[], markers: Record<number, PhotoMarker>, cpkColor: CpkColorFn, env: ExportEnv,
): void {
  const { t } = env
  c.beginPath(); c.roundRect(x, y, w, h, 10)
  c.fillStyle = P.surface; c.fill()
  c.strokeStyle = P.border; c.lineWidth = 1.5; c.stroke()

  c.fillStyle = P.accent
  c.beginPath(); c.roundRect(x, y, 3, h, [2, 0, 0, 2]); c.fill()

  c.font = '600 12px Inter, sans-serif'
  c.fillStyle = P.textDim; c.textAlign = 'left'
  c.fillText(t('summary.photoTitle'), x + 10, y + 19)

  const INNER_Y = y + 26
  const INNER_H = h - 28

  if (!photoImg) {
    c.save()
    c.beginPath(); c.roundRect(x + 8, INNER_Y + 4, w - 16, INNER_H - 8, 8)
    c.strokeStyle = P.borderLight; c.setLineDash([8, 6]); c.lineWidth = 1.5; c.stroke()
    c.setLineDash([]); c.restore()

    c.font = '400 15px Inter, sans-serif'
    c.fillStyle = P.textDim; c.textAlign = 'center'
    c.fillText(t('summary.noPhoto'), x + w / 2, y + h / 2 - 8)
    c.font = '400 12px Inter, sans-serif'
    c.fillText(t('summary.noPhotoSub'), x + w / 2, y + h / 2 + 14)
    return
  }

  const imgAR = photoImg.naturalWidth / photoImg.naturalHeight
  const cellAR = (w - 16) / (INNER_H - 8)
  let iw: number, ih: number, ix: number, iy: number
  if (imgAR > cellAR) {
    iw = w - 16; ih = iw / imgAR
    ix = x + 8; iy = INNER_Y + 4 + (INNER_H - 8 - ih) / 2
  } else {
    ih = INNER_H - 8; iw = ih * imgAR
    ix = x + (w - iw) / 2; iy = INNER_Y + 4
  }

  c.save()
  c.beginPath(); c.roundRect(x + 4, INNER_Y + 2, w - 8, INNER_H - 4, 6); c.clip()
  c.drawImage(photoImg, ix, iy, iw, ih)
  c.restore()

  const mR = Math.max(13, Math.min(20, Math.round(iw / 28)))
  order.forEach((p, i) => {
    const m = markers[p.id]
    if (!m) return
    const mx = ix + (m.x / 100) * iw
    const my = iy + (m.y / 100) * ih
    const col = cpkColor(p.result.Cpk)

    c.save()
    c.shadowColor = 'rgba(0,0,0,0.75)'; c.shadowBlur = 8
    c.beginPath(); c.arc(mx, my, mR, 0, Math.PI * 2)
    c.fillStyle = col; c.fill()
    c.shadowBlur = 0
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke()
    c.restore()

    const fs = Math.max(9, mR - 3)
    c.font = `700 ${fs}px "Space Grotesk", Inter, sans-serif`
    c.fillStyle = '#fff'; c.textAlign = 'center'
    c.fillText(String(i + 1), mx, my + fs * 0.37)
  })
}

interface Col { label: string; w: number; align: CanvasTextAlign }

export function summaryDrawTable(c: C, x: number, y: number, w: number, h: number, order: CapaPoint[], P: ExportPalette, cpkColor: CpkColorFn, env: ExportEnv): void {
  const { t, lang } = env
  c.beginPath(); c.roundRect(x, y, w, h, 10)
  c.fillStyle = P.surface; c.fill()
  c.strokeStyle = P.border; c.lineWidth = 1.5; c.stroke()

  c.fillStyle = P.accent2
  c.beginPath(); c.roundRect(x, y, 3, h, [2, 0, 0, 2]); c.fill()

  const COLS: Col[] = [
    { label: '#', w: 32, align: 'center' },
    { label: t('summary.colPoint'), w: 170, align: 'left' },
    { label: 'N', w: 38, align: 'center' },
    { label: t('summary.colMean'), w: 80, align: 'right' },
    { label: 'σ Wit', w: 80, align: 'right' },
    { label: 'σ Ovr', w: 80, align: 'right' },
    { label: 'Cp', w: 60, align: 'center' },
    { label: 'Cpk', w: 72, align: 'center' },
    { label: 'Pp', w: 60, align: 'center' },
    { label: 'Ppk', w: 72, align: 'center' },
    { label: 'σ Lvl', w: 60, align: 'center' },
  ]
  const textX = (col: Col, cx: number) => (col.align === 'right' ? cx + col.w - 2 : col.align === 'center' ? cx + col.w / 2 : cx + 2)

  const PAD_X = 8
  const LBL_H = 22
  const HDR_H = 32
  const TABLE_START = y + LBL_H + 4
  const AVAIL_H = h - LBL_H - 4
  const MAX_ROW_H = 30, MIN_ROW_H = 16
  const ROW_H = Math.max(MIN_ROW_H, Math.min(MAX_ROW_H, Math.floor((AVAIL_H - HDR_H) / order.length)))
  const maxRows = Math.floor((AVAIL_H - HDR_H) / ROW_H)
  const visibleOrder = order.slice(0, maxRows)
  const clipped = order.length - visibleOrder.length

  c.font = '600 12px Inter, sans-serif'
  c.fillStyle = P.textDim; c.textAlign = 'left'
  c.fillText(t('summary.tableTitle'), x + 10, y + 16)

  c.save()
  c.beginPath(); c.roundRect(x + 2, TABLE_START, w - 4, h - LBL_H - 6, 8); c.clip()

  c.fillStyle = P.headerBg; c.fillRect(x, TABLE_START, w, HDR_H)

  c.font = '700 11px "Space Grotesk", Inter, sans-serif'; c.fillStyle = P.accent
  let colX = x + PAD_X
  COLS.forEach((col) => {
    c.textAlign = col.align
    c.fillText(col.label, textX(col, colX), TABLE_START + 22)
    colX += col.w
  })

  c.beginPath(); c.moveTo(x, TABLE_START + HDR_H); c.lineTo(x + w, TABLE_START + HDR_H)
  c.strokeStyle = P.border; c.lineWidth = 1; c.stroke()

  const FONT_ROW = `${ROW_H > 22 ? '500' : '400'} ${Math.min(11, ROW_H - 6)}px Inter, sans-serif`
  visibleOrder.forEach((p, i) => {
    const r = p.result
    const ry = TABLE_START + HDR_H + i * ROW_H
    if (i % 2 === 1) { c.fillStyle = P.rowAlt; c.fillRect(x, ry, w, ROW_H) }

    const cells = [
      { val: String(i + 1), col: P.textDim },
      { val: (r.pointName || (lang === 'es' ? `Punto ${i + 1}` : `Point ${i + 1}`)).slice(0, 24), col: P.text },
      { val: String(r.N), col: P.textSub },
      { val: fmt(r.xBar, 4), col: P.textSub },
      { val: fmt(r.sWithin, 4), col: P.textSub },
      { val: fmt(r.sOverall, 4), col: P.textSub },
      { val: fmt(r.Cp), col: cpkColor(r.Cp) },
      { val: fmt(r.Cpk), col: cpkColor(r.Cpk) },
      { val: fmt(r.Pp), col: cpkColor(r.Pp) },
      { val: fmt(r.Ppk), col: cpkColor(r.Ppk) },
      { val: r.sigLvl !== null ? fmt(r.sigLvl, 2) + 'σ' : '—', col: cpkColor(r.Cpk) },
    ]

    const textY = ry + ROW_H * 0.68
    c.font = FONT_ROW
    let cx = x + PAD_X
    cells.forEach((cell, ci) => {
      const col = COLS[ci]!
      c.fillStyle = cell.col
      c.textAlign = col.align
      c.fillText(cell.val, textX(col, cx), textY)
      cx += col.w
    })
  })

  if (clipped > 0) {
    const clipY = TABLE_START + HDR_H + visibleOrder.length * ROW_H + 4
    c.font = '400 11px Inter, sans-serif'
    c.fillStyle = P.textDim; c.textAlign = 'left'
    const moreLabel = lang === 'es'
      ? `… y ${clipped} punto${clipped > 1 ? 's' : ''} más`
      : `… and ${clipped} more point${clipped > 1 ? 's' : ''}`
    c.fillText(moreLabel, x + PAD_X, clipY + 12)
  }

  c.restore()
}

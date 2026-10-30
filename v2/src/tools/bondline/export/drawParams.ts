import { PANEL_PAD, PARAM_COL_W, type BondlineExportModel, type ExportMarker } from './exportModel'

type Ctx = CanvasRenderingContext2D

export const C = {
  fg: '#efe9ff',
  muted: '#b3a6d9',
  subtle: '#9a8fc0',
  glass: 'rgba(255,255,255,.07)',
  edge: 'rgba(255,255,255,.16)',
  accent: '#e2b4ff',
  warn: '#ffd78f',
}
export const FONT_NUM = '"Space Grotesk", Inter, sans-serif'
export const FONT_TEXT = 'Inter, sans-serif'

export const PANEL = { x: 60, y: 200, h: 95 }

export function glass(ctx: Ctx, x: number, y: number, w: number, h: number, r = 14): void {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fillStyle = C.glass
  ctx.fill()
  ctx.strokeStyle = C.edge
  ctx.lineWidth = 1
  ctx.stroke()
}

/** Panel "Parámetros del proceso": columnas y divisores del modelo. */
export function drawParamsPanel(ctx: Ctx, model: BondlineExportModel): void {
  const { x, y, h } = PANEL
  glass(ctx, x, y, model.panelWidth, h)
  const top = y + PANEL_PAD
  const icon = ctx.createLinearGradient(x + PANEL_PAD, top, x + PANEL_PAD + 28, top + 28)
  icon.addColorStop(0, 'rgba(209,107,255,.35)')
  icon.addColorStop(1, 'rgba(106,123,255,.30)')
  ctx.beginPath()
  ctx.roundRect(x + PANEL_PAD, top, 28, 28, 8)
  ctx.fillStyle = icon
  ctx.fill()
  ctx.fillStyle = C.fg
  ctx.font = `14px ${FONT_TEXT}`
  ctx.fillText('⚙️', x + PANEL_PAD + 7, top + 20)
  ctx.fillStyle = C.accent
  ctx.font = `800 12px ${FONT_TEXT}`
  ctx.fillText(model.paramsTitle.toUpperCase(), x + PANEL_PAD + 38, top + 19)

  const py = top + 38
  const colX = (slot: number) => x + PANEL_PAD + slot * PARAM_COL_W
  ctx.strokeStyle = 'rgba(255,255,255,.12)'
  ctx.lineWidth = 1
  for (const slot of model.dividers) {
    ctx.beginPath()
    ctx.moveTo(colX(slot) - 10, py - 8)
    ctx.lineTo(colX(slot) - 10, py + 40)
    ctx.stroke()
  }
  for (const col of model.columns) {
    const cx = colX(col.slot)
    ctx.fillStyle = C.muted
    ctx.font = `bold 10px ${FONT_TEXT}`
    ctx.fillText(col.title, cx, py)
    for (const row of col.rows) {
      ctx.fillStyle = C.subtle
      ctx.font = `9px ${FONT_TEXT}`
      ctx.fillText(row.label, cx + row.labelDx, py + row.dy)
      ctx.fillStyle = row.warn ? C.warn : C.fg
      ctx.font = `bold 15px ${FONT_NUM}`
      ctx.fillText(row.value, cx + row.valueDx, py + row.dy)
    }
  }
}

export interface LayoutGeom {
  w: number
  h: number
  frameW: number
  frameH: number
  frameX: number
  frameY: number
  imgX: number
  imgY: number
}

/** Geometría de la caja del layout (inventario 7.8): imagen máx. 750x250, marco 105 %, base = base del panel. */
export function layoutGeometry(naturalW: number, naturalH: number): LayoutGeom {
  const maxW = 750
  const maxH = 250
  const aspect = naturalW / naturalH
  const [w, h] = aspect > maxW / maxH ? [maxW, maxW / aspect] : [maxH * aspect, maxH]
  const frameW = w * 1.05
  const frameH = h * 1.05
  const frameX = 1120
  const frameY = PANEL.y + PANEL.h - frameH
  return { w, h, frameW, frameH, frameX, frameY, imgX: frameX + (frameW - w) / 2, imgY: frameY + (frameH - h) / 2 }
}

function drawMarker(ctx: Ctx, m: ExportMarker, g: LayoutGeom): void {
  const mx = g.imgX + (m.x / 100) * g.w
  const my = g.imgY + (m.y / 100) * g.h
  ctx.shadowColor = 'rgba(0,0,0,.4)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 3
  ctx.fillStyle = m.color
  ctx.beginPath()
  ctx.arc(mx, my, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.7)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.fillStyle = '#fff'
  ctx.font = `bold 9px ${FONT_TEXT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(m.label, mx, my)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

/** Caja del layout con la imagen y los marcadores de TC visibles. */
export function drawLayoutBox(ctx: Ctx, image: HTMLImageElement, markers: ExportMarker[]): void {
  const g = layoutGeometry(image.naturalWidth, image.naturalHeight)
  glass(ctx, g.frameX, g.frameY, g.frameW, g.frameH, 12)
  const stroke = ctx.createLinearGradient(g.frameX, g.frameY, g.frameX + g.frameW, g.frameY + g.frameH)
  stroke.addColorStop(0, 'rgba(209,107,255,.8)')
  stroke.addColorStop(1, 'rgba(106,123,255,.8)')
  ctx.strokeStyle = stroke
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(g.frameX, g.frameY, g.frameW, g.frameH, 12)
  ctx.stroke()
  ctx.drawImage(image, g.imgX, g.imgY, g.w, g.h)
  markers.forEach((m) => drawMarker(ctx, m, g))
}

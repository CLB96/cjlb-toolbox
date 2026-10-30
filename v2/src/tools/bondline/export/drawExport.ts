import { C, FONT_NUM, FONT_TEXT, drawLayoutBox, drawParamsPanel, glass } from './drawParams'
import type { BondlineExportModel, ExportLegend } from './exportModel'

type Ctx = CanvasRenderingContext2D

/** Lienzo del PNG (inventario 7): 1920x1280, gráfica 1800x845 en (60,315). */
export const EXPORT_W = 1920
export const EXPORT_H = 1280
const CHART = { x: 60, y: 315, w: 1800, h: 845 }
const LEGEND_Y = 1180

function drawBackground(ctx: Ctx): void {
  const g = ctx.createRadialGradient(EXPORT_W * 0.8, 0, 0, EXPORT_W * 0.8, 0, Math.max(EXPORT_W, EXPORT_H))
  g.addColorStop(0, '#3b1a5e')
  g.addColorStop(0.55, '#160c2e')
  g.addColorStop(1, '#07061a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H)
}

function drawHeader(ctx: Ctx, model: BondlineExportModel): void {
  ctx.fillStyle = C.fg
  ctx.font = `700 42px ${FONT_NUM}`
  ctx.fillText(model.title, 60, 70)
  ctx.fillStyle = C.muted
  ctx.font = `500 14px ${FONT_TEXT}`
  ctx.fillText(model.dateLine, 60, 100)
  model.stats.forEach((s, i) => {
    const x = 60 + 190 * i
    glass(ctx, x, 120, 180, 64, 12)
    ctx.beginPath()
    ctx.roundRect(x + 10, 132, 26, 22, 7)
    ctx.fillStyle = s.color + '33'
    ctx.fill()
    ctx.fillStyle = s.color
    ctx.font = `700 12px ${FONT_TEXT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(s.icon, x + 23, 143.5)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = C.fg
    ctx.font = `700 26px ${FONT_NUM}`
    ctx.fillText(s.value, x + 44, 153)
    ctx.fillStyle = C.muted
    ctx.font = `500 11px ${FONT_TEXT}`
    ctx.fillText(s.label, x + 12, 174)
  })
}

function dashSample(ctx: Ctx, x: number, color: string): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.setLineDash([10, 5])
  ctx.beginPath()
  ctx.moveTo(x, LEGEND_Y + 2)
  ctx.lineTo(x + 28, LEGEND_Y + 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawLegend(ctx: Ctx, legend: ExportLegend): void {
  let x = CHART.x
  ctx.font = `14px ${FONT_TEXT}`
  for (const tc of legend.tcs) {
    ctx.fillStyle = tc.color
    ctx.fillRect(x, LEGEND_Y, 28, 4)
    ctx.fillStyle = C.muted
    ctx.fillText(tc.label, x + 35, LEGEND_Y + 5)
    x += 100
  }
  dashSample(ctx, x, legend.limitsColor)
  ctx.fillStyle = C.muted
  ctx.fillText(legend.limits, x + 35, LEGEND_Y + 5)
  x += 200
  ctx.strokeStyle = '#59c97f'
  ctx.lineWidth = 2
  ctx.strokeRect(x, LEGEND_Y - 6, 24, 16)
  ctx.fillStyle = 'rgba(89,201,127,.12)'
  ctx.fillRect(x, LEGEND_Y - 6, 24, 16)
  ctx.fillStyle = C.muted
  ctx.fillText(legend.window, x + 30, LEGEND_Y + 5)
  if (legend.cooling) {
    x += 200
    dashSample(ctx, x, '#a78bfa')
    ctx.fillStyle = C.muted
    ctx.fillText(legend.cooling, x + 35, LEGEND_Y + 5)
  }
}

/**
 * Composición Nebulosa aprobada por el dueño. `chartCanvas` se copia aquí con drawImage, así que
 * quien lo creó puede destruir su Chart después de esta llamada.
 */
export function drawExport(
  model: BondlineExportModel,
  chartCanvas: HTMLCanvasElement,
  layoutImage: HTMLImageElement | null,
  logo: HTMLImageElement | null,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_W
  canvas.height = EXPORT_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible')
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  drawBackground(ctx)
  drawHeader(ctx, model)
  drawParamsPanel(ctx, model)
  glass(ctx, 48, 303, 1824, 912, 16)
  ctx.drawImage(chartCanvas, CHART.x, CHART.y, CHART.w, CHART.h)
  drawLegend(ctx, model.legend)
  if (model.hasLayout && layoutImage && layoutImage.naturalHeight > 0) {
    drawLayoutBox(ctx, layoutImage, model.markers)
  }
  ctx.fillStyle = C.muted
  ctx.font = `500 12px ${FONT_TEXT}`
  ctx.fillText(model.footer, 60, EXPORT_H - 40)
  if (logo && logo.naturalHeight > 0) {
    const h = 34
    const w = (logo.naturalWidth / logo.naturalHeight) * h
    ctx.drawImage(logo, EXPORT_W - 60 - w, EXPORT_H - 40 - h + 8, w, h)
  }
  return canvas
}

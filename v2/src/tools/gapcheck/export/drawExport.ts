import type { ExportCard, ExportMarker, ExportModel } from './exportModel'

/**
 * Composición Nebulosa del PNG (mockup aprobado, R5). Se dibuja en coordenadas lógicas
 * escaladas x EXPORT_SCALE para que el PNG sea nítido. El contenido es el del export original
 * (inventario §9); las fórmulas de imagen y marcadores del layout se conservan literalmente.
 */
export const EXPORT_SCALE = 2
export const EXPORT_CHART_W = 1300
export const EXPORT_CHART_H = 560

const W = Math.max(EXPORT_CHART_W, 1200) + 80
const PAD = 50
const CARDS_Y = 135
const CARD_H = 92
const GAP = 12
const LAYOUT_BOX = { w: 540, h: 300, y: 104 }
const LOGO_H = 44

const C = {
  bg0: '#3b1a5e',
  bg1: '#160c2e',
  bg2: '#07061a',
  fg: '#efe9ff',
  muted: '#b3a6d9',
  glass: 'rgba(255,255,255,.07)',
  edge: 'rgba(255,255,255,.16)',
  accentLabel: '#e2b4ff',
}

const FONT_NUM = '"Space Grotesk", Inter, sans-serif'
const FONT_TEXT = 'Inter, sans-serif'

/** Pastillas de los chips: pares oscuros del export original (fondo, texto). */
const BADGE_COLORS: Record<ExportCard['badge'], readonly [string, string]> = {
  PTS: ['#1a2437', '#a9b6cd'],
  OK: ['#0c2d33', '#22d3ee'],
  AVG: ['#24183d', '#a78bfa'],
  MIN: ['#10281a', '#59c97f'],
  MAX: ['#322712', '#f8b84f'],
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

type Ctx = CanvasRenderingContext2D

function roundRectPath(ctx: Ctx, r: Rect, radius: number) {
  ctx.beginPath()
  ctx.roundRect(r.x, r.y, r.w, r.h, radius)
}

function drawBackground(ctx: Ctx, h: number) {
  const g = ctx.createRadialGradient(W * 0.8, 0, 0, W * 0.8, 0, Math.max(W, h))
  g.addColorStop(0, C.bg0)
  g.addColorStop(0.55, C.bg1)
  g.addColorStop(1, C.bg2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, h)
}

function drawGlass(ctx: Ctx, r: Rect, radius = 14) {
  roundRectPath(ctx, r, radius)
  ctx.fillStyle = C.glass
  ctx.fill()
  ctx.strokeStyle = C.edge
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawTitle(ctx: Ctx, model: ExportModel, logo: HTMLImageElement | null) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = C.fg
  ctx.font = `700 36px ${FONT_NUM}`
  ctx.fillText(model.title, PAD, 44)
  ctx.fillStyle = C.muted
  ctx.font = `500 16px ${FONT_TEXT}`
  ctx.fillText(model.dateLine, PAD, 94)
  if (logo && logo.naturalHeight > 0) {
    const lw = (logo.naturalWidth / logo.naturalHeight) * LOGO_H
    ctx.drawImage(logo, W - PAD - lw, 40, lw, LOGO_H)
  }
}

function drawCard(ctx: Ctx, card: ExportCard, r: Rect) {
  drawGlass(ctx, r)
  const [bg, fg] = BADGE_COLORS[card.badge]
  ctx.font = `800 10px ${FONT_TEXT}`
  const badgeW = ctx.measureText(card.badge).width + 12
  roundRectPath(ctx, { x: r.x + 16, y: r.y + 14, w: badgeW, h: 18 }, 6)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(card.badge, r.x + 16 + badgeW / 2, r.y + 23)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = C.fg
  ctx.font = `700 28px ${FONT_NUM}`
  ctx.fillText(card.value, r.x + 16, r.y + 64)
  ctx.fillStyle = C.muted
  ctx.font = `500 11px ${FONT_TEXT}`
  ctx.fillText(card.sub, r.x + 16, r.y + 82)
}

function drawTarget(ctx: Ctx, target: ExportModel['target'], r: Rect) {
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h)
  g.addColorStop(0, 'rgba(209,107,255,.30)')
  g.addColorStop(1, 'rgba(106,123,255,.24)')
  roundRectPath(ctx, r, 14)
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(209,107,255,.55)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = C.accentLabel
  ctx.font = `800 10px ${FONT_TEXT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(target.label, r.x + 16, r.y + 23)
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = C.fg
  ctx.font = `700 30px ${FONT_NUM}`
  ctx.fillText(target.value, r.x + 16, r.y + 64)
}

/** Orden del export original: PTS, OK, objetivo, AVG, MIN, MAX. */
type Slot = { kind: 'card'; card: ExportCard } | { kind: 'target' }

function slotsOf(model: ExportModel): Slot[] {
  const cards = model.cards.map((card): Slot => ({ kind: 'card', card }))
  return [...cards.slice(0, 2), { kind: 'target' }, ...cards.slice(2)]
}

/** Sin layout: una fila de 6. Con layout: 3×2 a la izquierda (como el original). */
function drawStats(ctx: Ctx, model: ExportModel) {
  const cols = model.hasLayout ? 3 : 6
  const cardW = model.hasLayout ? 200 : (W - 2 * PAD - (cols - 1) * GAP) / cols
  slotsOf(model).forEach((slot, i) => {
    const r: Rect = {
      x: PAD + (i % cols) * (cardW + GAP),
      y: CARDS_Y + Math.floor(i / cols) * (CARD_H + GAP),
      w: cardW,
      h: CARD_H,
    }
    if (slot.kind === 'target') drawTarget(ctx, model.target, r)
    else drawCard(ctx, slot.card, r)
  })
}

/** Marcador con las fórmulas literales de exportToPNG (baseScaleFactor 0.68…). */
function drawMarker(ctx: Ctx, m: ExportMarker, img: Rect, ratio: number, markerSize: number) {
  const mx = img.x + (m.x / 100) * img.w
  const my = img.y + (m.y / 100) * img.h
  const baseScaleFactor = 0.68
  const scaledMarkerSize = Math.max(12, markerSize * ratio * baseScaleFactor)
  const halfSize = scaledMarkerSize / 2
  const borderRadius = scaledMarkerSize / 4.4
  ctx.beginPath()
  ctx.roundRect(mx - halfSize, my - halfSize, scaledMarkerSize, scaledMarkerSize, borderRadius)
  ctx.fillStyle = m.color
  ctx.fill()
  ctx.lineWidth = Math.max(1.2, 2.5 * ratio * baseScaleFactor)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.stroke()
  ctx.fillStyle = '#fff'
  const fontSize = Math.max(7, markerSize * 0.27 * ratio * baseScaleFactor)
  ctx.font = `900 ${fontSize}px ${FONT_TEXT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 3
  ctx.shadowOffsetY = 1
  ctx.fillText(m.label, mx, my + 1)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

function drawLayout(ctx: Ctx, model: ExportModel, image: HTMLImageElement) {
  const box: Rect = { x: W - LAYOUT_BOX.w - PAD, y: LAYOUT_BOX.y, w: LAYOUT_BOX.w, h: LAYOUT_BOX.h }
  drawGlass(ctx, box, 12)
  const nw = image.naturalWidth
  const nh = image.naturalHeight
  const ratio = Math.min((box.w - 40) / nw, (box.h - 40) / nh)
  const img: Rect = { x: 0, y: 0, w: nw * ratio, h: nh * ratio }
  img.x = box.x + (box.w - img.w) / 2
  img.y = box.y + (box.h - img.h) / 2
  ctx.drawImage(image, img.x, img.y, img.w, img.h)
  model.markers.forEach((m) => drawMarker(ctx, m, img, ratio, model.markerSize))
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
}

/**
 * Dibuja el PNG. `chartCanvas` se espera ya renderizado a EXPORT_SCALE (backing store);
 * se pinta a su tamaño lógico.
 */
export function drawExport(
  model: ExportModel,
  chartCanvas: HTMLCanvasElement,
  layoutImage: HTMLImageElement | null,
  logo: HTMLImageElement | null = null,
): HTMLCanvasElement {
  const withLayout = model.hasLayout && layoutImage !== null && layoutImage.naturalWidth > 0
  const layoutModel = withLayout ? model : { ...model, hasLayout: false }
  const statsBottom = CARDS_Y + (withLayout ? 2 * CARD_H + GAP : CARD_H)
  const layoutBottom = withLayout ? LAYOUT_BOX.y + LAYOUT_BOX.h : 0
  const chartY = Math.max(statsBottom, layoutBottom) + 36
  const chartW = chartCanvas.width / EXPORT_SCALE
  const chartH = chartCanvas.height / EXPORT_SCALE
  const h = chartY + chartH + 40

  const out = document.createElement('canvas')
  out.width = W * EXPORT_SCALE
  out.height = h * EXPORT_SCALE
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible')
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE)

  drawBackground(ctx, h)
  drawTitle(ctx, model, logo)
  drawStats(ctx, layoutModel)
  if (withLayout && layoutImage) drawLayout(ctx, model, layoutImage)

  const chartX = (W - chartW) / 2
  drawGlass(ctx, { x: chartX - 12, y: chartY - 12, w: chartW + 24, h: chartH + 24 }, 16)
  ctx.drawImage(chartCanvas, chartX, chartY, chartW, chartH)
  return out
}

// Parte con canvas de «Editar imagen»: arma los píxeles que recibe el detector y dibuja las marcas encima.
import { adjustPixels, type Crop, type ImagePrep, type Stroke } from './prepImage'

const fullRegion = (w: number, h: number): Crop => ({ x: 0, y: 0, w, h })

function paintStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], color: string) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const s of strokes) {
    ctx.lineWidth = s.size
    ctx.beginPath()
    s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    if (s.points.length === 1) ctx.lineTo(s.points[0]!.x + 0.01, s.points[0]!.y)
    ctx.stroke()
  }
}

/** Píxeles para el detector. Sin recorte ni borrados es exactamente la imagen (o su copia reducida). */
export function buildDetectionInput(img: HTMLImageElement, width: number, height: number, scale: number, prep: ImagePrep): ImageData {
  const region = prep.crop ?? fullRegion(width, height)
  const w = scale === 1 ? region.w : Math.max(1, Math.round(region.w * scale))
  const h = scale === 1 ? region.h : Math.max(1, Math.round(region.h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d no disponible')
  if (prep.crop) {
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, w, h)
  } else if (scale === 1) {
    ctx.drawImage(img, 0, 0)
  } else {
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)
  }
  const out = ctx.getImageData(0, 0, w, h)
  adjustPixels(out.data, prep.brightness, prep.contrast)
  if (prep.strokes.length === 0) return out
  // Zona a ignorar: cualquier pixel tocado por el pincel queda con alfa 0 (el color no se toca)
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = w
  maskCanvas.height = h
  const mctx = maskCanvas.getContext('2d')
  if (!mctx) return out
  mctx.scale(w / region.w, h / region.h)
  mctx.translate(-region.x, -region.y)
  paintStrokes(mctx, prep.strokes, '#000')
  const painted = mctx.getImageData(0, 0, w, h).data
  for (let i = 3; i < painted.length; i += 4) if (painted[i]! > 8) out.data[i] = 0
  return out
}

export interface OverlayOptions {
  /** Muestra el marco y los agarres del recorte (herramienta Recortar activa). */
  handles: boolean
  /** Tamaño de los agarres en píxeles de la foto. */
  handleSize: number
}

/** Dibuja encima de la foto lo que el recorte y los borrados dejan fuera. No cambia la imagen. */
export function drawPrepOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, prep: ImagePrep, o: OverlayOptions) {
  ctx.save()
  paintStrokes(ctx, prep.strokes, 'rgba(226,75,74,0.5)')
  const c = prep.crop
  if (c) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, width, c.y)
    ctx.fillRect(0, c.y + c.h, width, height - c.y - c.h)
    ctx.fillRect(0, c.y, c.x, c.h)
    ctx.fillRect(c.x + c.w, c.y, width - c.x - c.w, c.h)
  }
  if (o.handles) {
    const r = c ?? fullRegion(width, height)
    const s = o.handleSize
    ctx.strokeStyle = '#378ADD'
    ctx.lineWidth = Math.max(1.5, s / 6)
    ctx.strokeRect(r.x + ctx.lineWidth / 2, r.y + ctx.lineWidth / 2, r.w - ctx.lineWidth, r.h - ctx.lineWidth)
    ctx.fillStyle = '#ffffff'
    const xs = [r.x, r.x + r.w / 2, r.x + r.w]
    const ys = [r.y, r.y + r.h / 2, r.y + r.h]
    for (const [i, x] of xs.entries()) {
      for (const [j, y] of ys.entries()) {
        if (i === 1 && j === 1) continue
        const hx = Math.min(Math.max(x - s / 2, 0), width - s)
        const hy = Math.min(Math.max(y - s / 2, 0), height - s)
        ctx.fillRect(hx, hy, s, s)
        ctx.strokeRect(hx, hy, s, s)
      }
    }
  }
  ctx.restore()
}

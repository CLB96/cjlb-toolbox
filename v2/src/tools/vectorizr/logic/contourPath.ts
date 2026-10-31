// Trazado de contornos. buildPath es copia literal de Digitalizacion/src/components/editor/EditorCanvas.tsx:20-39;
// el resto reutiliza la misma curva (Catmull-Rom, t = 0.35) para que las exportaciones sigan al canvas (M3).
import type { ContourPoint, ImagePoint } from '../types'

const TENSION = 0.35
/** Muestras por tramo Bezier al aplanar (DXF y PDF). */
export const BEZIER_STEPS = 16

/** Build an SVG path string supporting line and bezier segments (Catmull-Rom → cubic bezier). */
export function buildPath(pts: ContourPoint[], closed = true): string {
  if (pts.length < 2) return ''
  const n = pts.length
  let d = `M ${pts[0].x} ${pts[0].y}`
  const limit = closed ? n : n - 1
  for (let i = 0; i < limit; i++) {
    const curr = pts[i]
    const next = pts[(i + 1) % n]
    if (curr.type === 'bezier') {
      const prev = pts[(i - 1 + n) % n]
      const nn   = pts[(i + 2) % n]
      const t = 0.35
      d += ` C ${curr.x + (next.x - prev.x) * t} ${curr.y + (next.y - prev.y) * t} ${next.x - (nn.x - curr.x) * t} ${next.y - (nn.y - curr.y) * t} ${next.x} ${next.y}`
    } else {
      d += ` L ${next.x} ${next.y}`
    }
  }
  if (closed) d += ' Z'
  return d
}

export interface Segment {
  /** Índice del punto de inicio; el tramo va de pts[i] a pts[(i + 1) % n]. */
  index: number
  from: ImagePoint
  to: ImagePoint
  /** Puntos de control si el tramo es Bezier (misma fórmula que buildPath). */
  controls?: [ImagePoint, ImagePoint]
}

/** Tramos del contorno en el mismo orden y con la misma curva que buildPath. */
export function contourSegments(pts: ContourPoint[], closed = true): Segment[] {
  const n = pts.length
  if (n < 2) return []
  const limit = closed ? n : n - 1
  const out: Segment[] = []
  for (let i = 0; i < limit; i++) {
    const curr = pts[i]
    const next = pts[(i + 1) % n]
    const seg: Segment = { index: i, from: { x: curr.x, y: curr.y }, to: { x: next.x, y: next.y } }
    if (curr.type === 'bezier') {
      const prev = pts[(i - 1 + n) % n]
      const nn = pts[(i + 2) % n]
      seg.controls = [
        { x: curr.x + (next.x - prev.x) * TENSION, y: curr.y + (next.y - prev.y) * TENSION },
        { x: next.x - (nn.x - curr.x) * TENSION, y: next.y - (nn.y - curr.y) * TENSION },
      ]
    }
    out.push(seg)
  }
  return out
}

function cubicAt(a: ImagePoint, c1: ImagePoint, c2: ImagePoint, b: ImagePoint, t: number): ImagePoint {
  const u = 1 - t
  const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t
  return { x: w0 * a.x + w1 * c1.x + w2 * c2.x + w3 * b.x, y: w0 * a.y + w1 * c1.y + w2 * c2.y + w3 * b.y }
}

/**
 * Polilínea equivalente a lo que dibuja el canvas: los tramos rectos se quedan igual y cada tramo
 * Bezier se muestrea en BEZIER_STEPS partes. Sin Bezier devuelve exactamente los mismos puntos.
 * En un contorno cerrado no se repite el primer punto al final.
 */
export function flattenContour(pts: ContourPoint[], closed = true): ImagePoint[] {
  if (pts.length < 2) return pts.map((p) => ({ x: p.x, y: p.y }))
  const out: ImagePoint[] = [{ x: pts[0].x, y: pts[0].y }]
  const n = pts.length
  for (const seg of contourSegments(pts, closed)) {
    if (seg.controls) {
      for (let k = 1; k < BEZIER_STEPS; k++) {
        out.push(cubicAt(seg.from, seg.controls[0], seg.controls[1], seg.to, k / BEZIER_STEPS))
      }
    }
    const isClosing = closed && seg.index === n - 1
    if (!isClosing) out.push(seg.to)
  }
  return out
}

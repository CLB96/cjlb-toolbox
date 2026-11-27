// Notches visuales: geometría pura. Un notch se guarda como un punto cualquiera (x, y) y se dibuja
// siempre pegado al punto más cercano del contorno, apuntando hacia el interior de la pieza.
import type { ContourPoint, ImagePoint, Notch, NotchType, SegmentType } from '../types'
import { contourSegments, flattenContour, segmentPolyline } from './contourPath'

export const DEFAULT_NOTCH_DEPTH = 5
const MAX_NOTCH_DEPTH = 100

/** Profundidad en mm: vacío, cero, negativo o no numérico da la de por defecto; máximo 100. */
export function clampDepth(v: unknown): number {
  const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_NOTCH_DEPTH
  return Math.min(MAX_NOTCH_DEPTH, n)
}

let counter = 0
export function newNotch(x: number, y: number, type: NotchType = 'V'): Notch {
  counter += 1
  return { id: `notch-${Date.now().toString(36)}-${counter}`, x, y, type, depth: DEFAULT_NOTCH_DEPTH, flipped: false }
}

/** Trazo al que está pegado el notch: uno guardado (`pathIndex`) o, sin índice, el trazo activo. */
export function notchOwnerPoints(notch: Notch, contour: ContourPoint[], paths: ContourPoint[][] = []): ContourPoint[] {
  return notch.pathIndex === undefined ? contour : (paths[notch.pathIndex] ?? [])
}

export interface ContourHit {
  x: number
  y: number
  /** Tangente unitaria del tramo. */
  tx: number
  ty: number
  /** Normal unitaria hacia el interior de la pieza. */
  nx: number
  ny: number
  dist: number
  /** Tramo del contorno al que pertenece el punto: el tramo i va del punto i al siguiente. */
  segmentIndex: number
}

/** Punto del contorno más cercano a (x, y); null si el contorno tiene menos de 2 puntos. */
export function nearestOnContour(points: ContourPoint[], x: number, y: number): ContourHit | null {
  const flat = flattenContour(points)
  if (flat.length < 2) return null
  let area = 0
  for (let i = 0; i < flat.length; i++) {
    const a = flat[i]!
    const b = flat[(i + 1) % flat.length]!
    area += a.x * b.y - b.x * a.y
  }
  let best: { px: number; py: number; tx: number; ty: number; dist: number; segmentIndex: number } | null = null
  for (const seg of contourSegments(points)) {
    const line = segmentPolyline(seg)
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i]!
      const b = line[i + 1]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len2 = dx * dx + dy * dy
      if (len2 === 0) continue
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2))
      const px = a.x + t * dx
      const py = a.y + t * dy
      const dist = Math.hypot(x - px, y - py)
      if (!best || dist < best.dist) {
        const len = Math.sqrt(len2)
        best = { px, py, tx: dx / len, ty: dy / len, dist, segmentIndex: seg.index }
      }
    }
  }
  if (!best) return null
  // con área positiva el interior queda a la izquierda del sentido de avance
  const [nx, ny] = area >= 0 ? [-best.ty, best.tx] : [best.ty, -best.tx]
  return { x: best.px, y: best.py, tx: best.tx, ty: best.ty, nx, ny, dist: best.dist, segmentIndex: best.segmentIndex }
}

/** Copia del contorno con el tipo del tramo `index` cambiado (el tramo i va del punto i al siguiente). */
export function withSegmentType(points: ContourPoint[], index: number, type: SegmentType): ContourPoint[] {
  if (index < 0 || index >= points.length) return points
  return points.map((p, i) => (i === index ? { ...p, type } : p))
}

export interface NotchShape {
  type: NotchType
  base: ImagePoint
  tip: ImagePoint
  /** V: extremos de la base. T: extremos del travesaño. I: no tiene. */
  a?: ImagePoint
  b?: ImagePoint
}

const DEG = Math.PI / 180

/** Tangente y normal del tramo giradas `deg` grados. */
function rotateHit(hit: ContourHit, deg: number) {
  const c = Math.cos(deg * DEG)
  const s = Math.sin(deg * DEG)
  return { tx: hit.tx * c - hit.ty * s, ty: hit.tx * s + hit.ty * c, nx: hit.nx * c - hit.ny * s, ny: hit.nx * s + hit.ny * c }
}

/** Ángulo (grados, -180..180) para que el notch apunte hacia (x, y) sin moverse de su base. null si no hay contorno. */
export function notchAngleToward(notch: Notch, points: ContourPoint[], x: number, y: number): number | null {
  const hit = nearestOnContour(points, notch.x, notch.y)
  if (!hit) return null
  const dx = x - hit.x
  const dy = y - hit.y
  if (dx === 0 && dy === 0) return null
  const sign = notch.flipped ? -1 : 1
  const ux = dx * sign
  const uy = dy * sign
  return Math.atan2(hit.nx * uy - hit.ny * ux, hit.nx * ux + hit.ny * uy) / DEG
}

/** Forma del notch en píxeles de imagen; la profundidad (mm) se pasa a píxeles con la escala (mm/px). */
export function notchGeometry(notch: Notch, points: ContourPoint[], scaleFactor: number): NotchShape | null {
  const hit = nearestOnContour(points, notch.x, notch.y)
  if (!hit) return null
  const sign = notch.flipped ? -1 : 1
  const rot = rotateHit(hit, notch.angle ?? 0)
  const depth = clampDepth(notch.depth) / (scaleFactor > 0 ? scaleFactor : 1)
  const base = { x: hit.x, y: hit.y }
  const tip = { x: hit.x + rot.nx * sign * depth, y: hit.y + rot.ny * sign * depth }
  const half = depth / 2
  const along = (from: ImagePoint, k: number): ImagePoint => ({ x: from.x + rot.tx * half * k, y: from.y + rot.ty * half * k })
  if (notch.type === 'I') return { type: 'I', base, tip }
  if (notch.type === 'V') return { type: 'V', base, tip, a: along(base, -1), b: along(base, 1) }
  return { type: 'T', base, tip, a: along(tip, -1), b: along(tip, 1) }
}

// Notches visuales: geometría pura. Un notch se guarda como un punto cualquiera (x, y) y se dibuja
// siempre pegado al punto más cercano del contorno, apuntando hacia el interior de la pieza.
import type { ContourPoint, ImagePoint, Notch, NotchType } from '../types'
import { flattenContour } from './contourPath'

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
}

/** Punto del contorno más cercano a (x, y); null si el contorno tiene menos de 2 puntos. */
export function nearestOnContour(points: ContourPoint[], x: number, y: number): ContourHit | null {
  const flat = flattenContour(points)
  const n = flat.length
  if (n < 2) return null
  let area = 0
  let best: { px: number; py: number; tx: number; ty: number; dist: number } | null = null
  for (let i = 0; i < n; i++) {
    const a = flat[i]!
    const b = flat[(i + 1) % n]!
    area += a.x * b.y - b.x * a.y
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
      best = { px, py, tx: dx / len, ty: dy / len, dist }
    }
  }
  if (!best) return null
  // con área positiva el interior queda a la izquierda del sentido de avance
  const [nx, ny] = area >= 0 ? [-best.ty, best.tx] : [best.ty, -best.tx]
  return { x: best.px, y: best.py, tx: best.tx, ty: best.ty, nx, ny, dist: best.dist }
}

export interface NotchShape {
  type: NotchType
  base: ImagePoint
  tip: ImagePoint
  /** V: extremos de la base. T: extremos del travesaño. I: no tiene. */
  a?: ImagePoint
  b?: ImagePoint
}

/** Forma del notch en píxeles de imagen; la profundidad (mm) se pasa a píxeles con la escala (mm/px). */
export function notchGeometry(notch: Notch, points: ContourPoint[], scaleFactor: number): NotchShape | null {
  const hit = nearestOnContour(points, notch.x, notch.y)
  if (!hit) return null
  const sign = notch.flipped ? -1 : 1
  const depth = clampDepth(notch.depth) / (scaleFactor > 0 ? scaleFactor : 1)
  const base = { x: hit.x, y: hit.y }
  const tip = { x: hit.x + hit.nx * sign * depth, y: hit.y + hit.ny * sign * depth }
  const half = depth / 2
  const along = (from: ImagePoint, k: number): ImagePoint => ({ x: from.x + hit.tx * half * k, y: from.y + hit.ty * half * k })
  if (notch.type === 'I') return { type: 'I', base, tip }
  if (notch.type === 'V') return { type: 'V', base, tip, a: along(base, -1), b: along(base, 1) }
  return { type: 'T', base, tip, a: along(tip, -1), b: along(tip, 1) }
}

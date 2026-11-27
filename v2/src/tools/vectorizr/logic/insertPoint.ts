import type { ContourPoint } from '../types'
import { nearestOnContour } from './notches'

/**
 * Inserta un punto nuevo en el tramo del contorno más cercano a (x, y), apoyado sobre ese tramo, en vez de
 * agregarlo al final. Con menos de 2 puntos no hay tramos y se agrega al final tal cual.
 * Un tramo curvo se parte en dos curvas (las asas guardadas del tramo original se descartan).
 */
export function insertPointOnContour(points: ContourPoint[], x: number, y: number, id: string): ContourPoint[] {
  const hit = nearestOnContour(points, x, y)
  if (!hit) return [...points, { id, x, y, type: 'line' }]
  const at = hit.segmentIndex
  const split = points[at]!
  const point: ContourPoint = { id, x: hit.x, y: hit.y, type: split.type }
  const out = points.map((p, i) => (i === at && p.handles ? { ...p, handles: undefined } : p))
  out.splice(at + 1, 0, point)
  return out
}

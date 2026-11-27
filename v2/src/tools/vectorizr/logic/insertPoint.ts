import type { ContourPoint } from '../types'
import { nearestOnContour } from './notches'

const MIN_POINTS_TO_SNAP = 3

/**
 * Inserta un punto nuevo en el tramo del contorno más cercano a (x, y), apoyado sobre ese tramo, en vez de
 * agregarlo al final. Con menos de 3 puntos todavía no hay figura (un trazo nuevo empieza así), por lo que el
 * punto se agrega al final donde se hizo clic; si se apoyara en la línea, nunca saldría una figura.
 * Un tramo curvo se parte en dos curvas (las asas guardadas del tramo original se descartan).
 */
export function insertPointOnContour(points: ContourPoint[], x: number, y: number, id: string): ContourPoint[] {
  if (points.length < MIN_POINTS_TO_SNAP) return [...points, { id, x, y, type: 'line' }]
  const hit = nearestOnContour(points, x, y)
  if (!hit) return [...points, { id, x, y, type: 'line' }]
  const at = hit.segmentIndex
  const split = points[at]!
  const point: ContourPoint = { id, x: hit.x, y: hit.y, type: split.type }
  const out = points.map((p, i) => (i === at && p.handles ? { ...p, handles: undefined } : p))
  out.splice(at + 1, 0, point)
  return out
}

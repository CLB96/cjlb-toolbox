// Notches para exportar como capa aparte (opcional): dibujo de cada notch como líneas, en píxeles de imagen.
import type { ImagePoint, Piece } from '../types'
import { drillPolyline } from './drills'
import { notchGeometry } from './notches'

export interface Polyline {
  points: ImagePoint[]
  closed: boolean
}

/** I: una línea; V: un triángulo cerrado; T: el palo y el travesaño como dos líneas. */
export function notchPolylines(piece: Pick<Piece, 'contourPoints' | 'notches' | 'drills'>, scaleFactor: number): Polyline[] {
  const circles = (piece.drills ?? []).map((d) => drillPolyline(d, scaleFactor))
  return [...circles, ...piece.notches.flatMap((n): Polyline[] => {
    const g = notchGeometry(n, piece.contourPoints, scaleFactor)
    if (!g) return []
    if (g.type === 'V' && g.a && g.b) return [{ points: [g.a, g.b, g.tip], closed: true }]
    if (g.type === 'T' && g.a && g.b) {
      return [
        { points: [g.base, g.tip], closed: false },
        { points: [g.a, g.b], closed: false },
      ]
    }
    return [{ points: [g.base, g.tip], closed: false }]
  })]
}

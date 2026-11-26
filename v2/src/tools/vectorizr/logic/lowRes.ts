// Detección en baja resolución: solo la copia que ve el detector se reduce; la imagen y los puntos
// (ya devueltos al tamaño original) conservan la resolución completa, así la regla sigue legible.
import type { ImagePoint } from '../types'

export const LOW_RES_MAX = 640

/** Factor para que el lado mayor mida LOW_RES_MAX px como máximo; nunca agranda. */
export function lowResScale(width: number, height: number, max = LOW_RES_MAX): number {
  return Math.min(1, max / Math.max(width, height))
}

/** Devuelve al tamaño original los puntos detectados sobre la copia reducida por `scale`. */
export function scalePointsBack(points: ImagePoint[], scale: number): ImagePoint[] {
  if (scale === 1) return points
  return points.map((p) => ({ x: p.x / scale, y: p.y / scale }))
}

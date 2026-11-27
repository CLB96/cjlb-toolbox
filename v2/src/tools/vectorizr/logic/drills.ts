// Drills: círculos (perforaciones) de diámetro en mm, libres o en la punta de un notch I.
import type { Drill, ImagePoint } from '../types'

export const DEFAULT_DRILL_DIAMETER = 3
const MAX_DRILL_DIAMETER = 100
const CIRCLE_SEGMENTS = 48

/** Diámetro en mm: vacío, cero, negativo o no numérico da el de por defecto; máximo 100. */
export function clampDiameter(v: unknown): number {
  const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DRILL_DIAMETER
  return Math.min(MAX_DRILL_DIAMETER, n)
}

export const diameterToRadius = (d: number): number => d / 2
export const radiusToDiameter = (r: number): number => r * 2

/** Texto de un número para los campos: hasta 3 decimales, sin ceros de más. */
export function formatMm(v: number): string {
  return String(Math.round(v * 1000) / 1000)
}

let counter = 0
export function newDrill(x: number, y: number): Drill {
  counter += 1
  return { id: `drill-${Date.now().toString(36)}-${counter}`, x, y, diameter: DEFAULT_DRILL_DIAMETER }
}

/** Radio en píxeles de imagen; la escala es mm/px. */
export function drillRadiusPx(drill: Drill, scaleFactor: number): number {
  return clampDiameter(drill.diameter) / 2 / (scaleFactor > 0 ? scaleFactor : 1)
}

/** El círculo como polilínea cerrada, en píxeles de imagen (para DXF y SVG). */
export function drillPolyline(drill: Drill, scaleFactor: number): { points: ImagePoint[]; closed: boolean } {
  const r = drillRadiusPx(drill, scaleFactor)
  const points = Array.from({ length: CIRCLE_SEGMENTS }, (_, i) => {
    const a = (i / CIRCLE_SEGMENTS) * Math.PI * 2
    return { x: drill.x + Math.cos(a) * r, y: drill.y + Math.sin(a) * r }
  })
  return { points, closed: true }
}

// Preparar la foto antes de detectar: recorte y zonas borradas. Solo cambian lo que ve el detector;
// la imagen original, la escala y las coordenadas de los puntos (siempre en píxeles de la foto) no se tocan.
import type { ImagePoint } from '../types'

export interface Crop {
  x: number
  y: number
  w: number
  h: number
}

export interface Stroke {
  points: ImagePoint[]
  /** Grosor del pincel en píxeles de la foto. */
  size: number
}

export interface ImagePrep {
  crop: Crop | null
  strokes: Stroke[]
  /** Brillo y contraste en % sobre el original (0 = sin cambio, de -50 a 100). Solo cambian lo que ve el detector. */
  brightness: number
  contrast: number
}

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move'

export const EMPTY_PREP: ImagePrep = { crop: null, strokes: [], brightness: 0, contrast: 0 }
export const ADJUST_MIN = -50
export const ADJUST_MAX = 100
export const MIN_CROP = 24

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

export const isPrepped = (p: ImagePrep): boolean => p.crop !== null || p.strokes.length > 0 || p.brightness !== 0 || p.contrast !== 0

/** Recorte entero y dentro de la foto, con tamaño mínimo; `null` si cubre toda la foto. */
export function normalizeCrop(c: Crop, width: number, height: number): Crop | null {
  let x0 = clamp(Math.round(c.x), 0, width)
  let y0 = clamp(Math.round(c.y), 0, height)
  let x1 = clamp(Math.round(c.x + c.w), 0, width)
  let y1 = clamp(Math.round(c.y + c.h), 0, height)
  if (x1 - x0 < MIN_CROP) {
    x1 = Math.min(width, x0 + MIN_CROP)
    x0 = x1 - MIN_CROP
  }
  if (y1 - y0 < MIN_CROP) {
    y1 = Math.min(height, y0 + MIN_CROP)
    y0 = y1 - MIN_CROP
  }
  if (x0 === 0 && y0 === 0 && x1 === width && y1 === height) return null
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** Qué parte del marco toca el punto (en píxeles de la foto); `tol` es la distancia de agarre. */
export function hitHandle(c: Crop, px: number, py: number, tol: number): Handle | null {
  const right = c.x + c.w
  const bottom = c.y + c.h
  const nearL = Math.abs(px - c.x) <= tol
  const nearR = Math.abs(px - right) <= tol
  const nearT = Math.abs(py - c.y) <= tol
  const nearB = Math.abs(py - bottom) <= tol
  const inX = px >= c.x - tol && px <= right + tol
  const inY = py >= c.y - tol && py <= bottom + tol
  if (nearT && nearL) return 'nw'
  if (nearT && nearR) return 'ne'
  if (nearB && nearL) return 'sw'
  if (nearB && nearR) return 'se'
  if (nearT && inX) return 'n'
  if (nearB && inX) return 's'
  if (nearL && inY) return 'w'
  if (nearR && inY) return 'e'
  if (px > c.x && px < right && py > c.y && py < bottom) return 'move'
  return null
}

/** Marco resultante de arrastrar `handle` (dx, dy) desde `start`, sin salir de la foto ni bajar del mínimo. */
export function dragCrop(start: Crop, handle: Handle, dx: number, dy: number, width: number, height: number): Crop {
  if (handle === 'move') {
    return { ...start, x: clamp(start.x + dx, 0, width - start.w), y: clamp(start.y + dy, 0, height - start.h) }
  }
  let left = start.x
  let top = start.y
  let right = start.x + start.w
  let bottom = start.y + start.h
  if (handle.includes('w')) left = clamp(left + dx, 0, right - MIN_CROP)
  if (handle.includes('e')) right = clamp(right + dx, left + MIN_CROP, width)
  if (handle.includes('n')) top = clamp(top + dy, 0, bottom - MIN_CROP)
  if (handle.includes('s')) bottom = clamp(bottom + dy, top + MIN_CROP, height)
  return { x: left, y: top, w: right - left, h: bottom - top }
}

/** Pasa los puntos de un recorte a coordenadas de la foto completa. */
export function offsetPoints(points: ImagePoint[], dx: number, dy: number): ImagePoint[] {
  if (dx === 0 && dy === 0) return points
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
}

/**
 * Donde el recorte corta la pieza, el borde del recorte es un tope: los puntos del contorno que quedaron a menos
 * de `tol` de un lado se pegan a esa línea y los intermedios de cada tramo recto se quitan, así el contorno sigue
 * el borde del recorte en línea recta en vez de zigzaguear. Los puntos lejos del borde no se tocan.
 */
export function snapToCrop(points: ImagePoint[], crop: Crop, tol: number): ImagePoint[] {
  const L = 1
  const R = 2
  const T = 4
  const B = 8
  const right = crop.x + crop.w
  const bottom = crop.y + crop.h
  const snapped = points.map((p) => {
    let x = p.x
    let y = p.y
    let sides = 0
    if (Math.abs(x - crop.x) <= tol) { x = crop.x; sides |= L }
    else if (Math.abs(x - right) <= tol) { x = right; sides |= R }
    if (Math.abs(y - crop.y) <= tol) { y = crop.y; sides |= T }
    else if (Math.abs(y - bottom) <= tol) { y = bottom; sides |= B }
    return { point: { x, y }, sides }
  })
  const n = snapped.length
  const kept = snapped.filter((s, i) => {
    const common = s.sides & snapped[(i + n - 1) % n]!.sides & snapped[(i + 1) % n]!.sides
    return common === 0
  })
  return (kept.length >= 3 ? kept : snapped).map((s) => s.point)
}

/** Factores de brillo y contraste (1 = igual) a partir de los porcentajes del control. */
const factors = (brightness: number, contrast: number) => [1 + brightness / 100, 1 + contrast / 100] as const

/** Mismo efecto que el filtro CSS `brightness() contrast()`, para ver en pantalla lo que recibirá el detector. */
export function adjustFilter(brightness: number, contrast: number): string | undefined {
  if (brightness === 0 && contrast === 0) return undefined
  const [b, c] = factors(brightness, contrast)
  return `brightness(${b}) contrast(${c})`
}

/** Aplica brillo y contraste a los canales RGB (RGBA en sitio): v' = ((v·b) - 0.5)·c + 0.5. */
export function adjustPixels(data: Uint8ClampedArray, brightness: number, contrast: number): void {
  if (brightness === 0 && contrast === 0) return
  const [b, c] = factors(brightness, contrast)
  const lut = new Uint8ClampedArray(256)
  for (let v = 0; v < 256; v++) lut[v] = Math.round((((v / 255) * b - 0.5) * c + 0.5) * 255)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]!]!
    data[i + 1] = lut[data[i + 1]!]!
    data[i + 2] = lut[data[i + 2]!]!
  }
}

// Fixtures sintéticos de VectoriZr: imágenes RGBA generadas en código (para la detección golden)
// y contornos de ejemplo (para los diferenciales de exportación).
import type { ContourPoint, SegmentType } from '../../src/tools/vectorizr/types'

export interface RgbaImage {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** PRNG determinista (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Inside = (x: number, y: number) => boolean

function paint(width: number, height: number, inside: Inside, fg: number, bg: number, noise = 0, seed = 1): RgbaImage {
  const rand = rng(seed)
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const base = inside(x, y) ? fg : bg
      const v = noise ? base + (rand() - 0.5) * 2 * noise : base
      const o = (y * width + x) * 4
      data[o] = v; data[o + 1] = v; data[o + 2] = v; data[o + 3] = 255
    }
  }
  return { data, width, height }
}

function pointInPolygon(poly: [number, number][]): Inside {
  return (x, y) => {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]
      const [xj, yj] = poly[j]
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }
}

const W = 200
const H = 150

/** Imágenes de prueba; se copian en cada uso porque el ImageData se transfiere/consume. */
export const IMAGE_FIXTURES: Record<string, () => RgbaImage> = {
  rectangle: () => paint(W, H, (x, y) => x >= 40 && x < 160 && y >= 30 && y < 120, 30, 230),
  circle: () => paint(W, H, (x, y) => (x - 100) ** 2 + (y - 75) ** 2 < 50 ** 2, 20, 220),
  polygonNoisy: () =>
    paint(W, H, pointInPolygon([[30, 20], [170, 40], [150, 130], [90, 100], [40, 125]]), 40, 210, 25, 7),
  invertedPolarity: () => paint(W, H, (x, y) => x >= 50 && x < 150 && y >= 40 && y < 110, 235, 25),
  tinyObject: () => paint(W, H, (x, y) => x >= 95 && x < 103 && y >= 70 && y < 78, 0, 255),
  blank: () => paint(W, H, () => false, 0, 255),
}

const pt = (id: string, x: number, y: number, type: SegmentType = 'line'): ContourPoint => ({ id, x, y, type })

export const SQUARE: ContourPoint[] = [pt('a', 0, 0), pt('b', 100, 0), pt('c', 100, 80), pt('d', 0, 80)]
export const TRIANGLE_OFFSET: ContourPoint[] = [pt('t1', 37.5, 12.25), pt('t2', 210.1, 40.7), pt('t3', 90.3, 199.9)]
export const IRREGULAR: ContourPoint[] = [
  pt('i1', 15, 22), pt('i2', 301.7, 18.2), pt('i3', 333.3, 250.5), pt('i4', 120.9, 290.1), pt('i5', 10.4, 180.6),
]
export const MIXED: ContourPoint[] = [
  pt('m1', 10, 10), pt('m2', 110, 10, 'bezier'), pt('m3', 110, 90), pt('m4', 10, 90, 'bezier'),
]
export const ALL_BEZIER: ContourPoint[] = SQUARE.map((p) => ({ ...p, type: 'bezier' }))

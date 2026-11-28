// @vitest-environment node
// Golden: la detección nueva (worker/detect.ts, sin fugas) contra la copia literal del worker original,
// ambas sobre el opencv.js real que se sirve en producción.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { detect, previewMask } from '../../src/tools/vectorizr/worker/detect'
import type { DetectParams } from '../../src/tools/vectorizr/types'
import { IMAGE_FIXTURES } from './fixtures'
import { legacyDetect } from './legacyDetect'

const OPENCV = fileURLToPath(new URL('../../public/vendor/opencv/opencv-806cb564.js', import.meta.url))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cv: any

/**
 * Carga opencv.js como lo hace el worker: con un `Module` previo cuyo onRuntimeInitialized avisa.
 * `process`/`require` se ocultan para que Emscripten no registre manejadores globales de Node.
 * Ojo: el objeto devuelto es "thenable"; nunca se hace `await` sobre él.
 */
function loadOpencv(): Promise<{ cv: unknown }> {
  return new Promise((resolve, reject) => {
    const mod: { exports: unknown } = { exports: {} }
    // Se resuelve con un envoltorio: resolver con el thenable de Emscripten colgaría la promesa.
    const Module = { onRuntimeInitialized: () => resolve({ cv: mod.exports }) }
    try {
      new Function('module', 'exports', 'Module', 'require', '__dirname', '__filename', 'process', readFileSync(OPENCV, 'utf8'))(
        mod, mod.exports, Module, undefined, undefined, undefined, undefined,
      )
    } catch (e) {
      reject(e)
    }
  })
}

beforeAll(async () => {
  cv = (await loadOpencv()).cv
}, 60_000)

const PARAMS: [string, DetectParams][] = [
  ['otsu', { method: 0, threshold1: 50, threshold2: 150 }],
  ['canny 50/150', { method: 1, threshold1: 50, threshold2: 150 }],
  ['canny 20/80', { method: 1, threshold1: 20, threshold2: 80 }],
]

// Otsu ya no replica al original: el contorno que toca los bordes (fondo/papel) se descarta aunque sea mayor.
const LEGACY_PARAMS = PARAMS.filter(([label]) => label !== 'otsu')
const OBJECTS = ['rectangle', 'circle', 'polygonNoisy', 'invertedPolarity'] as const
const CASES = Object.keys(IMAGE_FIXTURES).flatMap((name) => LEGACY_PARAMS.map(([label, params]) => [name, label, params] as const))

describe('detect vs legacy worker', () => {
  it.each(CASES)('%s × %s', (name, _label, params) => {
    const expected = legacyDetect(cv, { imageData: IMAGE_FIXTURES[name](), ...params })
    const actual = detect(cv, { imageData: IMAGE_FIXTURES[name](), ...params })
    expect(actual).toEqual(expected)
  })

  it('sanity: Canny finds the rectangle, a blank image gives []', () => {
    const pts = detect(cv, { imageData: IMAGE_FIXTURES.rectangle(), ...PARAMS[1][1] })
    expect(pts.length).toBeGreaterThanOrEqual(4)
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(38); expect(p.x).toBeLessThanOrEqual(161)
      expect(p.y).toBeGreaterThanOrEqual(28); expect(p.y).toBeLessThanOrEqual(121)
    }
    expect(detect(cv, { imageData: IMAGE_FIXTURES.blank(), ...PARAMS[1][1] })).toEqual([])
  })

  it.each(OBJECTS)('Otsu rodea el objeto, no el borde de la imagen: %s', (name) => {
    const img = IMAGE_FIXTURES[name]()
    const pts = detect(cv, { imageData: img, ...PARAMS[0][1] })
    expect(pts.length).toBeGreaterThanOrEqual(4)
    for (const p of pts) {
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(img.width - 1)
      expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(img.height - 1)
    }
  })

  it('Otsu con degradado de luz: la pieza oscura sale entera, no el papel', () => {
    const w = 400, h = 200
    const data = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const inside = x >= 100 && x < 300 && y >= 60 && y < 140
      const v = inside ? 45 : 110 + (x / w) * 140
      const o = (y * w + x) * 4
      data[o] = data[o + 1] = data[o + 2] = v; data[o + 3] = 255
    }
    const pts = detect(cv, { imageData: { data, width: w, height: h }, ...PARAMS[0][1] })
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(95); expect(Math.max(...xs)).toBeLessThanOrEqual(305)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(55); expect(Math.max(...ys)).toBeLessThanOrEqual(145)
  })

  it('Otsu separa un objeto oscuro unido a la pieza solo por un cuello fino (la regla pegada)', () => {
    const w = 400, h = 300
    const data = new Uint8ClampedArray(w * h * 4).fill(235)
    const dark = (x: number, y: number) =>
      (x >= 60 && x < 220 && y >= 60 && y < 220) || // pieza
      (x >= 220 && x < 260 && y >= 136 && y < 142) || // cuello
      (x >= 260 && x < 285 && y >= 40 && y < 260) // regla
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dark(x, y)) {
      const o = (y * w + x) * 4
      data[o] = data[o + 1] = data[o + 2] = 40
    }
    const pts = detect(cv, { imageData: { data, width: w, height: h }, ...PARAMS[0][1] })
    expect(Math.max(...pts.map((p) => p.x))).toBeLessThan(235)
  })

  it('zona a ignorar (alfa 0): lo pintado no entra al contorno aunque la regla esté pegada con un cuello ancho', () => {
    const w = 400, h = 300
    const data = new Uint8ClampedArray(w * h * 4).fill(235)
    const dark = (x: number, y: number) =>
      (x >= 60 && x < 220 && y >= 60 && y < 220) || // pieza
      (x >= 220 && x < 300 && y >= 80 && y < 200) // regla pegada con un cuello tan ancho que no se separa sola
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dark(x, y)) {
      const o = (y * w + x) * 4
      data[o] = data[o + 1] = data[o + 2] = 40
    }
    const withRuler = detect(cv, { imageData: { data: data.slice(), width: w, height: h }, ...PARAMS[0][1] })
    expect(Math.max(...withRuler.map((p) => p.x))).toBeGreaterThan(280)
    // el usuario pinta la regla (alfa 0); el color de esos píxeles no se toca
    for (let y = 0; y < h; y++) for (let x = 224; x < w; x++) data[(y * w + x) * 4 + 3] = 0
    const ignored = detect(cv, { imageData: { data, width: w, height: h }, ...PARAMS[0][1], ignoreTransparent: true })
    expect(Math.max(...ignored.map((p) => p.x))).toBeLessThan(235)
    expect(Math.min(...ignored.map((p) => p.x))).toBeGreaterThanOrEqual(55)
    const canny = detect(cv, { imageData: { data, width: w, height: h }, ...PARAMS[1][1], ignoreTransparent: true })
    expect(Math.max(...canny.map((p) => p.x))).toBeLessThan(235)
  })

  it('sin la marca ignoreTransparent el alfa no importa (imágenes con transparencia no cambian)', () => {
    const w = 400, h = 200
    const data = new Uint8ClampedArray(w * h * 4).fill(235)
    for (let y = 60; y < 140; y++) for (let x = 100; x < 300; x++) {
      const o = (y * w + x) * 4
      data[o] = data[o + 1] = data[o + 2] = 40
    }
    const opaque = detect(cv, { imageData: { data: data.slice(), width: w, height: h }, ...PARAMS[0][1] })
    for (let i = 3; i < data.length; i += 4) data[i] = 0
    expect(detect(cv, { imageData: { data, width: w, height: h }, ...PARAMS[0][1] })).toEqual(opaque)
  })

  describe('Detalle (1-5)', () => {
    const w = 500, h = 300
    /** Pieza oscura con dientes de 3 px de alto cada 10 px en el borde de arriba. */
    function toothed() {
      const data = new Uint8ClampedArray(w * h * 4).fill(235)
      for (let y = 60; y < 240; y++) for (let x = 60; x < 440; x++) {
        const edge = 60 + (Math.floor((x - 60) / 5) % 2 === 0 ? 0 : 4)
        if (y >= edge) {
          const o = (y * w + x) * 4
          data[o] = data[o + 1] = data[o + 2] = 40
        }
      }
      return { data, width: w, height: h }
    }
    const count = (detail?: number) => detect(cv, { imageData: toothed(), ...PARAMS[0][1], ...(detail === undefined ? {} : { detail }) }).length

    it('el 3 es el comportamiento de siempre', () => {
      expect(count(3)).toBe(count())
    })

    it('más detalle capta más puntos que menos detalle', () => {
      expect(count(5)).toBeGreaterThan(count(1))
      expect(count(5)).toBeGreaterThanOrEqual(count(3))
      expect(count(3)).toBeGreaterThanOrEqual(count(1))
    })

    it('un valor fuera de rango usa el de siempre', () => {
      expect(count(99)).toBe(count())
    })
  })

  it('Polaridad forzada: «dark» rodea la pieza oscura y «light» el fondo claro', () => {
    const w = 400, h = 300
    const data = new Uint8ClampedArray(w * h * 4).fill(235)
    for (let y = 80; y < 220; y++) for (let x = 100; x < 300; x++) {
      const o = (y * w + x) * 4
      data[o] = data[o + 1] = data[o + 2] = 40
    }
    const img = () => ({ data: data.slice(), width: w, height: h })
    const dark = detect(cv, { imageData: img(), ...PARAMS[0][1], polarity: 'dark' })
    const light = detect(cv, { imageData: img(), ...PARAMS[0][1], polarity: 'light' })
    expect(Math.min(...dark.map((p) => p.x))).toBeGreaterThan(90)
    expect(Math.min(...light.map((p) => p.x))).toBeLessThan(5) // el fondo toca el borde de la imagen
    expect(detect(cv, { imageData: img(), ...PARAMS[0][1] })).toEqual(dark) // sin forzar, lo de siempre
  })

  it('previewMask: la pieza que detecta en blanco; el fondo, lo que descarta y lo ignorado en negro', () => {
    const w = 400, h = 300
    const data = new Uint8ClampedArray(w * h * 4).fill(235)
    for (let y = 60; y < 220; y++) for (let x = 60; x < 260; x++) { const o = (y * w + x) * 4; data[o] = data[o + 1] = data[o + 2] = 40 }
    for (let y = 100; y < 180; y++) for (let x = 300; x < 360; x++) { const o = (y * w + x) * 4; data[o] = data[o + 1] = data[o + 2] = 40 }
    for (let y = 100; y < 140; y++) for (let x = 300; x < 360; x++) data[(y * w + x) * 4 + 3] = 0 // zona ignorada sobre la mitad de arriba del otro objeto
    const m = previewMask(cv, { imageData: { data, width: w, height: h }, ...PARAMS[0][1], ignoreTransparent: true })
    const at = (x: number, y: number) => m.data[(y * w + x) * 4]
    const counts: Record<number, number> = {}
    for (let i = 0; i < w * h; i++) counts[m.data[i * 4]!] = (counts[m.data[i * 4]!] ?? 0) + 1
    expect(m.width).toBe(w)
    expect(at(180, 140)).toBe(255) // pieza mayor
    expect(at(330, 160)).toBe(0) // el otro objeto no es la pieza: el detector se queda con el cuerpo mayor
    expect(at(10, 10)).toBe(0) // fondo
    expect(at(330, 120)).toBe(0) // ignorado
  })

  it('object below 0.5 % area falls back to Canny 50/150 without minimum', () => {
    expect(detect(cv, { imageData: IMAGE_FIXTURES.tinyObject(), ...PARAMS[0][1] }).length).toBeGreaterThan(0)
  })
})

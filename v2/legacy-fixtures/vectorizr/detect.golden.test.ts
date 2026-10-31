// @vitest-environment node
// Golden: la detección nueva (worker/detect.ts, sin fugas) contra la copia literal del worker original,
// ambas sobre el opencv.js real que se sirve en producción.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { detect } from '../../src/tools/vectorizr/worker/detect'
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

const CASES = Object.keys(IMAGE_FIXTURES).flatMap((name) => PARAMS.map(([label, params]) => [name, label, params] as const))

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

  it('legacy quirk kept (#35): Otsu on a dark rectangle takes the image border', () => {
    expect(detect(cv, { imageData: IMAGE_FIXTURES.rectangle(), ...PARAMS[0][1] })).toEqual([
      { x: 0, y: 0 }, { x: 0, y: 149 }, { x: 199, y: 149 }, { x: 199, y: 0 },
    ])
  })

  it('object below 0.5 % area falls back to Canny 50/150 without minimum', () => {
    expect(detect(cv, { imageData: IMAGE_FIXTURES.tinyObject(), ...PARAMS[0][1] }).length).toBeGreaterThan(0)
  })
})

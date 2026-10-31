// Diferencial: la lógica nueva (src/tools/vectorizr/logic) contra la copia literal del original.
import { describe, expect, it } from 'vitest'
import { buildPath, flattenContour } from '../../src/tools/vectorizr/logic/contourPath'
import { pointsToDxf } from '../../src/tools/vectorizr/logic/exportDxf'
import { drawPdf, layoutPdf, PDF_MARGIN } from '../../src/tools/vectorizr/logic/exportPdf'
import { pointsToSvg } from '../../src/tools/vectorizr/logic/exportSvg'
import { clampDimensions, MAX_SIZE } from '../../src/tools/vectorizr/logic/imageNormalize'
import { computeScaleFactor, pxToMm, unitToMm } from '../../src/tools/vectorizr/logic/scale'
import type { ContourPoint, ScaleUnit } from '../../src/tools/vectorizr/types'
import { ALL_BEZIER, IRREGULAR, MIXED, SQUARE, TRIANGLE_OFFSET } from './fixtures'
import * as legacy from './legacyReference'

describe('scale (useScale.ts)', () => {
  const units: ScaleUnit[] = ['mm', 'cm', 'm', 'in']
  it('unitToMm, all units', () => {
    for (const u of units) for (const v of [0, 1, 12.5, 3000]) expect(unitToMm(v, u)).toBe(legacy.unitToMm(v, u))
  })
  const cases: [{ x: number; y: number }, { x: number; y: number }, number, ScaleUnit][] = [
    [{ x: 0, y: 0 }, { x: 100, y: 0 }, 50, 'mm'],
    [{ x: 10, y: 20 }, { x: 13, y: 24 }, 2, 'cm'],
    [{ x: 0, y: 0 }, { x: 0, y: 1234 }, 1.5, 'm'],
    [{ x: 5.5, y: 7.25 }, { x: 900.1, y: 345.6 }, 12, 'in'],
    [{ x: 0, y: 0 }, { x: 0, y: 0 }, 10, 'mm'],
  ]
  it('computeScaleFactor, including coincident points', () => {
    for (const [p1, p2, v, u] of cases) expect(computeScaleFactor(p1, p2, v, u)).toBe(legacy.computeScaleFactor(p1, p2, v, u))
  })
  it('pxToMm', () => {
    for (const [px, f] of [[0, 1], [100, 0.5], [333.3, 0.1234]]) expect(pxToMm(px, f)).toBe(legacy.pxToMm(px, f))
  })
})

describe('clampDimensions (imageNormalize.ts)', () => {
  it('MAX_SIZE', () => expect(MAX_SIZE).toBe(legacy.MAX_SIZE))
  const dims: [number, number, number?][] = [[800, 600], [4096, 4096], [8000, 3000], [3000, 9000], [5000, 5000, 1000]]
  it('clamps like the original (inside, square limit, wide, tall, custom max)', () => {
    for (const [w, h, m] of dims) expect(clampDimensions(w, h, m)).toEqual(legacy.clampDimensions(w, h, m))
  })
})

const LINE_SETS: [string, ContourPoint[], ContourPoint[][], number][] = [
  ['nothing', [], [], 1],
  ['single active', SQUARE, [], 0.25],
  ['active + 2 extra', IRREGULAR, [SQUARE, TRIANGLE_OFFSET], 0.1234567],
  ['short active (<2) + extra', [SQUARE[0]], [TRIANGLE_OFFSET], 2],
  ['extra with 1 point skipped', TRIANGLE_OFFSET, [[SQUARE[1]], IRREGULAR], 1.5],
]

describe('DXF', () => {
  it.each(LINE_SETS)('line-only identical: %s', (_n, active, extra, f) => {
    expect(pointsToDxf(active, f, extra)).toBe(legacy.pointsToDxf(active, f, extra))
  })
  it('layers: extra paths 1..n, active 0', () => {
    const dxf = pointsToDxf(SQUARE, 1, [TRIANGLE_OFFSET, IRREGULAR])
    const layers = [...dxf.matchAll(/POLYLINE\n8\n(\w+)/g)].map((m) => m[1])
    expect(layers).toEqual(['1', '2', '0'])
  })
  it('Y is not flipped (M2 rejected)', () => {
    expect(pointsToDxf(SQUARE, 1)).toContain('20\n80.000000')
  })
  it('bezier segments are exported flattened', () => {
    const f = 0.5
    const flat = flattenContour(MIXED).map((p, i) => ({ id: String(i), x: p.x, y: p.y, type: 'line' as const }))
    expect(pointsToDxf(MIXED, f)).toBe(legacy.pointsToDxf(flat, f))
    expect(flat.length).toBeGreaterThan(MIXED.length)
  })
  it('all-bezier closing segment is flattened too', () => {
    const vertices = (pointsToDxf(ALL_BEZIER, 1).match(/VERTEX/g) ?? []).length
    expect(vertices).toBe(flattenContour(ALL_BEZIER).length)
  })
})

/** Quita viewBox/width/height (M4) para comparar el resto byte a byte. */
const stripBox = (svg: string) => svg.replace(/ viewBox="[^"]*" width="[^"]*" height="[^"]*"/, '')

describe('SVG', () => {
  it.each(LINE_SETS)('line-only identical except viewBox: %s', (_n, active, extra, f) => {
    expect(stripBox(pointsToSvg(active, f, extra))).toBe(stripBox(legacy.pointsToSvg(active, f, extra)))
  })
  it('viewBox goes from min to max (M4)', () => {
    const svg = pointsToSvg(TRIANGLE_OFFSET, 2)
    expect(svg).toContain('viewBox="75.000 24.500 345.200 375.300" width="345.200mm" height="375.300mm"')
  })
  it('bezier segments use the canvas Catmull-Rom C commands, scaled', () => {
    const f = 0.5
    const scaled = MIXED.map((p) => ({ ...p, x: p.x * f, y: p.y * f }))
    const canvasD = buildPath(scaled).replace(/-?\d+(\.\d+)?/g, (n) => Number(n).toFixed(3))
    const d = /d="([^"]*)"/.exec(pointsToSvg(MIXED, f))![1]
    // El canvas cierra con "L x0 y0 Z" en tramo recto; el SVG cierra con "Z" igual que el original.
    expect(d).toBe(canvasD.replace(/ L [\d.-]+ [\d.-]+ Z$/, ' Z'))
    expect(d).toContain(' C ')
  })
  it('all-bezier closing segment is a curve too', () => {
    const d = /d="([^"]*)"/.exec(pointsToSvg(ALL_BEZIER, 1))![1]
    expect(d.match(/ C /g)).toHaveLength(4)
    expect(d.endsWith(' Z')).toBe(true)
  })
})

describe('buildPath (EditorCanvas.tsx)', () => {
  const sets: [string, ContourPoint[], boolean][] = [
    ['empty', [], true],
    ['square closed', SQUARE, true],
    ['square open', SQUARE, false],
    ['mixed closed', MIXED, true],
    ['all bezier open', ALL_BEZIER, false],
  ]
  it.each(sets)('%s', (_n, pts, closed) => {
    expect(buildPath(pts, closed)).toBe(legacy.buildPath(pts, closed))
  })
})

type Call = [string, ...unknown[]]
function recorder() {
  const calls: Call[] = []
  const rec = (name: string) => (...args: unknown[]) => { calls.push([name, ...args]) }
  return { calls, doc: { setDrawColor: rec('setDrawColor'), setLineWidth: rec('setLineWidth'), line: rec('line'), save: rec('save') } }
}

describe('PDF drawing vs legacy', () => {
  it('line-only path with min at 0: identical calls on A4 portrait', () => {
    const a = recorder(); const b = recorder()
    legacy.legacyDrawPdf(a.doc, SQUARE, 1, [])
    const layout = layoutPdf(SQUARE, 1, [])!
    drawPdf(b.doc, layout)
    expect(layout.page.name).toBe('A4')
    expect(b.calls).toEqual(a.calls.filter((c) => c[0] !== 'save'))
  })
  it('several line-only paths: identical calls apart from the translation', () => {
    const f = 0.37
    const a = recorder(); const b = recorder()
    legacy.legacyDrawPdf(a.doc, TRIANGLE_OFFSET, f, [IRREGULAR, [SQUARE[2]]])
    const layout = layoutPdf(TRIANGLE_OFFSET, f, [IRREGULAR, [SQUARE[2]]])!
    drawPdf(b.doc, layout)
    const all = [...IRREGULAR, ...TRIANGLE_OFFSET]
    const minX = Math.min(...all.map((p) => p.x * f)); const minY = Math.min(...all.map((p) => p.y * f))
    const legacyCalls = a.calls.filter((c) => c[0] !== 'save')
    expect(b.calls).toHaveLength(legacyCalls.length)
    b.calls.forEach((c, i) => {
      const l = legacyCalls[i]
      expect(c[0]).toBe(l[0])
      if (c[0] !== 'line') { expect(c).toEqual(l); return }
      const [x1, y1, x2, y2] = c.slice(1) as number[]
      const [lx1, ly1, lx2, ly2] = l.slice(1) as number[]
      expect(x1).toBeCloseTo(lx1 - minX, 9); expect(y1).toBeCloseTo(ly1 - minY, 9)
      expect(x2).toBeCloseTo(lx2 - minX, 9); expect(y2).toBeCloseTo(ly2 - minY, 9)
    })
    expect(Math.min(...b.calls.filter((c) => c[0] === 'line').map((c) => c[1] as number))).toBeCloseTo(PDF_MARGIN, 9)
  })
  it('nothing to draw → null (legacy draws nothing either)', () => {
    const a = recorder()
    legacy.legacyDrawPdf(a.doc, [], 1, [])
    expect(a.calls).toEqual([])
    expect(layoutPdf([], 1, [])).toBeNull()
  })
})

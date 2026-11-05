import { distance, makePoly, openRing, overlaps } from '../logic/geometry'
import type { NestPayload, NestResult, Piece } from '../logic/types'

export const square = (id = 's', size = 10, x = 0): Piece => ({
  id, points: [[x, 0], [x + size, 0], [x + size, size], [x, size], [x, 0]],
})

export const SQUARE: Piece = square('square')

export function job(overrides: Partial<NestPayload> = {}): NestPayload {
  return { width: 22, length: 22, gap: 2, mode: 'auto', quantity: 1, rotation: 'fixed', angle: 0, pieces: [SQUARE], ...overrides }
}

/** Contención en el rectángulo útil, sin solapes y con la separación mínima entre bordes. */
export function expectLayout(result: NestResult, width: number, length: number, gap: number, margin = 0): void {
  const polys = result.placements.map((p) => makePoly(openRing(p.points)))
  polys.forEach((poly, i) => {
    const [a, b, c, d] = poly.bounds
    expect(a).toBeGreaterThanOrEqual(margin - 1e-7)
    expect(b).toBeGreaterThanOrEqual(margin - 1e-7)
    expect(c).toBeLessThanOrEqual(width - margin + 1e-7)
    expect(d).toBeLessThanOrEqual(length - margin + 1e-7)
    for (const other of polys.slice(0, i)) {
      expect(overlaps(poly, other)).toBe(false)
      expect(distance(poly, other) + 1e-6).toBeGreaterThanOrEqual(gap)
    }
  })
  expect(Number.isFinite(result.utilization)).toBe(true)
}

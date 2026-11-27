import { dentClipPath, dentPoints, roundRectPoints } from './dentGeometry'

const W = 120
const H = 44

test('el contorno tiene los puntos pedidos y empieza arriba a la izquierda del tramo recto', () => {
  const pts = roundRectPoints(W, H, 12, 96)
  expect(pts).toHaveLength(96)
  expect(pts[0]).toEqual([12, 0])
  for (const [x, y] of pts) {
    expect(x).toBeGreaterThanOrEqual(-0.001)
    expect(x).toBeLessThanOrEqual(W + 0.001)
    expect(y).toBeGreaterThanOrEqual(-0.001)
    expect(y).toBeLessThanOrEqual(H + 0.001)
  }
})

test('funciona con una pastilla completa (radio = mitad del alto)', () => {
  const pts = roundRectPoints(W, H, H / 2, 64)
  expect(pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true)
})

test('sin profundidad el contorno no cambia', () => {
  const base = roundRectPoints(W, H, 12, 48)
  expect(dentPoints(base, [60, 22], 0, 30)).toEqual(base)
})

test('al hundir, el punto más cercano al dedo se acerca a él y los lejanos casi no se mueven', () => {
  const base = roundRectPoints(W, H, 12, 96)
  const touch: [number, number] = [20, 22]
  const dented = dentPoints(base, touch, 14, 30)
  const dist = (p: readonly [number, number]) => Math.hypot(p[0] - touch[0], p[1] - touch[1])
  const nearest = base.reduce((best, _, i) => (dist(base[i]!) < dist(base[best]!) ? i : best), 0)
  expect(dist(dented[nearest]!)).toBeLessThan(dist(base[nearest]!))
  const farthest = base.reduce((best, _, i) => (dist(base[i]!) > dist(base[best]!) ? i : best), 0)
  expect(Math.abs(dist(dented[farthest]!) - dist(base[farthest]!))).toBeLessThan(0.5)
})

test('una profundidad negativa abomba el borde hacia afuera (vibración)', () => {
  const base = roundRectPoints(W, H, 12, 96)
  const touch: [number, number] = [20, 22]
  const dist = (p: readonly [number, number]) => Math.hypot(p[0] - touch[0], p[1] - touch[1])
  const out = dentPoints(base, touch, -14, 30)
  const nearest = base.reduce((best, _, i) => (dist(base[i]!) < dist(base[best]!) ? i : best), 0)
  expect(dist(out[nearest]!)).toBeGreaterThan(dist(base[nearest]!))
})

test('ningún punto cruza al dedo aunque la profundidad sea enorme', () => {
  const base = roundRectPoints(W, H, 12, 96)
  const touch: [number, number] = [60, 22]
  const dented = dentPoints(base, touch, 500, 40)
  for (let i = 0; i < base.length; i++) {
    const before = Math.hypot(base[i]![0] - touch[0], base[i]![1] - touch[1])
    const after = Math.hypot(dented[i]![0] - touch[0], dented[i]![1] - touch[1])
    expect(after).toBeGreaterThanOrEqual(before * 0.15 - 0.001)
  }
})

test('el recorte conserva la sombra exterior: marco, caja original y contorno hundido', () => {
  const base = roundRectPoints(W, H, 12, 24)
  const clip = dentClipPath(base, dentPoints(base, [20, 22], 10, 30), W, H)
  expect(clip.startsWith('path("M-40 -40')).toBe(true)
  expect(clip.match(/M/g)).toHaveLength(3)
  expect(clip.endsWith('Z")')).toBe(true)
})

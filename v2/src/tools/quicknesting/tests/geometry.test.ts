import { closedCoords, contains, distance, isValidRing, locate, makePoly, openRing, orient, overlaps, rotate, translate } from '../logic/geometry'
import type { Pt } from '../logic/geometry'

const sq = (x: number, y: number, s = 10) => makePoly([[x, y], [x + s, y], [x + s, y + s], [x, y + s]])

describe('geometría base', () => {
  it('quita el punto de cierre y lo devuelve como Shapely', () => {
    const pts = openRing([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]])
    expect(pts).toHaveLength(4)
    expect(closedCoords(pts)).toEqual([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]])
  })

  it('calcula área y límites sin importar el sentido', () => {
    const cw = makePoly([[0, 0], [0, 10], [20, 10], [20, 0]])
    expect(cw.area).toBe(200)
    expect(cw.bounds).toEqual([0, 0, 20, 10])
  })

  it('gira 90° de forma exacta y el ángulo es absoluto, no acumulado', () => {
    const r = makePoly([[0, 0], [20, 0], [20, 10], [0, 10]])
    expect(rotate(r, 90).pts[1]).toEqual([0, 20])
    orient(r, 90)
    expect(orient(r, 30).pts).toEqual(orient(r, 30).pts)
    expect(orient(r, 30).bounds[0]).toBeCloseTo(0, 12)
    expect(orient(r, 30).bounds[1]).toBeCloseTo(0, 12)
  })

  it('solape: separados o tocándose no cuenta; superpuestos sí', () => {
    expect(overlaps(sq(0, 0), sq(12, 0))).toBe(false)
    expect(overlaps(sq(0, 0), sq(10, 0))).toBe(false)
    expect(overlaps(sq(0, 0), sq(10, 10))).toBe(false)
    expect(overlaps(sq(0, 0), sq(10, 3))).toBe(false)
    expect(overlaps(sq(0, 0), sq(5, 5))).toBe(true)
    expect(overlaps(sq(0, 0), sq(0, 0))).toBe(true)
    expect(overlaps(sq(0, 0, 30), sq(0, 0))).toBe(true)
    expect(overlaps(sq(0, 0, 30), sq(10, 10))).toBe(true)
    expect(overlaps(sq(0, 0), sq(9.999, 0))).toBe(true)
  })

  it('solape con piezas giradas y cóncavas', () => {
    const L = makePoly([[0, 0], [20, 0], [20, 7], [7, 7], [7, 20], [0, 20]])
    expect(overlaps(L, sq(8, 8, 5))).toBe(false)
    expect(overlaps(L, sq(7, 7, 5))).toBe(false)
    expect(overlaps(L, sq(6, 8, 5))).toBe(true)
    const a = translate(orient(sq(0, 0), 30), 0, 0)
    expect(overlaps(a, translate(a, a.bounds[2] - a.bounds[0], 0))).toBe(false)
    expect(overlaps(a, translate(a, 1, 0))).toBe(true)
  })

  it('distancia entre bordes, no entre centros', () => {
    expect(distance(sq(0, 0), sq(12, 0))).toBeCloseTo(2, 12)
    expect(distance(sq(0, 0), sq(10, 0))).toBe(0)
    expect(distance(sq(0, 0), sq(13, 14))).toBeCloseTo(5, 12)
  })

  it('contención: dentro, igual, cruzado y en el hueco de una L', () => {
    expect(contains(sq(0, 0, 30), sq(5, 5))).toBe(true)
    expect(contains(sq(0, 0), sq(0, 0))).toBe(true)
    expect(contains(sq(0, 0, 30), sq(25, 25))).toBe(false)
    const L = makePoly([[0, 0], [20, 0], [20, 7], [7, 7], [7, 20], [0, 20]])
    expect(contains(L, sq(8, 8, 5))).toBe(false)
    expect(contains(L, sq(1, 1, 5))).toBe(true)
  })

  it('ubica un punto dentro, en el borde o fuera', () => {
    const s = sq(0, 0).pts
    expect(locate([5, 5], s)).toBe(1)
    expect(locate([10, 5], s)).toBe(0)
    expect(locate([11, 5], s)).toBe(-1)
  })

  it('valida polígonos simples y rechaza cruces y espigas', () => {
    expect(isValidRing(sq(0, 0).pts)).toBe(true)
    expect(isValidRing([[0, 0], [10, 0], [10, 0], [10, 10], [0, 10]])).toBe(true)
    expect(isValidRing([[0, 0], [1, 1], [0, 1], [1, 0]])).toBe(false)
    expect(isValidRing([[0, 0], [10, 0], [5, 0], [5, 5]])).toBe(false)
    expect(isValidRing([[0, 0], [10, 0], [10, 10], [0, 10], [10, 5]])).toBe(false)
    expect(isValidRing([[0, 0], [1, 1]] as Pt[])).toBe(false)
    expect(isValidRing([[0, 0], [10, 0], [NaN, 5]])).toBe(false)
  })
})

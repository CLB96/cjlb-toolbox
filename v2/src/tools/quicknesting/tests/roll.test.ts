// Port de Quick-Nesting-Entrega/tests/test_roll_plans.py.
import { nest } from '../logic/roll'
import { InputError } from '../logic/types'
import type { NestPayload, NestResult } from '../logic/types'
import { expectLayout, job, square } from './helpers'

const plain = () => job({ pieces: [square()] })

function expectExact(result: NestResult, expected: Record<string, number>) {
  const plan = result.plyPlan!
  const totals: Record<string, number> = {}
  for (const g of plan.groups) {
    expectLayout(g, g.width!, g.length!, result.gap, g.margin ?? 0)
    if (g.kind === 'partial') expect(g.layers).toBe(1)
    for (const p of g.placements) totals[p.id] = (totals[p.id] ?? 0) + g.layers
  }
  expect(totals).toEqual(expected)
  expect(plan.totalPieces).toBe(Object.values(expected).reduce((s, n) => s + n, 0))
  expect(plan.missing).toBe(0)
  expect(plan.complete).toBe(true)
  expect(plan.totalLayers).toBe(plan.groups.reduce((s, g) => s + g.layers, 0))
}

describe('margen y planes de capas', () => {
  it('el margen es opcional y distinto de la separación entre cortes', () => {
    expect(nest(plain()).count).toBe(4)
    const result = nest({ ...plain(), margin: 1 })
    expect([result.count, result.width, result.length, result.usableWidth]).toEqual([1, 22, 22, 20])
    expectLayout(result, 22, 22, 2, 1)
  })

  it('2000 × 2000 mm con 10 mm por lado deja 1980 × 1980 útiles', () => {
    const result = nest(job({ width: 2000, length: 2000, margin: 10, gap: 0, pieces: [square('s', 1980)] }))
    expect([result.count, result.usableWidth, result.usableLength]).toEqual([1, 1980, 1980])
    expect(result.utilization).toBeCloseTo(98.01, 7)
    expectLayout(result, 2000, 2000, 0, 10)
  })

  it('el largo manual incluye los márgenes de ambos extremos', () => {
    const result = nest({ ...plain(), mode: 'manual', quantity: 5, margin: 1 })
    expect([result.count, result.width, result.length]).toEqual([5, 22, 60])
    expectLayout(result, 22, 60, 2, 1)
  })

  it('rechaza márgenes inválidos o que dejan sin área útil', () => {
    for (const margin of [-1, NaN, true, 11, 100]) {
      expect(() => nest({ ...plain(), margin: margin as number })).toThrow(InputError)
    }
  })

  it('varias capas: cinco piezas = una capa de cuatro y una parcial de una', () => {
    const result = nest({ ...plain(), mode: 'manual', quantity: 5, plyMode: 'total', plyLength: 22 })
    const plan = result.plyPlan!
    expect([plan.fullLayers, plan.partialLayers, plan.totalLength]).toEqual([1, 1, 44])
    expect(plan.groups.map((g) => g.count)).toEqual([4, 1])
    expect(plan.groups.map((g) => g.kind)).toEqual(['full', 'partial'])
    expectExact(result, { s: 5 })
  })

  it('múltiplo exacto, menos de una capa y pedidos grandes con plantillas repetidas', () => {
    for (const [quantity, full, partial] of [[8, 2, 0], [3, 0, 1], [1000, 250, 0]]) {
      const result = nest({ ...plain(), mode: 'manual', quantity, plyMode: 'total', plyLength: 22 })
      expect(result.plyPlan!.fullLayers).toBe(full)
      expect(result.plyPlan!.partialLayers).toBe(partial)
      expect(result.plyPlan!.groups.length).toBeLessThanOrEqual(2)
      expectExact(result, { s: quantity })
    }
  })

  it('varias capas con margen y dos patrones', () => {
    const result = nest(job({ width: 24, mode: 'manual', quantity: 3, margin: 1, pieces: [square('a'), square('b', 10, 30)], plyMode: 'total', plyLength: 24 }))
    expectExact(result, { a: 3, b: 3 })
  })

  it('el margen se respeta con cada rotación y cada base de cantidad', () => {
    for (const rotation of ['fixed', 'free', 'independent'] as const) {
      for (const basis of ['auto', 'per_ply', 'total']) {
        let payload: NestPayload = { ...plain(), width: 24, length: 24, margin: 1, gap: 2, rotation, angle: 17, mode: basis === 'auto' ? 'auto' : 'manual', quantity: 3 }
        if (basis === 'total') payload = { ...payload, plyMode: 'total', plyLength: 24 }
        const result = nest(payload)
        expect(result.count, `${rotation} ${basis}`).toBeGreaterThan(0)
        expectLayout(result, result.width!, result.length!, 2, 1)
        if (basis === 'total') expectExact(result, { s: 3 })
      }
    }
  })

  it('patrones que no caben juntos van en grupos de corte separados', () => {
    const result = nest(job({ mode: 'manual', quantity: 2, pieces: [square('a', 20), square('b', 20, 30)], plyMode: 'total', plyLength: 22 }))
    expect(result.plyPlan!.separatePatterns).toBe(true)
    expect(result.plyPlan!.totalLayers).toBe(4)
    expectExact(result, { a: 2, b: 2 })
  })

  it('sin espacio o sin tiempo nunca inventa la producción completa', () => {
    const payload: NestPayload = { ...plain(), width: 5, mode: 'manual', quantity: 5, plyMode: 'total', plyLength: 22 }
    let result = nest(payload)
    expect([result.plyPlan!.complete, result.missing, result.status]).toEqual([false, 5, 'no_fit'])
    result = nest({ ...payload, width: 22 }, { maxSeconds: 0 })
    expect([result.status, result.missing, result.plyPlan!.complete]).toEqual(['time_limit', 5, false])
  })

  it('varias capas exige manual y un largo fijo válido', () => {
    const base: NestPayload = { ...plain(), mode: 'manual', quantity: 5, plyMode: 'total', plyLength: 22 }
    for (const changes of [{ mode: 'auto' }, { plyLength: undefined }, { plyLength: 0 }, { margin: 11 }]) {
      expect(() => nest({ ...base, ...changes } as NestPayload), JSON.stringify(changes)).toThrow(InputError)
    }
  })

  describe('automático con huecos y misma cantidad de cada patrón', () => {
    const big = { id: 'big', points: [[0, 0], [50, 0], [50, 50], [0, 50]] }
    const small = { id: 'small', points: [[60, 0], [65, 0], [65, 5], [60, 5]] }
    const base: NestPayload = { ...job(), width: 110, length: 110, gap: 2, rotation: 'independent', pieces: [small, big] }
    const counts = (r: NestResult) => r.placements.reduce<Record<string, number>>((m, p) => ({ ...m, [p.id]: (m[p.id] ?? 0) + 1 }), {})

    it('marcada: el mayor número igual de cada patrón que cabe junto', () => {
      const result = nest({ ...base, balanced: true })
      expect(counts(result)).toEqual({ big: 4, small: 4 })
      expect(result.balancedCopies).toBe(4)
      expect(result.status).toBe('filled')
      expectLayout(result, 110, 110, 2)
    })

    it('sin marcar: el mayor primero y los demás en los huecos, como antes', () => {
      const result = nest(base)
      expect(counts(result).big).toBe(4)
      expect(counts(result).small).toBeGreaterThan(4)
      expect(result.balancedCopies).toBeUndefined()
    })

    it('respeta el margen y devuelve las medidas físicas', () => {
      const result = nest({ ...base, balanced: true, margin: 5, width: 120, length: 120 })
      expect([result.width, result.length, result.usableWidth]).toEqual([120, 120, 110])
      expect(counts(result)).toEqual({ big: 4, small: 4 })
      expectLayout(result, 120, 120, 2, 5)
    })

    it('si no cabe ni una de cada, no inventa piezas', () => {
      const result = nest({ ...base, balanced: true, width: 40, length: 40 })
      expect([result.count, result.status]).toEqual([0, 'no_fit'])
    })
  })

  it('sin margen y por capa, el resultado no lleva campos de margen', () => {
    const result = nest(plain())
    expect(result.margin).toBeUndefined()
    expect(result.plyPlan).toBeUndefined()
  })
})

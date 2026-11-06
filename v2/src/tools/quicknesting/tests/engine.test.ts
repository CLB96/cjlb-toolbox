// Port de Quick-Nesting-Entrega/tests/test_engine.py y test_spacing_matrix.py.
import { nest } from '../logic/roll'
import { InputError } from '../logic/types'
import type { NestPayload, Piece } from '../logic/types'
import { expectLayout, job } from './helpers'

const panel = (w: number, h: number): Piece => ({ id: 'panel', points: [[0, 0], [w, 0], [w, h], [0, h], [0, 0]] })

describe('motor de acomodo', () => {
  it('automático: cuatro cuadrados de 10 mm en 22 × 22 con 2 mm entre paredes', () => {
    const result = nest(job())
    expect(result.count).toBe(4)
    expect(result.usedArea).toBeCloseTo(400, 7)
    expect(result.status).toBe('filled')
    expectLayout(result, 22, 22, 2)
  })

  it('la separación cambia la capacidad y 0 es válida', () => {
    expect(nest(job({ width: 20, length: 20, gap: 0 })).count).toBe(4)
    const result = nest(job({ width: 20, length: 20, gap: 1 }))
    expect(result.count).toBe(1)
    expectLayout(result, 20, 20, 1)
  })

  it('manual: cantidad pedida y largo calculado de 46 mm para ocho', () => {
    let result = nest(job({ mode: 'manual', quantity: 3 }))
    expect(result.count).toBe(3)
    expect(result.status).toBe('request_fulfilled')
    result = nest(job({ mode: 'manual', quantity: 8 }))
    expect(result.count).toBe(8)
    expect(result.missing).toBe(0)
    expect(result.status).toBe('request_fulfilled')
    expect(result.length).toBeCloseTo(46, 7)
    expectLayout(result, 22, result.length!, 2)
  })

  it('manual: el largo se calcula (34 mm para cinco), no lo limita el largo escrito', () => {
    for (const incoming of [null, 1, 100000]) {
      const result = nest(job({ mode: 'manual', quantity: 5, width: 22, length: incoming }))
      expect(result.count).toBe(5)
      expect(result.length).toBeCloseTo(34, 7)
      expect(result.utilization).toBeCloseTo((100 * 500) / (22 * 34), 7)
      expect(result.unusedArea).toBeCloseTo(22 * 34 - 500, 7)
      expectLayout(result, 22, result.length!, 2)
    }
  })

  it('manual: demasiado ancho o tope de piezas se informan explícitamente', () => {
    let result = nest(job({ mode: 'manual', quantity: 5, width: 5 }))
    expect([result.count, result.missing, result.length, result.status]).toEqual([0, 5, 0, 'no_fit'])
    result = nest(job({ mode: 'manual', quantity: 5 }), { maxPieces: 3 })
    expect([result.count, result.missing, result.lengthIsPartial, result.status]).toEqual([3, 2, true, 'piece_limit'])
  })

  it('ángulo fijo absoluto y personalizado', () => {
    const result = nest(job({ width: 50, length: 50, angle: 22.5, mode: 'manual', quantity: 2 }))
    expect(result.placements.every((p) => p.angle === 22.5)).toBe(true)
    expectLayout(result, 50, result.length!, 2)
    expect(nest(job({ angle: -270 })).placements[0].angle).toBe(90)
  })

  it('el permiso de rotar cambia si cabe', () => {
    const r: Piece = { id: 'r', points: [[0, 0], [20, 0], [20, 10], [0, 10], [0, 0]] }
    expect(nest(job({ width: 10, length: 20, pieces: [r], gap: 0 })).count).toBe(0)
    const result = nest(job({ width: 10, length: 20, pieces: [r], gap: 0, rotation: 'free' }))
    expect(result.count).toBe(1)
    expectLayout(result, 10, 20, 0)
  })

  it('piezas irregulares giradas conservan la separación', () => {
    const L: Piece = { id: 'L', points: [[0, 0], [20, 0], [20, 7], [7, 7], [7, 20], [0, 20], [0, 0]] }
    const result = nest(job({ width: 90, length: 80, gap: 3.5, rotation: 'free', mode: 'manual', quantity: 6, pieces: [L] }))
    expect(result.count).toBeGreaterThan(0)
    expectLayout(result, 90, result.length!, 3.5)
  })

  it('rechaza parámetros y polígonos inválidos', () => {
    const bad: [keyof NestPayload, unknown][] = [
      ['gap', -1], ['width', NaN], ['length', 0], ['quantity', 1.5], ['mode', 'unknown'], ['rotation', 'ignore'],
      ['pieces', []], ['pieces', [{ id: 'x', points: [[0, 0], [1, 1], [0, 1], [1, 0]] }]],
    ]
    for (const [key, value] of bad) {
      expect(() => nest({ ...job(), [key]: value } as NestPayload), String(key)).toThrow(InputError)
    }
  })

  it('rechaza contornos anidados y modo automático con dos patrones', () => {
    const big: Piece = { id: 'big', points: [[0, 0], [30, 0], [30, 30], [0, 30]] }
    expect(() => nest(job({ mode: 'manual', width: 100, pieces: [big, { id: 'in', points: [[5, 5], [10, 5], [10, 10], [5, 10]] }] })))
      .toThrow('nested_selection')
    expect(() => nest(job({ pieces: [big, { id: 'b', points: [[40, 0], [50, 0], [50, 10]] }] }))).toThrow('auto_one_pattern')
  })

  it('automático con rotación independiente: varios patrones, el grande primero y el pequeño en los huecos', () => {
    const big: Piece = { id: 'big', points: [[0, 0], [50, 0], [50, 50], [0, 50]] }
    const small: Piece = { id: 'small', points: [[60, 0], [65, 0], [65, 5], [60, 5]] }
    const result = nest(job({ width: 110, length: 110, gap: 2, rotation: 'independent', pieces: [small, big] }))
    const count = (id: string) => result.placements.filter((p) => p.id === id).length
    expect(count('big')).toBe(4)
    expect(count('small')).toBeGreaterThan(0)
    expect(result.placements[0].id).toBe('big')
    expectLayout(result, 110, 110, 2)
    // Fijo o libre siguen exigiendo un solo patrón, como el original.
    expect(() => nest(job({ rotation: 'free', pieces: [small, big] }))).toThrow('auto_one_pattern')
  })

  it('el tope de piezas se declara, no se informa como lleno', () => {
    const result = nest(job({ width: 1000, length: 1000, gap: 0 }), { maxPieces: 5 })
    expect(result.count).toBe(5)
    expect(result.status).toBe('piece_limit')
  })

  it('rotación independiente llena la franja sobrante', () => {
    expect(nest(job({ width: 104, length: 102, gap: 2, pieces: [panel(40, 60)] })).count).toBe(2)
    const result = nest(job({ width: 104, length: 102, gap: 2, pieces: [panel(40, 60)], rotation: 'independent' }))
    expect(result.count).toBe(3)
    expect(new Set(result.placements.map((p) => p.angle)).size).toBeGreaterThan(1)
    expectLayout(result, 104, 102, 2)
  })

  it('rotación independiente en manual: cantidad y separación', () => {
    const base = job({ width: 102, length: 104, gap: 2, rotation: 'independent', mode: 'manual', quantity: 3, pieces: [panel(60, 40)] })
    let result = nest(base)
    expect([result.count, result.missing, result.status]).toEqual([3, 0, 'request_fulfilled'])
    expectLayout(result, 102, result.length!, 2)
    result = nest({ ...base, gap: 5, quantity: 8 })
    expect(result.missing).toBe(8 - result.count)
    expectLayout(result, 102, result.length!, 5)
  })

  it('los límites de rotación independiente se declaran', () => {
    const payload = job({ width: 100, length: 100, rotation: 'independent' })
    expect(nest(payload, { maxPieces: 3 }).status).toBe('piece_limit')
    const result = nest(payload, { maxSeconds: 0 })
    expect(result.status).toBe('time_limit')
    expect(result.count).toBe(0)
  })

  it('matriz de separación: 180 combinaciones respetan bordes, ángulo y faltantes', () => {
    const shapes = [[[0, 0], [10, 0], [10, 10], [0, 10]], [[0, 0], [12, 0], [12, 4], [4, 4], [4, 12], [0, 12]]]
    let cases = 0
    for (const points of shapes) {
      for (const gap of [0, 0.5, 2, 5, 9]) for (const angle of [0, 30, 22.5]) {
        for (const mode of ['auto', 'manual'] as const) for (const rotation of ['fixed', 'free', 'independent'] as const) {
          const result = nest({ width: 25, length: 25, gap, angle, mode, rotation, quantity: 3, pieces: [{ id: 'c1', points }] })
          expectLayout(result, 25, mode === 'manual' ? result.length! : 25, gap)
          if (rotation === 'fixed') expect(result.placements.every((p) => p.angle === angle)).toBe(true)
          if (mode === 'manual') expect(result.missing).toBe(3 - result.count)
          cases += 1
        }
      }
    }
    expect(cases).toBe(180)
  })
})

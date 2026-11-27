import { describe, expect, it } from 'vitest'
import type { ContourPoint } from '../types'
import { insertPointOnContour } from './insertPoint'

const sq: ContourPoint[] = [
  { id: 'a', x: 0, y: 0, type: 'line' },
  { id: 'b', x: 100, y: 0, type: 'line' },
  { id: 'c', x: 100, y: 100, type: 'line' },
  { id: 'd', x: 0, y: 100, type: 'line' },
]

describe('insertar punto en el contorno', () => {
  it('lo mete en el tramo más cercano, apoyado sobre la línea', () => {
    const out = insertPointOnContour(sq, 100 - 0, 40, 'n')
    expect(out.map((p) => p.id)).toEqual(['a', 'b', 'n', 'c', 'd'])
    expect(out[2]).toMatchObject({ x: 100, y: 40 })
    const off = insertPointOnContour(sq, 130, 60, 'n')
    expect(off[2]).toMatchObject({ x: 100, y: 60 })
  })

  it('en el tramo de cierre queda al final, entre el último y el primero', () => {
    const out = insertPointOnContour(sq, -20, 50, 'n')
    expect(out.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd', 'n'])
    expect(out[4]).toMatchObject({ x: 0, y: 50 })
  })

  it('no modifica el contorno original', () => {
    insertPointOnContour(sq, 50, -10, 'n')
    expect(sq).toHaveLength(4)
  })

  it('con solo 2 puntos agrega al final donde se hizo clic, para poder armar una figura', () => {
    const out = insertPointOnContour(sq.slice(0, 2), 50, 80, 'n')
    expect(out.map((p) => p.id)).toEqual(['a', 'b', 'n'])
    expect(out[2]).toMatchObject({ x: 50, y: 80 })
  })

  it('sin tramos agrega al final', () => {
    expect(insertPointOnContour([], 5, 6, 'n')).toEqual([{ id: 'n', x: 5, y: 6, type: 'line' }])
  })
})

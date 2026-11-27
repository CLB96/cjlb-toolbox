import { describe, expect, it } from 'vitest'
import type { ContourPoint, Notch } from '../types'
import { notchAngleToward, notchGeometry } from './notches'

const sq: ContourPoint[] = [
  { id: 'a', x: 0, y: 0, type: 'line' },
  { id: 'b', x: 100, y: 0, type: 'line' },
  { id: 'c', x: 100, y: 100, type: 'line' },
  { id: 'd', x: 0, y: 100, type: 'line' },
]
const notch: Notch = { id: 'n', x: 50, y: 0, type: 'I', depth: 10, flipped: false }

describe('notch girado', () => {
  it('sin ángulo es perpendicular al contorno', () => {
    const g = notchGeometry(notch, sq, 1)!
    expect(g.tip.x).toBeCloseTo(50)
    expect(Math.abs(g.tip.y)).toBeCloseTo(10)
  })

  it('con ángulo la base no se mueve y la punta gira', () => {
    const g0 = notchGeometry(notch, sq, 1)!
    const g = notchGeometry({ ...notch, angle: 90 }, sq, 1)!
    expect(g.base).toEqual(g0.base)
    expect(Math.abs(g.tip.x - 50)).toBeCloseTo(10)
    expect(g.tip.y).toBeCloseTo(0)
  })

  it('el ángulo hacia un punto hace que la punta apunte a él' , () => {
    const inside = { x: 60, y: 10 }
    const angle = notchAngleToward(notch, sq, inside.x, inside.y)!
    const g = notchGeometry({ ...notch, angle }, sq, 1)!
    expect(Math.abs(angle)).toBeCloseTo(45)
    expect(g.tip.x - 50).toBeCloseTo(Math.sign(inside.x - 50) * Math.abs(g.tip.x - 50))
    expect(g.tip.y).toBeGreaterThan(0)
  })
})

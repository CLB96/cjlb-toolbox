import { describe, expect, it } from 'vitest'
import { clampDiameter, DEFAULT_DRILL_DIAMETER, diameterToRadius, drillPolyline, drillRadiusPx, formatMm, newDrill, radiusToDiameter } from './drills'
import { notchPolylines } from './notchExport'

describe('drills', () => {
  it('el drill nuevo mide 3 mm', () => {
    expect(newDrill(10, 20).diameter).toBe(3)
    expect(DEFAULT_DRILL_DIAMETER).toBe(3)
  })

  it('diámetro y radio se calculan uno del otro', () => {
    expect(diameterToRadius(3)).toBe(1.5)
    expect(radiusToDiameter(2.5)).toBe(5)
    expect(formatMm(1 / 3)).toBe('0.333')
    expect(formatMm(1.5)).toBe('1.5')
  })

  it('un diámetro inválido vuelve al de por defecto y el máximo es 100', () => {
    expect(clampDiameter('')).toBe(3)
    expect(clampDiameter(0)).toBe(3)
    expect(clampDiameter(-4)).toBe(3)
    expect(clampDiameter('abc')).toBe(3)
    expect(clampDiameter('6')).toBe(6)
    expect(clampDiameter(500)).toBe(100)
  })

  it('el círculo tiene el radio de la escala (mm/px)', () => {
    const d = { id: 'a', x: 100, y: 50, diameter: 4 }
    expect(drillRadiusPx(d, 0.5)).toBe(4)
    const { points, closed } = drillPolyline(d, 0.5)
    expect(closed).toBe(true)
    for (const p of points) expect(Math.hypot(p.x - 100, p.y - 50)).toBeCloseTo(4)
  })

  it('los drills salen en la capa de marcas junto a los notches', () => {
    const piece = { contourPoints: [], notches: [], drills: [{ id: 'a', x: 5, y: 5, diameter: 3 }] }
    expect(notchPolylines(piece, 1)).toHaveLength(1)
    expect(notchPolylines({ ...piece, drills: undefined }, 1)).toHaveLength(0)
  })
})

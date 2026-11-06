// Pieza curva de ~793 × 353 mm como la del DXF real del usuario: la rotación independiente
// debe terminar su búsqueda dentro del tiempo y aprovechar la franja libre del rollo.
import { importDxf } from '../logic/importer'
import { nest } from '../logic/roll'
import { drawing, lwpolyline } from './dxfBuilder'
import { expectLayout } from './helpers'

function curvedPiece() {
  const pts = [[0, 0, 0], [420, 0, 0.25], [793, 90, 0], [793, 150, -0.6], [640, 210, 0], [520, 353, 0.35],
    [230, 353, 0], [150, 230, -0.4], [40, 180, 0.3], [0, 90, 0]]
  return importDxf(drawing([lwpolyline(pts, true)])).contours[0]
}

describe('velocidad del acomodo', () => {
  it('rotación independiente con una pieza curva termina sin agotar el tiempo', () => {
    const c = curvedPiece()
    const result = nest({ width: 1510, length: 2535, margin: 10, gap: 3, mode: 'auto', quantity: 1,
      rotation: 'independent', angle: 0, pieces: [{ id: 'c2', points: c.points }] })
    expect(result.status).not.toBe('time_limit')
    expect(result.count).toBeGreaterThanOrEqual(12)
    expect(result.status).toBe('filled')
    expect(new Set(result.placements.map((p) => p.angle)).size).toBeGreaterThan(1)
    expectLayout(result, 1510, 2535, 3, 10)
  }, 30000)
})

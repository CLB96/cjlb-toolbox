// Pruebas con el DXF real del usuario (legacy-fixtures/private, fuera de git). Sin él, se omiten.
import { existsSync, readFileSync } from 'node:fs'
import { importDxf } from '../logic/importer'
import { nest } from '../logic/roll'
import { expectLayout } from './helpers'

const FILE = 'legacy-fixtures/private/FRT DOOR MID BOLSTER UP C1YB.01-2.dxf'
const real = existsSync(FILE)
if (!real) console.warn(`[realDxf.test] falta ${FILE}: se omiten pruebas reales`)

const load = () => importDxf(new Uint8Array(readFileSync(FILE)))

describe('DXF real FRT DOOR MID BOLSTER', () => {
  it.skipIf(!real)('se lee igual que el original: dos contornos en la capa 1 con sus medidas y áreas', () => {
    const r = load()
    const cut = r.contours.filter((c) => c.layer === '1')
    expect(cut).toHaveLength(2)
    expect(cut.map((c) => [c.bounds[0].toFixed(2), c.bounds[1].toFixed(2), c.area.toFixed(2)])).toEqual([
      ['197.81', '276.67', '41664.93'], ['793.36', '352.99', '114889.79'],
    ])
  })

  it.skipIf(!real)('misma cantidad de cada patrón: no se queda en 1 por agotar el tiempo', () => {
    const pieces = load().contours.filter((c) => c.layer === '1').map(({ id, points }) => ({ id, points }))
    const result = nest({ width: 1450, length: 2500, gap: 3, mode: 'auto', rotation: 'independent', angle: 0, balanced: true, pieces })
    expect(result.balancedCopies).toBeGreaterThanOrEqual(4)
    const ids = result.placements.map((p) => p.id)
    expect(ids.filter((i) => i === 'c1').length).toBe(ids.filter((i) => i === 'c2').length)
    expectLayout(result, 1450, 2500, 3)
  }, 30000)
})

import { FIXTURES } from '../../../../legacy-fixtures/gapcheck/fixtures'
import { loadRealRows } from '../../../../legacy-fixtures/gapcheck/realFixture'
import { createGapcheckStore, selectKpis, type GapcheckApi } from '../store'
import { PALETTE_SOLID } from '../logic/chartStyle'
import { buildExportModel, exportFileName } from './exportModel'

const NOW = new Date('2026-10-30T12:34:56Z')

let api: GapcheckApi
beforeEach(() => {
  api = createGapcheckStore()
})

const real = loadRealRows()
if (!real) console.warn('[exportModel.test] falta legacy-fixtures/private/gapcheck-real.xlsx: se omiten pruebas reales')

describe('buildExportModel', () => {
  it('sin datos devuelve null (la UI avisa "No hay datos para exportar.")', () => {
    expect(buildExportModel(api.getState(), 'es', NOW)).toBeNull()
  })

  it.skipIf(!real)('Excel real en ES: título, fecha, tarjetas y bloque objetivo del export original', () => {
    api.getState().loadRows('real.xlsx', real as unknown[][])
    const s = api.getState()
    const k = selectKpis(s)
    const m = buildExportModel(s, 'es', NOW)!
    expect(m.title).toBe('Gapcheck Análisis')
    expect(m.dateLine).toBe(NOW.toLocaleString() + '   •   Covering: Hard Covering')
    expect(m.cards).toEqual([
      { badge: 'PTS', value: '20', sub: 'Puntos Medidos' },
      { badge: 'OK', value: k.meeting, sub: 'Cumplen Objetivo' },
      { badge: 'AVG', value: k.avg, sub: 'Promedio Global' },
      { badge: 'MIN', value: k.min, sub: 'Valor más bajo' },
      { badge: 'MAX', value: k.max, sub: 'Valor más alto' },
    ])
    expect(m.target).toEqual({ label: 'GAPCHECK OBJETIVO', value: '5.00 mm' })
    expect(m.fileName).toBe('Gapcheck-Export-2026-10-30.png')
  })

  it('fixture sintética en EN: textos EN del export original (Measured Pts) y valores exactos', () => {
    api.getState().loadRows('a.xlsx', FIXTURES.header)
    api.getState().setCovering('soft')
    api.getState().applyComparison()
    const m = buildExportModel(api.getState(), 'en', NOW)!
    expect(m.title).toBe('Gapcheck Analysis')
    expect(m.dateLine).toBe(NOW.toLocaleString() + '   •   Covering: Soft Covering')
    expect(m.cards).toEqual([
      { badge: 'PTS', value: '4', sub: 'Measured Pts' },
      { badge: 'OK', value: '11 / 11', sub: 'Meeting Target' },
      { badge: 'AVG', value: '3.46', sub: 'Global Average' },
      { badge: 'MIN', value: '1.5', sub: 'Lowest Value' },
      { badge: 'MAX', value: '9', sub: 'Highest Value' },
    ])
    expect(m.target).toEqual({
      label: 'GAPCHECK TARGET',
      value: api.getState().appliedTarget.toFixed(2) + ' mm',
    })
  })

  it('el objetivo es el aplicado, no el que se está escribiendo', () => {
    api.getState().loadRows('a.xlsx', FIXTURES.header)
    api.getState().setInput('skin', '20')
    expect(buildExportModel(api.getState(), 'es', NOW)!.target.value).toBe('5.00 mm')
  })

  it('solo exporta marcadores de puntos visibles, con color PALETTE_SOLID y nombre del punto', () => {
    api.getState().loadRows('a.xlsx', FIXTURES.header)
    api.getState().setLayoutImage(new Blob(['x']), 'img.png')
    api.getState().moveMarker(3, 12.5, 80)
    api.getState().togglePoint(1)
    const s = api.getState()
    const m = buildExportModel(s, 'es', NOW)!
    expect(m.markers.map((x) => x.pointIndex)).toEqual([0, 2, 3])
    expect(m.markers[2]).toEqual({
      pointIndex: 3,
      x: 12.5,
      y: 80,
      color: PALETTE_SOLID[3],
      label: s.points[3].name,
    })
    expect(m.markerSize).toBe(s.layout.markerSize)
    expect(m.hasLayout).toBe(true)
  })

  it('sin imagen de layout no hay marcadores', () => {
    api.getState().loadRows('a.xlsx', FIXTURES.header)
    const m = buildExportModel(api.getState(), 'es', NOW)!
    expect(m.hasLayout).toBe(false)
    expect(m.markers).toEqual([])
  })
})

describe('exportFileName', () => {
  it('usa la fecha UTC de toISOString', () => {
    expect(exportFileName(new Date('2026-10-30T23:59:59Z'))).toBe('Gapcheck-Export-2026-10-30.png')
  })
})

// Port de Quick-Nesting-Entrega/tests/test_importer.py, más entidades que antes solo cubría ezdxf.
import { importDxf } from '../logic/importer'
import { InputError } from '../logic/types'
import { arc, circle, drawing, ellipse, insert, line, lwpolyline, polyline, spline } from './dxfBuilder'

const codes = (r: { diagnostics: { code: string }[] }) => r.diagnostics.map((d) => d.code)
const box = (x: number, y: number, s: number, layer = '0') => lwpolyline([[x, y], [x + s, y], [x + s, y + s], [x, y + s]], true, layer)

describe('lector DXF', () => {
  it('polilínea cerrada: conserva el abultamiento y las unidades', () => {
    const r = importDxf(drawing([lwpolyline([[0, 0, 1], [10, 0], [10, 10], [0, 10]], true)], 1))
    expect(r.unitMm).toBe(25.4)
    expect(r.contours).toHaveLength(1)
    expect(r.contours[0].points.length).toBeGreaterThan(5)
    expect(r.contours[0].bounds[0]).toBeCloseTo(254, 3)
  })

  it('línea + arco forman un ciclo; la línea abierta y el círculo se informan aparte', () => {
    const r = importDxf(drawing([
      line([0, 0], [10, 0]), arc([10, 5], 5, -90, 90), line([10, 10], [0, 10]), line([0, 10], [0, 0]),
      line([100, 100], [101, 100]), circle([5, 5], 1),
    ]))
    expect(r.contours).toHaveLength(1)
    expect(codes(r)).toContain('open_or_branched')
    expect(codes(r)).toContain('circles_excluded')
  })

  it('no une capas distintas ni cierra huecos', () => {
    const r = importDxf(drawing([
      line([0, 0], [10, 0], 'cut'), line([10, 0], [10, 10], 'mark'), line([10, 10], [0, 10], 'cut'), line([0, 10], [0, 1], 'cut'),
    ]))
    expect(r.contours).toEqual([])
  })

  it('un polígono que se cruza no se repara ni se acepta', () => {
    const r = importDxf(drawing([lwpolyline([[0, 0], [10, 10], [0, 10], [10, 0]], true)]))
    expect(r.contours).toEqual([])
    expect(codes(r)).toContain('invalid_contour')
  })

  it('un trazo degenerado no impide leer los demás contornos', () => {
    const r = importDxf(drawing([line([5, 5], [5, 5]), lwpolyline([[0, 0], [1, 0]], true), box(10, 0, 10)]))
    expect(r.contours).toHaveLength(1)
    expect(codes(r)).toContain('invalid_contour')
  })

  it('unidades desconocidas exigen elegir una escala', () => {
    const data = drawing([lwpolyline([[0, 0], [1, 0], [1, 1], [0, 1]], true)], 0)
    expect(importDxf(data).requiresUnitOverride).toBe(true)
    const override = importDxf(data, 10)
    expect(override.requiresUnitOverride).toBe(false)
    expect(override.contours[0].area).toBeCloseTo(100, 9)
    expect(() => importDxf(data, 0)).toThrow('invalid_unit_scale')
  })

  it('rechaza DXF binario, texto que no es DXF y archivos vacíos', () => {
    for (const content of ['not a DXF', 'AutoCAD Binary DXF\r\n\u001a\u0000', '']) {
      expect(() => importDxf(new TextEncoder().encode(content))).toThrow(InputError)
    }
  })

  it('saltos de línea de Windows y datos extendidos', () => {
    const extra = [1001, 'TEST', 1004, '00FF']
    const crlf = new TextDecoder().decode(drawing([lwpolyline([[0, 0], [10, 0], [10, 10], [0, 10]], true, '0', extra)])).replace(/\n/g, '\r\n')
    expect(importDxf(new TextEncoder().encode(crlf)).contours).toHaveLength(1)
  })

  it('marca contornos contenidos en otro y añade los avisos de revisión', () => {
    const r = importDxf(drawing([box(0, 0, 100), box(10, 10, 20)]))
    expect(r.contours.map((c) => [c.id, c.nested])).toEqual([['c1', false], ['c2', true]])
    expect(codes(r).slice(-2)).toEqual(['review_scale_and_cut_layer', 'nested_contours_review'])
    expect(r.layers).toEqual([{ name: '0', entities: 2, closed: 2, open: 0 }])
  })

  it('elipse, spline cerrada y POLYLINE con vértices', () => {
    const e = importDxf(drawing([ellipse([0, 0], [40, 0], 0.5)])).contours[0]
    expect(e.area).toBeLessThan(Math.PI * 40 * 20)
    expect(e.area).toBeGreaterThan(Math.PI * 40 * 20 - 2 * Math.PI * 40 * 0.1)
    expect(e.bounds[0]).toBeCloseTo(80, 6)
    const p = importDxf(drawing([polyline([[0, 0], [10, 0], [10, 10], [0, 10]], true)])).contours[0]
    expect(p.area).toBeCloseTo(100, 9)
    // Cuadrática cerrada sobre un cuadrado: los nudos repiten el primer punto al final.
    const ctrl = [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]]
    const s = importDxf(drawing([spline(ctrl, [0, 0, 0, 1, 2, 3, 3, 3], 2, 1)]))
    expect(s.contours).toHaveLength(1)
    expect(s.contours[0].bounds[0]).toBeGreaterThan(10)
  })

  it('las curvas se aproximan a 0.1 mm', () => {
    const r = importDxf(drawing([arc([0, 0], 50, 0, 180), arc([0, 0], 50, 180, 360)]))
    const pts = r.contours[0].points
    for (let i = 0; i + 1 < pts.length; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2
      const my = (pts[i][1] + pts[i + 1][1]) / 2
      expect(50 - Math.hypot(mx, my)).toBeLessThanOrEqual(0.1 + 1e-9)
    }
    // Polígono inscrito: pierde como mucho perímetro × flecha.
    expect(r.contours[0].area).toBeLessThan(Math.PI * 2500)
    expect(r.contours[0].area).toBeGreaterThan(Math.PI * 2500 - 2 * Math.PI * 50 * 0.1)
  })

  it('ignora el espacio papel e informa bloques sin expandir', () => {
    const paper = [...box(0, 0, 10), 67, 1]
    const r = importDxf(drawing([paper, insert('cut'), box(20, 0, 10)]))
    expect(r.contours).toHaveLength(1)
    expect(r.diagnostics[0]).toEqual({ code: 'unsupported_INSERT', layer: 'cut', count: 1 })
  })

  it('aplica la extrusión invertida (espejo en X)', () => {
    const mirrored = lwpolyline([[0, 0], [10, 0], [10, 10], [0, 10]], true, '0', [210, 0, 220, 0, 230, -1])
    const c = importDxf(drawing([mirrored])).contours[0]
    expect(Math.min(...c.points.map((p) => p[0]))).toBeCloseTo(-10, 9)
  })
})

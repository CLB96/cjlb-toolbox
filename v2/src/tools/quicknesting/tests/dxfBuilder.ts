// Construye DXF ASCII pequeños con la forma que escribe ezdxf (R2010): cabecera,
// handles, propietario y marcadores de subclase. Solo para pruebas.
type Tags = (string | number)[]
let handle = 0x100

const common = (type: string, layer: string, sub: string): Tags => [
  0, type, 5, (handle++).toString(16).toUpperCase(), 330, '1F', 100, 'AcDbEntity', 8, layer, 100, sub,
]

export const line = (a: number[], b: number[], layer = '0'): Tags =>
  [...common('LINE', layer, 'AcDbLine'), 10, a[0], 20, a[1], 30, 0, 11, b[0], 21, b[1], 31, 0]

export const arc = (c: number[], r: number, start: number, end: number, layer = '0'): Tags =>
  [...common('ARC', layer, 'AcDbCircle'), 10, c[0], 20, c[1], 30, 0, 40, r, 100, 'AcDbArc', 50, start, 51, end]

export const circle = (c: number[], r: number, layer = '0'): Tags =>
  [...common('CIRCLE', layer, 'AcDbCircle'), 10, c[0], 20, c[1], 30, 0, 40, r]

/** Vértices [x, y] o [x, y, abultamiento]. */
export function lwpolyline(points: number[][], closed: boolean, layer = '0', extra: Tags = []): Tags {
  const tags: Tags = [...common('LWPOLYLINE', layer, 'AcDbPolyline'), 90, points.length, 70, closed ? 1 : 0, 43, 0]
  for (const [x, y, b] of points) {
    tags.push(10, x, 20, y)
    if (b) tags.push(42, b)
  }
  return [...tags, ...extra]
}

export function polyline(points: number[][], closed: boolean, layer = '0'): Tags {
  const tags: Tags = [...common('POLYLINE', layer, 'AcDb2dPolyline'), 66, 1, 10, 0, 20, 0, 30, 0, 70, closed ? 1 : 0]
  for (const [x, y] of points) tags.push(...common('VERTEX', layer, 'AcDbVertex'), 100, 'AcDb2dVertex', 10, x, 20, y, 30, 0, 70, 0)
  return [...tags, 0, 'SEQEND', 5, (handle++).toString(16), 8, layer]
}

export const ellipse = (c: number[], major: number[], ratio: number, layer = '0'): Tags =>
  [...common('ELLIPSE', layer, 'AcDbEllipse'), 10, c[0], 20, c[1], 30, 0, 11, major[0], 21, major[1], 31, 0,
    210, 0, 220, 0, 230, 1, 40, ratio, 41, 0, 42, 2 * Math.PI]

export function spline(ctrl: number[][], knots: number[], degree: number, flags: number, layer = '0'): Tags {
  const tags: Tags = [...common('SPLINE', layer, 'AcDbSpline'), 210, 0, 220, 0, 230, 1, 70, flags, 71, degree,
    72, knots.length, 73, ctrl.length, 74, 0]
  for (const k of knots) tags.push(40, k)
  for (const [x, y] of ctrl) tags.push(10, x, 20, y, 30, 0)
  return tags
}

export const insert = (layer = '0'): Tags => [...common('INSERT', layer, 'AcDbBlockReference'), 2, 'BLOCK1', 10, 0, 20, 0, 30, 0]

export function drawing(entities: Tags[], units = 4): Uint8Array {
  const tags: Tags = [
    0, 'SECTION', 2, 'HEADER', 9, '$ACADVER', 1, 'AC1024', 9, '$INSUNITS', 70, units, 0, 'ENDSEC',
    0, 'SECTION', 2, 'TABLES', 0, 'TABLE', 2, 'LAYER', 70, 1, 0, 'LAYER', 2, '0', 70, 0, 0, 'ENDTAB', 0, 'ENDSEC',
    0, 'SECTION', 2, 'ENTITIES', ...entities.flat(), 0, 'ENDSEC', 0, 'EOF',
  ]
  const lines: string[] = []
  for (let i = 0; i < tags.length; i += 2) lines.push(String(tags[i]).padStart(3, ' '), String(tags[i + 1]))
  return new TextEncoder().encode(lines.join('\n') + '\n')
}

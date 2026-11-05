// Lee candidatos de corte de un DXF sin adivinar capas de corte ni cerrar huecos.
// Port de Quick-Nesting-Entrega/nesting/importer.py.
import { decodeText, readDxf } from './dxf'
import { flatten } from './flatten'
import { contains, isValidRing, makePoly, openRing } from './geometry'
import type { Poly } from './geometry'
import { InputError } from './types'

export const TOLERANCE_MM = 0.1
export const JOIN_MM = 0.01
export const MAX_BYTES = 12 * 1024 * 1024
export const MAX_ENTITIES = 30000
export const MAX_POINTS = 180000
export const MAX_PATH_POINTS = 10000
export const MAX_CONTOURS = 1000
export const UNITS: Record<number, [number, string]> = {
  1: [25.4, 'in'], 2: [304.8, 'ft'], 3: [1609344, 'mi'], 4: [1, 'mm'], 5: [10, 'cm'], 6: [1000, 'm'], 10: [914.4, 'yd'],
}
const SUPPORTED = new Set(['LINE', 'ARC', 'LWPOLYLINE', 'POLYLINE', 'SPLINE', 'ELLIPSE'])

type P2 = [number, number]

export interface Contour {
  id: string
  layer: string
  /** Contorno cerrado en mm (el primer punto se repite al final). */
  points: number[][]
  area: number
  /** Ancho y alto en mm. */
  bounds: [number, number]
  nested: boolean
}

export interface Diagnostic {
  code: string
  layer?: string
  count?: number
}

export interface LayerStats {
  name: string
  entities: number
  closed: number
  open: number
}

export interface ImportResult {
  unitCode: number
  unitLabel: string
  unitMm: number
  requiresUnitOverride: boolean
  contours: Contour[]
  diagnostics: Diagnostic[]
  layers: LayerStats[]
  toleranceMm: number
}

/** Solo componentes de grado dos, dentro de la misma capa. */
export function joinedCycles(paths: P2[][]): { cycles: P2[][]; unresolved: number } {
  const buckets = new Map<string, number[]>()
  const nodes: P2[] = []
  const adjacency = new Map<number, number[]>()
  const edges: [number, number, P2[]][] = []
  const d = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1])
  const node = (point: P2): number => {
    const kx = Math.floor(point[0] / JOIN_MM)
    const ky = Math.floor(point[1] / JOIN_MM)
    const matches: number[] = []
    for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
      for (const i of buckets.get(`${kx + dx},${ky + dy}`) ?? []) if (d(nodes[i], point) <= JOIN_MM) matches.push(i)
    }
    if (matches.length) return matches.reduce((best, i) => (d(nodes[i], point) < d(nodes[best], point) ? i : best))
    nodes.push(point)
    const key = `${kx},${ky}`
    buckets.set(key, [...(buckets.get(key) ?? []), nodes.length - 1])
    return nodes.length - 1
  }
  const adj = (v: number) => adjacency.get(v) ?? []
  for (const points of paths) {
    const start = node(points[0])
    const end = node(points[points.length - 1])
    edges.push([start, end, points])
    adjacency.set(start, [...adj(start), edges.length - 1])
    adjacency.set(end, [...adj(end), edges.length - 1])
  }
  const visited = new Set<number>()
  const cycles: P2[][] = []
  let unresolved = 0
  for (let seed = 0; seed < edges.length; seed++) {
    if (visited.has(seed)) continue
    const component = new Set<number>()
    const vertices = new Set<number>()
    const stack = [seed]
    while (stack.length) {
      const index = stack.pop()!
      if (component.has(index)) continue
      component.add(index)
      const [a, b] = edges[index]
      vertices.add(a).add(b)
      for (const v of [a, b]) for (const e of adj(v)) if (!component.has(e)) stack.push(e)
    }
    component.forEach((e) => visited.add(e))
    if ([...vertices].some((v) => adj(v).length !== 2)) {
      unresolved += component.size
      continue
    }
    const start = edges[seed][0]
    let current = start
    const used = new Set<number>()
    const ring: P2[] = []
    while (used.size < component.size) {
      const options = adj(current).filter((e) => !used.has(e))
      if (!options.length) break
      const [a, b, points] = edges[options[0]]
      const forward = a === current
      const segment = forward ? points : [...points].reverse()
      ring.push(...(ring.length ? segment.slice(1) : segment))
      current = forward ? b : a
      used.add(options[0])
    }
    if (current === start && used.size === component.size) {
      ring[ring.length - 1] = ring[0]
      cycles.push(ring)
    } else {
      unresolved += component.size
    }
  }
  return { cycles, unresolved }
}

export function importDxf(data: Uint8Array, unitMm: number | null = null): ImportResult {
  if (!ArrayBuffer.isView(data) || !data.length || data.length > MAX_BYTES) throw new InputError('file_size')
  if (new TextDecoder('latin1').decode(data.subarray(0, 18)) === 'AutoCAD Binary DXF') throw new InputError('binary_dxf_unsupported')
  const doc = readDxf(decodeText(data))
  const code = doc.insunits
  let [factor, label] = UNITS[code] ?? [1, 'unknown']
  const requiresOverride = !(code in UNITS) && unitMm === null
  if (unitMm !== null) {
    if (typeof unitMm !== 'number' || !Number.isFinite(unitMm) || unitMm < 0.000001 || unitMm > 1000000) throw new InputError('invalid_unit_scale')
    factor = unitMm
  }
  if (doc.entities.length > MAX_ENTITIES) throw new InputError('entity_limit')
  const stats = new Map<string, LayerStats>()
  const layerStats = (name: string) => {
    if (!stats.has(name)) stats.set(name, { name, entities: 0, closed: 0, open: 0 })
    return stats.get(name)!
  }
  const counts = new Map<string, Diagnostic>()
  const count = (reason: string, layer: string, n = 1) => {
    const key = `${reason}\u0000${layer}`
    const row = counts.get(key) ?? { code: reason, layer, count: 0 }
    counts.set(key, { ...row, count: (row.count ?? 0) + n })
  }
  const openPaths = new Map<string, P2[][]>()
  const closedPaths: [string, P2[]][] = []
  let totalPoints = 0
  for (const entity of doc.entities) {
    const layer = entity.layer
    layerStats(layer).entities += 1
    if (!SUPPORTED.has(entity.type)) {
      count(entity.type === 'CIRCLE' ? 'circles_excluded' : `unsupported_${entity.type}`, layer)
      continue
    }
    let path
    try {
      path = flatten(entity, TOLERANCE_MM / factor)
    } catch {
      count('geometry_excluded', layer)
      continue
    }
    const vertices = path.points
    if (vertices.length > MAX_PATH_POINTS) throw new InputError('path_point_limit')
    if (!vertices.length) continue
    const zs = vertices.map((v) => v[2])
    if (Math.max(...zs) - Math.min(...zs) > JOIN_MM / factor) {
      count('non_planar_excluded', layer)
      continue
    }
    const points: P2[] = vertices.map((v) => [v[0] * factor, v[1] * factor])
    if (points.some((p) => p.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e9))) throw new InputError('coordinate_limit')
    totalPoints += points.length
    if (totalPoints > MAX_POINTS) throw new InputError('point_limit')
    if (points.length < 2) continue
    // Cerrado: el último punto pasa a ser exactamente el primero, como el cierre de Shapely.
    if (path.closed) closedPaths.push([layer, [...points.slice(0, -1), points[0]]])
    else openPaths.set(layer, [...(openPaths.get(layer) ?? []), points])
  }
  for (const [layer, paths] of openPaths) {
    const { cycles, unresolved } = joinedCycles(paths)
    closedPaths.push(...cycles.map((c) => [layer, c] as [string, P2[]]))
    layerStats(layer).open = unresolved
    if (unresolved) count('open_or_branched', layer, unresolved)
  }
  const contours: Contour[] = []
  const polys: Poly[] = []
  for (const [layer, points] of closedPaths) {
    const distinct = new Set(points.map((p) => `${p[0]},${p[1]}`))
    if (points.length < 4 || distinct.size < 3) {
      count('invalid_contour', layer)
      continue
    }
    const ring = openRing(points)
    const poly = makePoly(ring)
    if (!isValidRing(ring) || poly.area <= 1e-8 || points.length > MAX_PATH_POINTS) {
      count('invalid_contour', layer)
      continue
    }
    // Los identificadores los genera la app: los handles del DXF no siempre son únicos.
    const [minx, miny, maxx, maxy] = poly.bounds
    contours.push({
      id: `c${contours.length + 1}`, layer, points: [...ring.map((p) => [p[0], p[1]]), [ring[0][0], ring[0][1]]],
      area: poly.area, bounds: [maxx - minx, maxy - miny], nested: false,
    })
    polys.push(poly)
    layerStats(layer).closed += 1
  }
  if (contours.length > MAX_CONTOURS) throw new InputError('contour_limit')
  const marked = contours.map((c, i) => ({
    ...c, nested: polys.some((other, j) => i !== j && other.area > polys[i].area && contains(other, polys[i])),
  }))
  const diagnostics: Diagnostic[] = [...counts.values(), { code: 'review_scale_and_cut_layer' }]
  if (marked.some((c) => c.nested)) diagnostics.push({ code: 'nested_contours_review' })
  return {
    unitCode: code, unitLabel: label, unitMm: factor, requiresUnitOverride: requiresOverride,
    contours: marked, diagnostics, layers: [...stats.values()], toleranceMm: TOLERANCE_MM,
  }
}

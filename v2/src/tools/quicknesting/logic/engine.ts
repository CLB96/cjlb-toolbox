// Acomodo acotado abajo-izquierda de polígonos; no es un optimizador industrial global.
// Port directo de Quick-Nesting-Entrega/nesting/engine.py: mismo orden de búsqueda y límites.
import { closedCoords, closerThan, contains, isValidRing, makePoly, openRing, orient, overlaps, translate } from './geometry'
import type { Poly } from './geometry'
import { InputError } from './types'
import type { NestOptions, NestPayload, NestResult, NestStatus, Placement } from './types'

export const MAX_PIECES = 200
export const MAX_SECONDS = 10
export const MAX_CHECKS = 80000
export const FREE_ANGLES = [0, 90, 180, 270, 30, 60, 120, 150, 210, 240, 300, 330, 45, 135, 225, 315]
const EPSILON = 1e-7

export const clock = (): number => performance.now() / 1000

export function number(value: unknown, code: string, minimum = 0, maximum = 100000): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new InputError(code)
  }
  return value
}

export function conflicts(candidate: Poly, existing: readonly Poly[], gap: number): boolean {
  const [a, b, c, d] = candidate.bounds
  for (const other of existing) {
    const [x, y, z, w] = other.bounds
    if (c + gap <= x + EPSILON || z + gap <= a + EPSILON || d + gap <= y + EPSILON || w + gap <= b + EPSILON) continue
    // `distance + EPSILON < gap` del original, sin medir pares de bordes que ya están lejos.
    if (overlaps(candidate, other) || closerThan(candidate, other, gap - EPSILON)) return true
  }
  return false
}

export function shape(piece: unknown): Poly {
  const p = piece as { id?: unknown; points?: unknown }
  if (!p || typeof p !== 'object' || typeof p.id !== 'string' || p.id.length > 100) throw new InputError('invalid_piece')
  const points = p.points
  if (!Array.isArray(points) || points.length < 3 || points.length > 10000) throw new InputError('invalid_polygon')
  for (const point of points) {
    if (!Array.isArray(point) || point.length !== 2) throw new InputError('invalid_polygon')
    for (const coordinate of point) number(coordinate, 'invalid_coordinate', -1e9, 1e9)
  }
  const pts = openRing(points as number[][])
  const poly = makePoly(pts)
  if (!isValidRing(pts) || poly.area <= 1e-8) throw new InputError('invalid_polygon')
  return poly
}

const mod360 = (a: number) => ((a % 360) + 360) % 360

type Variant = [number, Poly]
type Position = [number, number, number, number, Poly]

const byKey = (p: Position, q: Position) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2] || p[3] - q[3]
const sortedNums = (s: Set<number>) => [...s].sort((x, y) => x - y)

interface Search {
  placed: Poly[]
  records: Placement[]
  counts: Map<string, number>
  checks: number
}

function record(id: string, angle: number, poly: Poly): Placement {
  return { id, angle, points: closedCoords(poly.pts) }
}

/** Conserva un acomodo base y prueba cada copia restante con ángulos independientes. */
function fillIndependent(s: Search, targets: Map<string, number>, variants: Map<string, Variant[]>,
  width: number, length: number, gap: number, capacity: number, deadline: number, now: () => number): NestStatus | null {
  while (s.placed.length < capacity) {
    if (now() >= deadline) return 'time_limit'
    let success = false
    for (const [id, target] of targets) {
      if ((s.counts.get(id) ?? 0) >= target) continue
      const positions: Position[] = []
      for (const [angle, poly] of variants.get(id) ?? []) {
        const pw = poly.bounds[2]
        const ph = poly.bounds[3]
        if (pw > width + EPSILON || ph > length + EPSILON) continue
        // Incluye los bordes lejanos: una franja sobrante no tiene por qué empezar en la esquina de otra pieza.
        const xs = new Set([0, Math.max(0, width - pw)])
        const ys = new Set([0, Math.max(0, length - ph)])
        for (const other of s.placed) {
          const [x, y, right, top] = other.bounds
          xs.add(x).add(right + gap).add(Math.max(0, x - pw - gap))
          ys.add(y).add(top + gap).add(Math.max(0, y - ph - gap))
        }
        for (const y of sortedNums(ys)) {
          if (y + ph > length + EPSILON) continue
          for (const x of sortedNums(xs)) if (x + pw <= width + EPSILON) positions.push([y + ph, y, x, angle, poly])
        }
      }
      positions.sort(byKey)
      for (const [, y, x, angle, poly] of positions) {
        s.checks += 1
        if (s.checks > MAX_CHECKS || now() >= deadline) return s.checks > MAX_CHECKS ? 'search_limit' : 'time_limit'
        const candidate = translate(poly, x, y)
        if (conflicts(candidate, s.placed, gap)) continue
        s.placed.push(candidate)
        s.records.push(record(id, angle, candidate))
        s.counts.set(id, (s.counts.get(id) ?? 0) + 1)
        success = true
        break
      }
      if (success) break
    }
    if (!success) break
  }
  return null
}

const topOf = (placed: readonly Poly[]) => placed.reduce((m, p) => Math.max(m, p.bounds[3]), 0)
const areaOf = (placed: readonly Poly[]) => placed.reduce((s, p) => s + p.area, 0)

export function pack(payload: NestPayload, opts: NestOptions = {}, fixedLength: number | null = null): NestResult {
  if (!payload || typeof payload !== 'object') throw new InputError('invalid_job')
  const now = opts.now ?? clock
  const maxPieces = opts.maxPieces ?? MAX_PIECES
  const maxSeconds = opts.maxSeconds ?? MAX_SECONDS
  const width = number(payload.width, 'invalid_width', 0.001)
  const manual = payload.mode === 'manual'
  const stretch = manual && fixedLength === null
  let length = stretch ? 0 : number(fixedLength ?? payload.length, 'invalid_length', 0.001)
  const gap = number(payload.gap, 'invalid_gap')
  const angle = mod360(number(payload.angle ?? 0, 'invalid_angle', -36000, 36000))
  const quantity = number(payload.quantity ?? 1, 'invalid_quantity', 1, 100000)
  if (!Number.isInteger(quantity)) throw new InputError('invalid_quantity')
  const { mode, rotation, pieces } = payload
  if ((mode !== 'auto' && mode !== 'manual') || !['fixed', 'free', 'independent'].includes(rotation)) {
    throw new InputError('invalid_mode')
  }
  if (!Array.isArray(pieces) || pieces.length < 1 || pieces.length > 16) throw new InputError('select_pieces')
  if (mode === 'auto' && pieces.length !== 1) throw new InputError('auto_one_pattern')
  const ids = new Set(pieces.filter((p) => p && typeof p.id === 'string').map((p) => p.id))
  if (ids.size !== pieces.length) throw new InputError('duplicate_piece_ids')
  const sources = pieces.map((p) => [p.id, shape(p)] as [string, Poly]).sort((a, b) => b[1].area - a[1].area)
  // Un anillo interior puede ser un agujero o una marca, no otra pieza de corte.
  if (sources.some(([, a], i) => sources.some(([, b], j) => i !== j && contains(a, b)))) {
    throw new InputError('nested_selection')
  }
  const angles = rotation === 'fixed' ? [angle] : FREE_ANGLES
  const variants = new Map(sources.map(([id, poly]) => [id, angles.map((a) => [a, orient(poly, a)] as Variant)]))
  const start = now()
  const capacity = Math.min(MAX_PIECES, maxPieces)
  const deadline = start + Math.min(MAX_SECONDS, maxSeconds)
  const targets = new Map(sources.map(([id]) => [id, manual ? quantity : capacity]))
  if (stretch) {
    // Una pila vertical factible acota la búsqueda; el largo mostrado se recorta al resultado.
    for (const [id, choices] of variants) {
      const heights = choices.filter(([, p]) => p.bounds[2] <= width + EPSILON).map(([, p]) => p.bounds[3])
      if (heights.length) length += Math.min(targets.get(id) ?? 0, capacity) * (Math.max(...heights) + gap)
    }
    length = Math.max(length, 1)
  }
  let best: { score: [number, number, number]; s: Search; stop: NestStatus | null } | null = null
  // Probar cada ángulo uniforme puede superar a una primera elección mixta atractiva.
  let trials: number[][] = [...angles.map((a) => [a]), ...(rotation === 'free' ? [angles] : [])]
  if (manual && rotation === 'independent') trials = [angles, ...angles.map((a) => [a])]
  let globalStop: NestStatus | null = null
  let checks = 0
  for (const allowed of trials) {
    const s: Search = { placed: [], records: [], counts: new Map([...targets.keys()].map((k) => [k, 0])), checks }
    const blocked = new Set<string>()
    let stop: NestStatus | null = null
    while (s.placed.length < capacity) {
      if (now() >= deadline) {
        stop = 'time_limit'
        break
      }
      let success = false
      for (const [id] of sources) {
        if (blocked.has(id) || (s.counts.get(id) ?? 0) >= (targets.get(id) ?? 0)) continue
        const positions: Position[] = []
        for (const [a, poly] of variants.get(id) ?? []) {
          if (!allowed.includes(a)) continue
          const pw = poly.bounds[2]
          const ph = poly.bounds[3]
          if (pw > width + EPSILON || ph > length + EPSILON) continue
          const xs = new Set([0])
          const ys = new Set([0])
          for (const other of s.placed) {
            const [minx, miny, maxx, maxy] = other.bounds
            xs.add(maxx + gap).add(minx).add(Math.max(0, minx - pw - gap))
            ys.add(maxy + gap).add(miny).add(Math.max(0, miny - ph - gap))
          }
          for (const y of sortedNums(ys)) {
            if (y + ph > length + EPSILON) continue
            for (const x of sortedNums(xs)) if (x + pw <= width + EPSILON) positions.push([y + ph, y, x, a, poly])
          }
        }
        positions.sort(byKey)
        let selected: [number, Poly] | null = null
        for (const [, y, x, a, poly] of positions) {
          s.checks += 1
          if (s.checks > MAX_CHECKS || now() >= deadline) {
            stop = s.checks > MAX_CHECKS ? 'search_limit' : 'time_limit'
            break
          }
          const candidate = translate(poly, x, y)
          if (!conflicts(candidate, s.placed, gap)) {
            selected = [a, candidate]
            break
          }
        }
        if (stop) break
        if (selected === null) {
          blocked.add(id)
          continue
        }
        s.placed.push(selected[1])
        s.counts.set(id, (s.counts.get(id) ?? 0) + 1)
        s.records.push(record(id, selected[0], selected[1]))
        success = true
        break
      }
      if (stop || !success) break
    }
    if (rotation === 'independent' && !stop) {
      stop = fillIndependent(s, targets, variants, width, length, gap, capacity, deadline, now)
    }
    checks = s.checks
    const short = [...targets].some(([k, t]) => (s.counts.get(k) ?? 0) < t)
    if (!stop && s.placed.length === capacity && (mode === 'auto' || short)) stop = 'piece_limit'
    const score: [number, number, number] = [s.placed.length, areaOf(s.placed), -topOf(s.placed)]
    if (best === null || greater(score, best.score)) best = { score, s, stop }
    if (stop === 'time_limit' || stop === 'search_limit') {
      globalStop = stop
      break
    }
    if (manual && rotation === 'fixed' && s.placed.length === quantity * sources.length) break
  }
  return finish(best!, { manual, stretch, width, length, gap, quantity, sources: sources.length, globalStop, start, now, capacity, maxSeconds, angles })
}

function greater(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return false
}

interface FinishCtx {
  manual: boolean
  stretch: boolean
  width: number
  length: number
  gap: number
  quantity: number
  sources: number
  globalStop: NestStatus | null
  start: number
  now: () => number
  capacity: number
  maxSeconds: number
  angles: number[]
}

function finish(best: { s: Search; stop: NestStatus | null }, c: FinishCtx): NestResult {
  const { placed, records } = best.s
  const usedArea = areaOf(placed)
  const missing = c.manual ? Math.max(0, c.quantity * c.sources - placed.length) : 0
  let status = c.globalStop ?? best.stop
  if (!status) {
    status = c.manual
      ? (!missing ? 'request_fulfilled' : placed.length ? 'partial' : 'no_fit')
      : (placed.length ? 'filled' : 'no_fit')
  }
  // Comprobación final, independiente del bucle de colocación.
  placed.forEach((poly, i) => {
    const [a, b, x, y] = poly.bounds
    const inside = a >= -EPSILON && b >= -EPSILON && x <= c.width + EPSILON && y <= c.length + EPSILON
    if (!inside || conflicts(poly, placed.slice(0, i), c.gap)) throw new InputError('verification_failed')
  })
  const outputLength = c.stretch ? Math.ceil(topOf(placed) * 100) / 100 : c.length
  const area = c.width * outputLength
  const result: NestResult = {
    placements: records, count: records.length, usedArea,
    utilization: area ? (100 * usedArea) / area : 0,
    unusedArea: Math.max(0, area - usedArea), status, missing,
    elapsed: Math.round((c.now() - c.start) * 1000) / 1000,
    limits: { maxPieces: c.capacity, maxSeconds: Math.min(MAX_SECONDS, c.maxSeconds) },
    gap: c.gap, angles: c.angles,
  }
  if (c.manual) return { ...result, width: c.width, length: outputLength, lengthIsPartial: missing > 0 }
  return result
}

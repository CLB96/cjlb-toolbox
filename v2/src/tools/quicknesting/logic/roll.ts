// Margen interno del rollo y planes exactos de capas de largo fijo.
// Port directo de Quick-Nesting-Entrega/nesting/roll.py.
import { MAX_PIECES, MAX_SECONDS, clock, number, pack, shape } from './engine'
import { makePoly, openRing } from './geometry'
import { InputError } from './types'
import type { NestOptions, NestPayload, NestResult, Piece, PlyGroup, PlyPlan } from './types'

export const MAX_TEMPLATE_VERTICES = 250000

/** Traslada una vez el acomodo interior al rectángulo físico, sin cambiar la separación entre cortes. */
function outer(result: NestResult, width: number, length: number, margin: number): NestResult {
  const placements = result.placements.map((p) => ({ ...p, points: p.points.map(([x, y]) => [x + margin, y + margin]) }))
  const area = width * length
  return {
    ...result, placements, width, length, margin,
    usableWidth: width - 2 * margin,
    usableLength: Math.max(0, length - 2 * margin),
    utilization: area ? (100 * result.usedArea) / area : 0,
    unusedArea: Math.max(0, area - result.usedArea),
  }
}

function subset(result: NestResult, copies: number, ids: readonly string[]): NestResult {
  const counts = new Map<string, number>()
  const placements = result.placements.filter((p) => {
    const n = counts.get(p.id) ?? 0
    if (n >= copies) return false
    counts.set(p.id, n + 1)
    return true
  })
  if (ids.some((k) => (counts.get(k) ?? 0) !== copies)) throw new InputError('verification_failed')
  const usedArea = placements.reduce((s, p) => s + makePoly(openRing(p.points)).area, 0)
  return { ...result, placements, count: placements.length, usedArea, missing: 0, status: 'request_fulfilled', lengthIsPartial: false }
}

function plan(payload: NestPayload, width: number, length: number, margin: number, opts: NestOptions): NestResult {
  if (payload.mode !== 'manual') throw new InputError('multi_ply_manual_only')
  const quantity = number(payload.quantity, 'invalid_quantity', 1, 100000)
  if (!Number.isInteger(quantity)) throw new InputError('invalid_quantity')
  const now = opts.now ?? clock
  const maxSeconds = Math.max(0, Math.min(MAX_SECONDS, opts.maxSeconds ?? MAX_SECONDS))
  const capacity = Math.min(MAX_PIECES, opts.maxPieces ?? MAX_PIECES)
  const innerWidth = width - 2 * margin
  const innerLength = length - 2 * margin
  const started = now()
  const deadline = started + maxSeconds
  const base: NestPayload = { ...payload, width: innerWidth, quantity: 1 }
  // Valida la geometría y el modo aunque el tiempo de búsqueda sea 0.
  const empty = pack(base, { maxPieces: capacity, maxSeconds: 0, now }, innerLength)
  const pieces = payload.pieces
  const groups: PlyGroup[] = []
  let limited: NestResult['status'] | null = null
  const remaining = () => Math.max(0, deadline - now())

  const findTemplate = (selection: Piece[], allocation: number, vertexBudget = MAX_TEMPLATE_VERTICES): [NestResult | null, number] => {
    if (remaining() <= 0) {
      limited = 'time_limit'
      return [null, 0]
    }
    const ids = selection.map((p) => p.id)
    const area = selection.reduce((s, p) => s + shape(p).area, 0)
    const areaBound = Math.max(0, Math.floor((innerWidth * innerLength) / area + 1e-8))
    const vertexBound = Math.max(1, Math.floor(vertexBudget / selection.reduce((s, p) => s + p.points.length, 0)))
    const ceiling = Math.min(Math.max(0, allocation), vertexBound)
    let high = Math.min(ceiling, areaBound)
    if (high < 1) return [null, 0]
    let best: NestResult | null = null
    let bestCount = 0
    let low = 1
    // Primero un acomodo factible conocido; después capacidades mayores.
    const probes = [1]
    while (probes.length || low <= high) {
      if (remaining() <= 0) {
        limited = 'time_limit'
        break
      }
      const copies = probes.length ? probes.pop()! : Math.floor((low + high) / 2)
      const result = pack({ ...base, pieces: selection, quantity: copies },
        { maxPieces: capacity, maxSeconds: remaining(), now }, innerLength)
      const counts = new Map<string, number>()
      for (const p of result.placements) counts.set(p.id, (counts.get(p.id) ?? 0) + 1)
      const feasible = ids.every((k) => counts.get(k) === copies)
      if (feasible) {
        best = result
        bestCount = copies
        low = copies + 1
      } else {
        high = copies - 1
      }
      if (result.status === 'time_limit' || result.status === 'search_limit') {
        limited = result.status
        break
      }
      if (copies === 1 && !feasible) break
    }
    if (bestCount === ceiling && areaBound > ceiling) limited = limited ?? 'piece_limit'
    return [best, bestCount]
  }

  const addGroups = (template: NestResult | null, copies: number, ids: string[]) => {
    if (!template || copies < 1) return
    const repeat = Math.floor(quantity / copies)
    const remainder = quantity % copies
    const kinds: ['full' | 'partial', number, number][] = [['full', repeat, copies], ['partial', remainder ? 1 : 0, remainder]]
    for (const [kind, layers, count] of kinds) {
      if (!layers) continue
      const result = outer(subset(template, count, ids), width, length, margin)
      groups.push({ ...result, key: `g${groups.length}`, kind, layers, patternIds: ids })
    }
  }

  let [template, copies] = findTemplate(pieces, Math.floor(capacity / pieces.length))
  let separate = false
  if (copies) {
    addGroups(template, copies, pieces.map((p) => p.id))
  } else if (pieces.length > 1 && remaining() > 0) {
    // Patrones que caben cada uno en una capa pero no juntos: grupos de corte separados.
    separate = true
    const allocation = Math.max(1, Math.floor(capacity / pieces.length))
    for (const piece of pieces) {
      ;[template, copies] = findTemplate([piece], allocation, Math.floor(MAX_TEMPLATE_VERTICES / pieces.length))
      addGroups(template, copies, [piece.id])
    }
  }
  const produced = new Map<string, number>()
  for (const g of groups) for (const p of g.placements) produced.set(p.id, (produced.get(p.id) ?? 0) + g.layers)
  if (pieces.some((p) => (produced.get(p.id) ?? 0) > quantity)) throw new InputError('verification_failed')
  const missing = pieces.reduce((s, p) => s + quantity - (produced.get(p.id) ?? 0), 0)
  const plyPlan: PlyPlan = {
    groups,
    totalLayers: groups.reduce((s, g) => s + g.layers, 0),
    fullLayers: groups.filter((g) => g.kind === 'full').reduce((s, g) => s + g.layers, 0),
    partialLayers: groups.filter((g) => g.kind === 'partial').reduce((s, g) => s + g.layers, 0),
    totalPieces: [...produced.values()].reduce((s, n) => s + n, 0),
    requestedPieces: quantity * pieces.length,
    missing,
    totalLength: groups.reduce((s, g) => s + g.layers * length, 0),
    complete: missing === 0,
    separatePatterns: separate,
  }
  // El primer grupo, sin sus campos de grupo, describe lo que se dibuja.
  const first: NestResult = groups.length ? stripGroup(groups[0]) : outer(empty, width, length, margin)
  return {
    ...first, plyPlan, missing, lengthIsPartial: missing > 0,
    elapsed: Math.round((now() - started) * 1000) / 1000,
    limits: { maxPieces: capacity, maxSeconds, maxTemplateVertices: MAX_TEMPLATE_VERTICES },
    status: limited ?? (!missing ? 'request_fulfilled' : groups.length ? 'partial' : 'no_fit'),
  }
}

function stripGroup(g: PlyGroup): NestResult {
  const { key: _k, kind: _kind, layers: _l, patternIds: _p, ...rest } = g
  void _k; void _kind; void _l; void _p
  return rest
}

/**
 * Automático con huecos y varios patrones, «misma cantidad de cada patrón»: el mayor N tal que
 * N copias de cada contorno caben juntas en el tendido. Una copia primero y luego búsqueda por
 * mitades, como las plantillas del plan de capas, dentro del mismo límite de tiempo.
 */
function balancedAuto(payload: NestPayload, width: number, length: number, margin: number, opts: NestOptions): NestResult {
  const now = opts.now ?? clock
  const maxSeconds = Math.max(0, Math.min(MAX_SECONDS, opts.maxSeconds ?? MAX_SECONDS))
  const capacity = Math.min(MAX_PIECES, opts.maxPieces ?? MAX_PIECES)
  const innerWidth = width - 2 * margin
  const innerLength = length - 2 * margin
  const started = now()
  const deadline = started + maxSeconds
  const remaining = () => Math.max(0, deadline - now())
  const base: NestPayload = { ...payload, width: innerWidth, mode: 'manual', margin: 0, plyMode: undefined, balanced: undefined }
  const empty = pack({ ...base, quantity: 1 }, { maxPieces: capacity, maxSeconds: 0, now }, innerLength)
  const ids = payload.pieces.map((p) => p.id)
  const area = payload.pieces.reduce((s, p) => s + shape(p).area, 0)
  const areaBound = Math.max(0, Math.floor((innerWidth * innerLength) / area + 1e-8))
  const ceiling = Math.floor(capacity / ids.length)
  let high = Math.min(ceiling, areaBound)
  let best: NestResult | null = null
  let bestCount = 0
  let low = 1
  let limited: NestResult['status'] | null = null
  const probes = high >= 1 ? [1] : []
  while (probes.length || low <= high) {
    if (remaining() <= 0) {
      limited = 'time_limit'
      break
    }
    const copies = probes.length ? probes.pop()! : Math.floor((low + high) / 2)
    const result = pack({ ...base, quantity: copies }, { maxPieces: capacity, maxSeconds: remaining(), now }, innerLength)
    const counts = new Map<string, number>()
    for (const p of result.placements) counts.set(p.id, (counts.get(p.id) ?? 0) + 1)
    const feasible = ids.every((k) => counts.get(k) === copies)
    if (feasible) {
      best = result
      bestCount = copies
      low = copies + 1
    } else {
      high = copies - 1
    }
    if (result.status === 'time_limit' || result.status === 'search_limit') {
      limited = result.status
      break
    }
    if (copies === 1 && !feasible) break
  }
  if (bestCount && bestCount === ceiling && areaBound > ceiling) limited = limited ?? 'piece_limit'
  const chosen = best ?? { ...empty, placements: [], count: 0, usedArea: 0 }
  const usedArea = chosen.usedArea
  const area2 = innerWidth * innerLength
  const inner: NestResult = {
    placements: chosen.placements, count: chosen.placements.length, usedArea,
    utilization: area2 ? (100 * usedArea) / area2 : 0, unusedArea: Math.max(0, area2 - usedArea),
    status: limited ?? (best ? 'filled' : 'no_fit'), missing: 0,
    elapsed: Math.round((now() - started) * 1000) / 1000,
    limits: { maxPieces: capacity, maxSeconds }, gap: chosen.gap, angles: chosen.angles,
    balancedCopies: bestCount,
  }
  return margin > 0 ? outer(inner, width, length, margin) : { ...inner, width, length }
}

/** Punto de entrada público: igual que `nest()` del original. */
export function nest(payload: NestPayload, opts: NestOptions = {}): NestResult {
  if (!payload || typeof payload !== 'object') throw new InputError('invalid_job')
  const margin = number(payload.margin ?? 0, 'invalid_margin')
  if (payload.balanced === true && payload.mode === 'auto' && payload.rotation === 'independent' &&
    Array.isArray(payload.pieces) && payload.pieces.length > 1) {
    const width = number(payload.width, 'invalid_width', 0.001)
    const length = number(payload.length, 'invalid_length', 0.001)
    if (width <= 2 * margin || length <= 2 * margin) throw new InputError('invalid_margin')
    return balancedAuto(payload, width, length, margin, opts)
  }
  const basis = payload.plyMode ?? 'per_ply'
  if (basis !== 'per_ply' && basis !== 'total') throw new InputError('invalid_ply_mode')
  // Camino compatible exacto: sin campos nuevos ni cambios en acomodos anteriores.
  if (margin === 0 && basis === 'per_ply') return pack(payload, opts)
  const width = number(payload.width, 'invalid_width', 0.001)
  if (width <= 2 * margin) throw new InputError('invalid_margin')
  if (basis === 'total') {
    const length = number(payload.plyLength, 'invalid_ply_length', 0.001)
    if (length <= 2 * margin) throw new InputError('invalid_margin')
    return plan(payload, width, length, margin, opts)
  }
  const inner: NestPayload = { ...payload, width: width - 2 * margin }
  let length: number
  let result: NestResult
  if (payload.mode === 'manual') {
    result = pack(inner, opts)
    length = result.count ? Math.ceil(((result.length ?? 0) + 2 * margin) * 100) / 100 : 0
  } else {
    length = number(payload.length, 'invalid_length', 0.001)
    if (length <= 2 * margin) throw new InputError('invalid_margin')
    result = pack({ ...inner, length: length - 2 * margin }, opts)
  }
  return outer(result, width, length, margin)
}

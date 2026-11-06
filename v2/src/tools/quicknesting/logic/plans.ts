// Reglas de pantalla portadas de Quick-Nesting-Entrega/web/plans.js y app.js: petición,
// validación, grupo que se muestra, resumen del plan y mensaje final.
import type { NestPayload, NestResult, PlyGroup, QuantityMode, RotationMode } from './types'

export interface Settings {
  width: number
  length: number
  gap: number
  mode: QuantityMode
  quantity: number
  rotation: RotationMode
  angle: number
}

export interface Extras {
  marginEnabled: boolean
  margin: number
  multiplePlies: boolean
}

export type Request = Omit<NestPayload, 'pieces'>

export function requestOptions(base: Settings, extras: Extras): Request {
  const { length, ...rest } = base
  const request: Request = { ...rest, margin: extras.marginEnabled ? extras.margin : 0 }
  if (base.mode === 'auto') return { ...request, length }
  if (extras.multiplePlies) return { ...request, plyMode: 'total', plyLength: length }
  return request
}

export function validateMargin(s: Request): string | null {
  const margin = s.margin ?? 0
  if (typeof margin !== 'number' || !Number.isFinite(margin) || margin < 0 || margin * 2 >= s.width) return 'invalid_margin'
  const length = s.mode === 'auto' ? s.length : s.plyMode === 'total' ? s.plyLength : null
  if (length !== null && length !== undefined && margin * 2 >= length) return 'invalid_margin'
  return null
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function validateSettings(s: Request, selectedCount: number, confirmed: boolean): string | null {
  const dims = s.mode === 'manual' ? (s.plyMode === 'total' ? [s.width, s.plyLength] : [s.width]) : [s.width, s.length]
  if (!dims.every((v) => finite(v) && v > 0 && v <= 100000)) return 'invalid_dimensions'
  if (!finite(s.gap) || s.gap < 0 || s.gap > 100000) return 'invalid_gap'
  const marginError = validateMargin(s)
  if (marginError) return marginError
  if (s.mode === 'manual' && (!Number.isSafeInteger(s.quantity) || (s.quantity ?? 0) < 1)) return 'invalid_quantity'
  if (s.rotation === 'fixed' && (!finite(s.angle) || Math.abs(s.angle) > 360)) return 'invalid_angle'
  if (!selectedCount) return 'select_piece'
  if (s.mode === 'auto' && selectedCount !== 1 && s.rotation !== 'independent') return 'auto_one_piece'
  if (!confirmed) return 'confirm_scale'
  return null
}

/** Texto de un campo numérico: vacío no es 0. */
export const parseField = (value: string): number => (value.trim() === '' ? NaN : Number(value))

export function selectedAngle(preset: string, custom: string): number {
  return parseField(preset === 'custom' ? custom : preset)
}

/** Giro de vista previa apoyado en el origen; no cambia el contorno de origen. */
export function rotatePoints(points: number[][], angle: number): number[][] {
  const r = (angle * Math.PI) / 180
  const rotated = points.map(([x, y]) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)])
  const minX = Math.min(...rotated.map((p) => p[0]))
  const minY = Math.min(...rotated.map((p) => p[1]))
  return rotated.map(([x, y]) => [x - minX, y - minY])
}

export function selectedLayout(result: NestResult | null, key: string | null): NestResult | PlyGroup | null {
  if (!result?.plyPlan) return result
  const groups = result.plyPlan.groups
  return groups.find((g) => g.key === key) ?? groups[0] ?? null
}

export function validGroupKey(result: NestResult | null, key: string): string | null {
  return result?.plyPlan?.groups.some((g) => g.key === key) ? key : null
}

export interface PlanSummary {
  pieces: number
  requested: number
  layers: number
  full: number
  partial: number
  missing: number
  length: number
  complete: boolean
  inconsistent: boolean
  separatePatterns: boolean
}

export function planSummary(result: NestResult | null): PlanSummary | null {
  const plan = result?.plyPlan
  if (!plan) return null
  const groups = plan.groups
  const valid = groups.every((g) => Number.isSafeInteger(g.layers) && g.layers > 0 && Number.isSafeInteger(g.count) && g.count >= 0 &&
    (g.kind === 'full' || g.kind === 'partial') && (g.kind !== 'partial' || g.layers === 1))
  const sum = (list: PlyGroup[], f: (g: PlyGroup) => number) => list.reduce((s, g) => s + f(g), 0)
  const pieces = sum(groups, (g) => g.count * g.layers)
  const layers = sum(groups, (g) => g.layers)
  const full = sum(groups.filter((g) => g.kind === 'full'), (g) => g.layers)
  const partial = sum(groups.filter((g) => g.kind === 'partial'), (g) => g.layers)
  const missing = Math.max(0, plan.requestedPieces - pieces)
  const inconsistent = !valid || !Number.isSafeInteger(pieces) || pieces > plan.requestedPieces || pieces !== plan.totalPieces ||
    layers !== plan.totalLayers || full !== plan.fullLayers || partial !== plan.partialLayers || missing !== plan.missing
  return {
    pieces, requested: plan.requestedPieces, layers, full, partial, missing, length: plan.totalLength,
    complete: plan.complete === true && missing === 0 && !inconsistent, inconsistent, separatePatterns: plan.separatePatterns === true,
  }
}

const STATUSES = ['filled', 'request_fulfilled', 'no_fit', 'piece_limit', 'time_limit', 'search_limit', 'partial']

export function completionMessage(result: NestResult): { key: string; values: Record<string, number> } {
  const summary = planSummary(result)
  if (summary?.inconsistent) return { key: 'planInconsistent', values: {} }
  if (summary?.complete && ['time_limit', 'search_limit', 'piece_limit'].includes(result.status)) return { key: 'planCompleteLimited', values: {} }
  if (summary && !summary.complete && result.status === 'request_fulfilled') return { key: 'planMissing', values: { missing: summary.missing } }
  return { key: `status_${STATUSES.includes(result.status) ? result.status : 'partial'}`, values: {} }
}

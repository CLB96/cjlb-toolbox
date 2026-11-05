// Contrato del motor. Medidas en mm y áreas en mm², salvo que se indique otra cosa.

export class InputError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'InputError'
  }
}

export type QuantityMode = 'auto' | 'manual'
export type RotationMode = 'fixed' | 'free' | 'independent'
export type PlyMode = 'per_ply' | 'total'
export type NestStatus =
  | 'filled' | 'request_fulfilled' | 'no_fit' | 'partial'
  | 'piece_limit' | 'time_limit' | 'search_limit'

export interface Piece {
  id: string
  points: number[][]
}

export interface NestPayload {
  width: number
  /** Solo en automático; en manual por capa se calcula. */
  length?: number | null
  gap: number
  angle?: number
  quantity?: number
  mode: QuantityMode
  rotation: RotationMode
  pieces: Piece[]
  /** Margen interno por lado; 0 por defecto. */
  margin?: number
  plyMode?: PlyMode
  /** Largo físico de cada capa en el modo de varias capas. */
  plyLength?: number
}

export interface Placement {
  id: string
  angle: number
  /** Contorno cerrado (el primer punto se repite al final). */
  points: number[][]
}

export interface NestLimits {
  maxPieces: number
  maxSeconds: number
  maxTemplateVertices?: number
}

export interface PlyGroup extends NestResult {
  key: string
  kind: 'full' | 'partial'
  layers: number
  patternIds: string[]
}

export interface PlyPlan {
  groups: PlyGroup[]
  totalLayers: number
  fullLayers: number
  partialLayers: number
  totalPieces: number
  requestedPieces: number
  missing: number
  totalLength: number
  complete: boolean
  separatePatterns: boolean
}

export interface NestResult {
  placements: Placement[]
  count: number
  usedArea: number
  utilization: number
  unusedArea: number
  status: NestStatus
  missing: number
  elapsed: number
  limits: NestLimits
  gap: number
  angles: number[]
  /** Manual y con margen: medidas físicas del rectángulo dibujado. */
  width?: number
  length?: number
  lengthIsPartial?: boolean
  margin?: number
  usableWidth?: number
  usableLength?: number
  plyPlan?: PlyPlan
}

export interface NestOptions {
  maxPieces?: number
  maxSeconds?: number
  /** Reloj en segundos; se inyecta en pruebas. */
  now?: () => number
}

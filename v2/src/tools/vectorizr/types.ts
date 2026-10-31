// Tipos copiados literal de Digitalizacion/src/types/index.ts; los añadidos de la v2 van al final.
export type AppStep = 1 | 2 | 3 | 4

export type ScaleUnit = 'mm' | 'cm' | 'm' | 'in'

export type SegmentType = 'line' | 'bezier'

export interface BezierHandles {
  cp1: { x: number; y: number }
  cp2: { x: number; y: number }
}

export interface ContourPoint {
  id: string
  x: number       // pixels, relative to normalized image
  y: number
  type: SegmentType
  handles?: BezierHandles
}

export type ToolId =
  | 'select'
  | 'edit-point'
  | 'segment-type'
  | 'add-point'
  | 'delete-point'
  | 'measure'
  | 'zoom'

export interface ContourSnapshot {
  points: ContourPoint[]
}

export interface ScaleRef {
  p1: { x: number; y: number }
  p2: { x: number; y: number }
  realValue: number
  unit: ScaleUnit
}

// --- Añadidos v2 ---

/** 0 = Otsu ("Automático"), 1 = Canny ("Semi automático"). */
export type DetectionMethod = 0 | 1

export interface DetectParams {
  method: DetectionMethod
  threshold1: number
  threshold2: number
}

export interface ImagePoint {
  x: number
  y: number
}

/** Estado del worker de OpenCV visto desde la UI. */
export type OpencvStatus = 'idle' | 'loading' | 'ready' | 'error'

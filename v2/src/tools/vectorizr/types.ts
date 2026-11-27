// Tipos copiados literal de Digitalizacion/src/types/index.ts; los añadidos de la v2 van al final.
export type AppStep = 1 | 2 | 3 | 4

export type ScaleUnit = 'mm' | 'cm' | 'm' | 'in'

export type SegmentType = 'line' | 'bezier'

/** Asas de un tramo curvo: desplazamientos desde el punto de inicio (cp1) y desde el punto siguiente (cp2). */
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

export type NotchType = 'I' | 'V' | 'T'

/** Notch visual (no se exporta): punto cualquiera que se dibuja pegado al contorno, hacia el interior. */
export interface Notch {
  id: string
  x: number
  y: number
  type: NotchType
  /** Profundidad en mm. */
  depth: number
  flipped: boolean
  /** Giro en grados respecto a la normal del contorno (Ctrl + arrastrar); 0 o sin definir = perpendicular. */
  angle?: number
  /** Trazo guardado (índice en `paths`) al que pertenece; sin definir = el trazo activo. */
  pathIndex?: number
}

/** Drill: círculo de perforación centrado en (x, y), con su diámetro en mm. */
export interface Drill {
  id: string
  x: number
  y: number
  /** Diámetro en mm (el radio se calcula). */
  diameter: number
}

/** Una pieza de patrón: su contorno editable y los trazos guardados (agujeros, contornos interiores). */
export interface Piece {
  id: string
  name: string
  quantity: number
  contourPoints: ContourPoint[]
  paths: ContourPoint[][]
  notches: Notch[]
  /** Drills de la pieza; las piezas guardadas antes de existir no lo traen. */
  drills?: Drill[]
}

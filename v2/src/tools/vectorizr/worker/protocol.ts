// Mensajes entre opencvClient (hilo principal) y opencv.worker. Solo tipos: el worker los importa
// con `import type`, así que no se emite ningún export en él y Vite lo mantiene como script clásico.
import type { DetectParams, ImagePoint } from '../types'

export interface InitRequest {
  type: 'init'
  opencvUrl: string
}

export interface DetectRequest extends DetectParams {
  type: 'detect'
  id: number
  width: number
  height: number
  /** Píxeles RGBA; su buffer se transfiere (M8), el ImageData original queda vacío. */
  data: Uint8ClampedArray
}

export type WorkerRequest = InitRequest | DetectRequest

export interface ReadyResponse {
  type: 'ready'
}

export interface ContourResponse {
  type: 'contour'
  id: number
  points: ImagePoint[]
}

/** Sin `id`: fallo al cargar OpenCV (fatal). Con `id`: falló esa detección (M12). */
export interface ErrorResponse {
  type: 'error'
  id?: number
  message: string
}

export type WorkerResponse = ReadyResponse | ContourResponse | ErrorResponse

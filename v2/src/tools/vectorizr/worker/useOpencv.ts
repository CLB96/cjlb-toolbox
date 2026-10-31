// Hook de React sobre el cliente singleton de OpenCV. Llamar a `detect` inicia la carga si está en 'idle'.
import { useCallback, useSyncExternalStore } from 'react'
import type { DetectParams, ImagePoint, OpencvStatus } from '../types'
import { getOpencvClient } from './opencvClient'

export interface UseOpencv {
  status: OpencvStatus
  error: string | null
  /** Rechaza con Error(message) si el worker falla. Transfiere el buffer de `imageData`. */
  detect(imageData: ImageData, params: DetectParams): Promise<ImagePoint[]>
}

export function useOpencv(): UseOpencv {
  const client = getOpencvClient()
  const { status, error } = useSyncExternalStore(client.subscribe, client.getSnapshot)
  const detect = useCallback(
    (imageData: ImageData, params: DetectParams) => client.detect(imageData, params),
    [client],
  )
  return { status, error, detect }
}

// Worker clásico de OpenCV (mismo protocolo que Digitalizacion/src/workers/opencv.worker.ts, más ids,
// errores y cola). No debe tener exports: Vite lo emitiría como módulo ESM y importScripts no existe ahí.
import { detect, detectAll, previewMask } from './detect'
import type { WorkerRequest, WorkerResponse } from './protocol'

declare const cv: unknown

interface WorkerScope {
  Module?: { onRuntimeInitialized?: () => void }
  importScripts(...urls: string[]): void
  postMessage(message: WorkerResponse): void
  addEventListener(type: 'message', listener: (e: MessageEvent<WorkerRequest>) => void): void
}
const scope = self as unknown as WorkerScope

let opencvReady = false
let opencvLoaded = false

const post = (msg: WorkerResponse) => scope.postMessage(msg)
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

scope.Module = {
  onRuntimeInitialized() {
    opencvReady = true
    post({ type: 'ready' })
  },
}

scope.addEventListener('message', (e) => {
  const req = e.data
  if (req.type === 'init') {
    if (opencvLoaded) return
    opencvLoaded = true
    try {
      scope.importScripts(req.opencvUrl)
    } catch (err) {
      post({ type: 'error', message: errorMessage(err) })
    }
    return
  }
  if (req.type !== 'detect') return
  if (!opencvReady) {
    // El cliente no envía nada antes de 'ready'; si pasa, se responde en vez de descartarlo en silencio.
    post({ type: 'error', id: req.id, message: 'OpenCV no está listo' })
    return
  }
  try {
    const { id, data, width, height, method, threshold1, threshold2, multi, mask, ignoreTransparent, detail, polarity } = req
    const input = { imageData: { data, width, height }, method, threshold1, threshold2, ignoreTransparent, detail, polarity }
    if (mask) {
      const m = previewMask(cv, input)
      post({ type: 'mask', id, width: m.width, height: m.height, data: m.data })
    } else if (multi) post({ type: 'contours', id, contours: detectAll(cv, input) })
    else post({ type: 'contour', id, points: detect(cv, input) })
  } catch (err) {
    post({ type: 'error', id: req.id, message: errorMessage(err) })
  }
})

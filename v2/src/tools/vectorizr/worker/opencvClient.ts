// Cliente del worker de OpenCV: singleton perezoso (se crea al primer uso), cola de detecciones hasta
// 'ready' (M12), una petición a la vez y errores que rechazan la promesa en vez de colgar el spinner.
import type { DetectParams, ImagePoint, OpencvStatus } from '../types'
import type { DetectRequest, InitRequest, WorkerResponse } from './protocol'

export interface WorkerLike {
  postMessage(message: unknown, transfer?: Transferable[]): void
  terminate(): void
  onmessage: ((e: MessageEvent) => void) | null
  onerror: ((e: Event) => void) | null
}

export interface OpencvSnapshot {
  status: OpencvStatus
  error: string | null
}

export interface OpencvClient {
  getSnapshot(): OpencvSnapshot
  subscribe(listener: () => void): () => void
  /** Empieza a cargar OpenCV si aún no se ha hecho (o si falló antes). */
  preload(): void
  /** Detecta el contorno mayor. El buffer de `imageData` se transfiere: no reutilices ese ImageData. */
  detect(imageData: ImageData, params: DetectParams): Promise<ImagePoint[]>
  /** Termina el worker, rechaza lo pendiente y vuelve a 'idle'. */
  dispose(): void
}

interface Job {
  id: number
  imageData: ImageData
  params: DetectParams
  resolve: (points: ImagePoint[]) => void
  reject: (err: Error) => void
}

const DISPOSED = 'El worker de OpenCV se cerró'
const LOAD_FAILED = 'No se pudo cargar OpenCV'

export function createOpencvClient(createWorker: () => WorkerLike, opencvUrl: () => string): OpencvClient {
  let snapshot: OpencvSnapshot = { status: 'idle', error: null }
  const listeners = new Set<() => void>()
  let worker: WorkerLike | null = null
  let queue: Job[] = []
  let inFlight: Job | null = null
  let nextId = 1

  const setSnapshot = (next: OpencvSnapshot) => {
    snapshot = next
    listeners.forEach((l) => l())
  }

  const failAll = (message: string) => {
    const jobs = [...(inFlight ? [inFlight] : []), ...queue]
    inFlight = null
    queue = []
    jobs.forEach((j) => j.reject(new Error(message)))
  }

  const pump = () => {
    if (!worker || inFlight || snapshot.status !== 'ready' || queue.length === 0) return
    const [job, ...rest] = queue
    queue = rest
    inFlight = job
    const { data, width, height } = job.imageData
    const msg: DetectRequest = { type: 'detect', id: job.id, data, width, height, ...job.params }
    worker.postMessage(msg, [data.buffer])
  }

  const teardown = () => {
    if (!worker) return
    worker.onmessage = null
    worker.onerror = null
    worker.terminate()
    worker = null
  }

  const fatal = (message: string) => {
    teardown()
    failAll(message)
    setSnapshot({ status: 'error', error: message })
  }

  const onMessage = (e: MessageEvent) => {
    const res = e.data as WorkerResponse
    if (res.type === 'ready') {
      setSnapshot({ status: 'ready', error: null })
      pump()
      return
    }
    if (res.type === 'error' && res.id === undefined) {
      fatal(res.message || LOAD_FAILED)
      return
    }
    if (!inFlight || res.id !== inFlight.id) return
    const job = inFlight
    inFlight = null
    if (res.type === 'contour') job.resolve(res.points)
    else job.reject(new Error(res.message))
    pump()
  }

  const start = () => {
    if (worker) return
    const w = createWorker()
    worker = w
    w.onmessage = onMessage
    // Fallo al cargar o ejecutar el script del worker (p. ej. CSP o red).
    w.onerror = (e) => fatal((e as ErrorEvent).message || LOAD_FAILED)
    setSnapshot({ status: 'loading', error: null })
    const init: InitRequest = { type: 'init', opencvUrl: opencvUrl() }
    w.postMessage(init)
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    preload: start,
    detect(imageData, params) {
      return new Promise<ImagePoint[]>((resolve, reject) => {
        queue = [...queue, { id: nextId++, imageData, params, resolve, reject }]
        start()
        pump()
      })
    },
    dispose() {
      teardown()
      failAll(DISPOSED)
      if (snapshot.status !== 'idle') setSnapshot({ status: 'idle', error: null })
    },
  }
}

// --- Singleton de la app ---

const appClient = createOpencvClient(
  () => new Worker(new URL('./opencv.worker.ts', import.meta.url)) as unknown as WorkerLike,
  () => new URL(`${import.meta.env.BASE_URL}vendor/opencv/opencv-806cb564.js`, location.origin).href,
)

export function getOpencvClient(): OpencvClient {
  return appClient
}

/** Precarga OpenCV en segundo plano (M10). */
export function preloadOpencv(): void {
  appClient.preload()
}

/** Termina el worker (al desmontar la herramienta). El siguiente uso lo vuelve a crear. */
export function disposeOpencvClient(): void {
  appClient.dispose()
}

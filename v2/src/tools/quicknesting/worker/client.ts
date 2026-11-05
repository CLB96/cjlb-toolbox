// Cliente del worker: una promesa por petición. Sin Worker (pruebas), atiende en el mismo hilo.
import type { ImportResult } from '../logic/importer'
import type { NestPayload, NestResult } from '../logic/types'
import { handle } from './handle'
import type { WorkerRequest, WorkerResponse } from './protocol'

export class QnRequestError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'QnRequestError'
  }
}

type Pending = { resolve: (r: WorkerResponse) => void }

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, Pending>()

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  if (!worker) {
    // Módulo: en desarrollo Vite lo sirve con sus imports; en el build lo empaqueta en un solo archivo.
    worker = new Worker(new URL('./quicknesting.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const entry = pending.get(event.data.id)
      pending.delete(event.data.id)
      entry?.resolve(event.data)
    }
    worker.onerror = () => {
      for (const [id, entry] of pending) entry.resolve({ type: 'error', id, code: 'worker_failed' })
      pending.clear()
      worker?.terminate()
      worker = null
    }
  }
  return worker
}

async function send(request: WorkerRequest): Promise<WorkerResponse> {
  const w = getWorker()
  if (!w) return handle(request)
  return new Promise((resolve) => {
    pending.set(request.id, { resolve })
    w.postMessage(request)
  })
}

export async function requestImport(data: Uint8Array, unitMm: number | null): Promise<ImportResult> {
  const response = await send({ type: 'import', id: nextId++, data, unitMm })
  if (response.type === 'import') return response.result
  throw new QnRequestError(response.type === 'error' ? response.code : 'unexpected_response')
}

export async function requestNest(payload: NestPayload): Promise<NestResult> {
  const response = await send({ type: 'nest', id: nextId++, payload })
  if (response.type === 'nest') return response.result
  throw new QnRequestError(response.type === 'error' ? response.code : 'unexpected_response')
}

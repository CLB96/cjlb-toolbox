import { importDxf } from '../logic/importer'
import { nest } from '../logic/roll'
import { InputError } from '../logic/types'
import type { WorkerRequest, WorkerResponse } from './protocol'

/** Atiende una petición. Los errores de entrada viajan con su código; los demás, sin detalles. */
export function handle(request: WorkerRequest): WorkerResponse {
  try {
    if (request.type === 'import') return { type: 'import', id: request.id, result: importDxf(request.data, request.unitMm) }
    return { type: 'nest', id: request.id, result: nest(request.payload) }
  } catch (error) {
    return { type: 'error', id: request.id, code: error instanceof InputError ? error.code : 'internal_error' }
  }
}

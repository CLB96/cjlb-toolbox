// Mensajes entre el hilo principal y quicknesting.worker.
import type { ImportResult } from '../logic/importer'
import type { NestPayload, NestResult } from '../logic/types'

export type WorkerRequest =
  | { type: 'import'; id: number; data: Uint8Array; unitMm: number | null }
  | { type: 'nest'; id: number; payload: NestPayload }

export type WorkerResponse =
  | { type: 'import'; id: number; result: ImportResult }
  | { type: 'nest'; id: number; result: NestResult }
  | { type: 'error'; id: number; code: string }

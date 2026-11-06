// Estado de la pantalla. Cualquier cambio de ajustes o de selección invalida el resultado.
import { createStore } from 'zustand/vanilla'
import type { ImportResult } from './logic/importer'
import type { NestResult, QuantityMode, RotationMode } from './logic/types'

export interface QnForm {
  width: string
  length: string
  gap: string
  marginEnabled: boolean
  margin: string
  mode: QuantityMode
  quantity: string
  multiplePlies: boolean
  rotation: RotationMode
  anglePreset: string
  customAngle: string
  /** Automático con huecos y varios patrones: misma cantidad de cada uno. */
  balanced: boolean
}

export type MessageKind = '' | 'ok' | 'error'

export interface QnMessage {
  key: string
  kind: MessageKind
  values: Record<string, string | number>
}

export interface QnData {
  form: QnForm
  fileName: string | null
  /** Bytes del DXF para releerlo al cambiar la interpretación de unidades. */
  fileData: Uint8Array | null
  units: string
  imported: ImportResult | null
  /** Sube con cada importación: el diagnóstico vuelve a empezar cerrado. */
  importCount: number
  selected: string[]
  confirmed: boolean
  previewId: string | null
  result: NestResult | null
  viewGroup: string | null
  busy: boolean
  revision: number
  message: QnMessage
}

export interface QnActions {
  setField: <K extends keyof QnForm>(key: K, value: QnForm[K]) => void
  toggleContour: (id: string, on: boolean) => void
  setConfirmed: (on: boolean) => void
  viewContour: (id: string) => void
  setViewGroup: (key: string | null) => void
  setUnits: (units: string) => void
  setBusy: (busy: boolean) => void
  say: (key: string, kind?: MessageKind, values?: Record<string, string | number>) => void
  beginImport: (fileName: string | null, fileData: Uint8Array | null) => void
  finishImport: (imported: ImportResult) => void
  setResult: (result: NestResult) => void
}

export type QnStore = QnData & QnActions
export type QnApi = ReturnType<typeof createQnStore>

export const DEFAULT_FORM: QnForm = {
  width: '1450', length: '2500', gap: '3', marginEnabled: false, margin: '10', mode: 'auto',
  quantity: '8', multiplePlies: false, rotation: 'fixed', anglePreset: '0', customAngle: '15', balanced: false,
}

const cleared = (s: QnData) => ({ result: null, viewGroup: null, revision: s.revision + 1 })
const stale = { key: 'stale', kind: '' as MessageKind, values: {} }

export function createQnStore() {
  return createStore<QnStore>()((set) => ({
    form: DEFAULT_FORM,
    fileName: null,
    fileData: null,
    units: 'declared',
    imported: null,
    importCount: 0,
    selected: [],
    confirmed: false,
    previewId: null,
    result: null,
    viewGroup: null,
    busy: false,
    revision: 0,
    message: { key: 'idle', kind: '', values: {} },

    setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value }, ...cleared(s), message: stale })),
    toggleContour: (id, on) => set((s) => ({
      selected: on ? [...s.selected.filter((x) => x !== id), id] : s.selected.filter((x) => x !== id),
      previewId: null, confirmed: false, ...cleared(s), message: stale,
    })),
    setConfirmed: (on) => set((s) => ({ confirmed: on, ...cleared(s), message: stale })),
    viewContour: (id) => set((s) => ({ previewId: id, ...cleared(s), message: { key: 'previewPattern', kind: '', values: {} } })),
    setViewGroup: (key) => set({ viewGroup: key }),
    setUnits: (units) => set({ units }),
    setBusy: (busy) => set({ busy }),
    say: (key, kind = '', values = {}) => set({ message: { key, kind, values } }),
    beginImport: (fileName, fileData) => set((s) => ({
      ...cleared(s),
      imported: null, selected: [], previewId: null, confirmed: false, importCount: s.importCount + 1,
      ...(fileData ? { fileName, fileData, units: 'declared' } : {}),
      message: { key: 'importing', kind: '', values: {} },
    })),
    finishImport: (imported) => set({ imported, message: { key: 'imported', kind: 'ok', values: {} } }),
    setResult: (result) => set({ result }),
  }))
}

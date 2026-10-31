// Port de Digitalizacion/src/store/appStore.ts como store por montaje (patrón Gantt).
// Cambios de plataforma: la imagen se guarda como { blob, image } y los parámetros de
// detección del Paso 3 viven aquí para persistirlos (plan §4).
import { createStore, type StoreApi } from 'zustand/vanilla'
import { loadImageFromBlob } from './logic/imageNormalize'
import type { AppStep, ContourPoint, ContourSnapshot, DetectionMethod, ScaleRef, ToolId } from './types'

/** Rangos de los sliders del original (Step3Vectorize.tsx:259-260). */
export const THRESHOLD_LIMITS = {
  low: { min: 10, max: 200 },
  high: { min: 50, max: 400 },
} as const

export interface LoadedImage {
  blob: Blob
  image: HTMLImageElement
}

export interface VectorizrData {
  step: AppStep
  image: LoadedImage | null
  /** Blob restaurado cuya imagen aún se está cargando (no se pierde si se guarda antes). */
  restoringBlob: Blob | null
  imageWidth: number
  imageHeight: number
  scaleRef: ScaleRef | null
  scaleFactor: number
  /** Trazo activo (editable) */
  contourPoints: ContourPoint[]
  /** Trazos finalizados */
  paths: ContourPoint[][]
  history: ContourSnapshot[]
  historyIndex: number
  activeToolId: ToolId
  zoom: number
  stagePos: { x: number; y: number }
  imageRotation: number
  exported: boolean
  detectionMethod: DetectionMethod
  threshold1: number
  threshold2: number
}

export interface VectorizrActions {
  setStep(step: AppStep): void
  setImage(image: LoadedImage, w: number, h: number): void
  setScaleRef(ref: ScaleRef, factor: number): void
  setContourPoints(points: ContourPoint[]): void
  addNewPath(): void
  removePathAt(index: number): void
  setPaths(paths: ContourPoint[][], active?: ContourPoint[]): void
  pushHistory(): void
  undo(): void
  redo(): void
  setActiveTool(id: ToolId): void
  setZoom(z: number): void
  setStagePos(pos: { x: number; y: number }): void
  setImageRotation(r: number): void
  setExported(v: boolean): void
  setDetectionMethod(m: DetectionMethod): void
  /** M19: el umbral bajo queda siempre por debajo del alto. */
  setThreshold1(v: number): void
  setThreshold2(v: number): void
  reset(): void
}

export type VectorizrStore = VectorizrData & VectorizrActions
export type VectorizrApi = StoreApi<VectorizrStore>

/** Lo que se guarda (plan §4): sin historial, zoom, pan, herramienta ni exportado. */
export interface VectorizrSnapshot {
  step: AppStep
  imageBlob: Blob | null
  imageWidth: number
  imageHeight: number
  scaleRef: ScaleRef | null
  scaleFactor: number
  contourPoints: ContourPoint[]
  paths: ContourPoint[][]
  imageRotation: number
  detectionMethod: DetectionMethod
  threshold1: number
  threshold2: number
}

export function initialData(): VectorizrData {
  return {
    step: 1,
    image: null,
    restoringBlob: null,
    imageWidth: 0,
    imageHeight: 0,
    scaleRef: null,
    scaleFactor: 0,
    contourPoints: [],
    paths: [],
    history: [],
    historyIndex: -1,
    activeToolId: 'select',
    zoom: 1,
    stagePos: { x: 0, y: 0 },
    imageRotation: 0,
    exported: false,
    detectionMethod: 0,
    threshold1: 50,
    threshold2: 150,
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Libera la object URL de una imagen que deja de usarse (loadImageFromBlob no la revoca). */
function releaseImage(prev: LoadedImage | null, next: LoadedImage | null): void {
  if (prev && prev !== next && prev.image.src.startsWith('blob:')) URL.revokeObjectURL(prev.image.src)
}

export function createVectorizrStore(): VectorizrApi {
  const api = createStore<VectorizrStore>((set, get) => ({
    ...initialData(),

    setStep: (step) => set({ step }),
    setImage: (image, imageWidth, imageHeight) => set({ image, restoringBlob: null, imageWidth, imageHeight }),
    setScaleRef: (scaleRef, scaleFactor) => set({ scaleRef, scaleFactor }),
    setContourPoints: (contourPoints) => set({ contourPoints }),

    addNewPath: () => {
      const { contourPoints, paths } = get()
      if (contourPoints.length < 2) return
      set({
        paths: [...paths, contourPoints.map((p) => ({ ...p }))],
        contourPoints: [],
        history: [],
        historyIndex: -1,
      })
    },

    removePathAt: (index) => set({ paths: get().paths.filter((_, i) => i !== index) }),
    setPaths: (paths, active = []) => set({ paths, contourPoints: active }),

    pushHistory: () => {
      const { contourPoints, history, historyIndex } = get()
      const snapshot: ContourSnapshot = { points: contourPoints.map((p) => ({ ...p })) }
      const newHistory = [...history.slice(0, historyIndex + 1), snapshot]
      set({ history: newHistory, historyIndex: newHistory.length - 1 })
    },

    undo: () => {
      const { history, historyIndex } = get()
      if (historyIndex <= 0) return
      set({ contourPoints: history[historyIndex - 1]!.points, historyIndex: historyIndex - 1 })
    },

    redo: () => {
      const { history, historyIndex } = get()
      if (historyIndex >= history.length - 1) return
      set({ contourPoints: history[historyIndex + 1]!.points, historyIndex: historyIndex + 1 })
    },

    setActiveTool: (activeToolId) => set({ activeToolId }),
    setZoom: (zoom) => set({ zoom }),
    setStagePos: (stagePos) => set({ stagePos }),
    setImageRotation: (imageRotation) => set({ imageRotation }),
    setExported: (exported) => set({ exported }),
    setDetectionMethod: (detectionMethod) => set({ detectionMethod }),

    setThreshold1: (v) => {
      const { low } = THRESHOLD_LIMITS
      set({ threshold1: Math.min(clamp(Math.round(v), low.min, low.max), get().threshold2 - 1) })
    },
    setThreshold2: (v) => {
      const { high } = THRESHOLD_LIMITS
      set({ threshold2: Math.max(clamp(Math.round(v), high.min, high.max), get().threshold1 + 1) })
    },

    reset: () => set(initialData()),
  }))
  api.subscribe((s, prev) => releaseImage(prev.image, s.image))
  return api
}

export function snapshotOf(s: VectorizrData): VectorizrSnapshot {
  return {
    step: s.step,
    imageBlob: s.image?.blob ?? s.restoringBlob,
    imageWidth: s.imageWidth,
    imageHeight: s.imageHeight,
    scaleRef: s.scaleRef,
    scaleFactor: s.scaleFactor,
    contourPoints: s.contourPoints,
    paths: s.paths,
    imageRotation: s.imageRotation,
    detectionMethod: s.detectionMethod,
    threshold1: s.threshold1,
    threshold2: s.threshold2,
  }
}

const isStep = (v: unknown): v is AppStep => v === 1 || v === 2 || v === 3 || v === 4

/** Blob o equivalente estructural (el clon de IndexedDB puede venir de otro realm). */
const isBlobLike = (v: unknown): v is Blob =>
  v instanceof Blob || (typeof v === 'object' && v !== null && typeof (v as Blob).size === 'number' && typeof (v as Blob).slice === 'function')

/**
 * Aplica un snapshot; la imagen se reconstruye en segundo plano desde el Blob.
 * Sin imagen (o si no se puede cargar) se vuelve al Paso 1.
 */
export function restoreInto(api: VectorizrApi, snap: VectorizrSnapshot): void {
  const base = initialData()
  const blob = isBlobLike(snap.imageBlob) ? snap.imageBlob : null
  const t1 = Number.isFinite(snap.threshold1) ? snap.threshold1 : base.threshold1
  const t2 = Number.isFinite(snap.threshold2) ? snap.threshold2 : base.threshold2
  api.setState({
    ...base,
    step: blob && isStep(snap.step) ? snap.step : 1,
    restoringBlob: blob,
    imageWidth: snap.imageWidth ?? 0,
    imageHeight: snap.imageHeight ?? 0,
    scaleRef: snap.scaleRef ?? null,
    scaleFactor: snap.scaleFactor ?? 0,
    contourPoints: Array.isArray(snap.contourPoints) ? snap.contourPoints : [],
    paths: Array.isArray(snap.paths) ? snap.paths : [],
    imageRotation: snap.imageRotation ?? 0,
    detectionMethod: snap.detectionMethod === 1 ? 1 : 0,
    threshold1: t1 < t2 ? t1 : base.threshold1,
    threshold2: t1 < t2 ? t2 : base.threshold2,
  })
  if (!blob) return
  loadImageFromBlob(blob).then(
    (image) => {
      // otra restauración o un reset pudieron llegar mientras tanto
      if (api.getState().restoringBlob === blob) api.setState({ image: { blob, image }, restoringBlob: null })
    },
    () => {
      if (api.getState().restoringBlob === blob) api.setState({ ...initialData() })
    },
  )
}

export function resetInto(api: VectorizrApi): void {
  api.setState(initialData())
}

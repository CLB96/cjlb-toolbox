import { createStore, type StoreApi } from 'zustand/vanilla'
import {
  runAnalysis,
  SAMPLE_INPUT,
  type AnalysisErrorCode,
  type AnalysisInput,
  type AnalysisResult,
  type CCTypeChoice,
} from './logic'

export const MARKER_SIZE_DEFAULT = 36

/** Campos del formulario: los del original (`lsl`, `usl`, ...) más "Confianza (%)", que el original nunca usa. */
export interface CapaForm extends AnalysisInput {
  confidence: string
}

/** Un análisis acumulado del proyecto (equivale a una entrada de `_results` del original). */
export interface CapaPoint {
  /** Índice del original (`_analysisCounter` en el momento de calcular). */
  id: number
  result: AnalysisResult
  ccType: CCTypeChoice
  /** Marca de tiempo del cálculo (el original muestra la hora). */
  at: number
}

export interface PhotoMarker {
  x: number
  y: number
}

export type PanelKey = 'run' | 'qq' | 'box' | 'photo'

/** Datos persistibles y clonables. */
export interface CapaState {
  form: CapaForm
  points: CapaPoint[]
  activeId: number | null
  counter: number
  photo: Blob | null
  photoName: string | null
  /** Solo los marcadores colocados (el original guarda `placed`); ausente = en la bandeja. */
  markers: Record<number, PhotoMarker>
  markerSize: number
  photoFit: boolean
  panels: Record<PanelKey, boolean>
  /** Campo "Nombre del proyecto" (folderNameInput del original): cabecera del resumen y carpeta del ZIP. */
  projectName: string
}

export type CalculateResult = { ok: true } | { ok: false; error: AnalysisErrorCode }

export interface CapaActions {
  setField(key: keyof CapaForm, value: string): void
  loadSample(): void
  calculate(): CalculateResult
  selectPoint(id: number): void
  deletePoint(id: number): void
  clearProject(): void
  setCCType(id: number, type: CCTypeChoice): void
  setPhoto(photo: Blob | null, name: string | null): void
  placeMarker(id: number, x: number, y: number): void
  removeMarker(id: number): void
  setMarkerSize(size: number): void
  setPhotoFit(fit: boolean): void
  setPanel(panel: PanelKey, open: boolean): void
  setProjectName(name: string): void
}

export type CapaStore = CapaState & CapaActions
export type CapaApi = StoreApi<CapaStore>

const emptyForm = (): CapaForm => ({ raw: '', lsl: '', usl: '', target: '', subgroupSize: '5', pointName: '', confidence: '95' })

export const initialData = (): CapaState => ({
  form: emptyForm(),
  points: [],
  activeId: null,
  counter: 0,
  photo: null,
  photoName: null,
  markers: {},
  markerSize: MARKER_SIZE_DEFAULT,
  photoFit: true,
  panels: { run: false, qq: false, box: false, photo: false },
  projectName: '',
})

/** Dropped marker position: the original clamps the drop to 3..97 %. */
export const clampDrop = (v: number): number => Math.max(3, Math.min(97, v))

/** Un store por instancia de la herramienta: no comparte estado entre usuarios. */
export const createCapaStore = (): CapaApi =>
  createStore<CapaStore>()((set, get) => ({
    ...initialData(),

    setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),

    // Igual que loadSampleData: toca los cinco campos y deja el nombre del punto como está.
    loadSample: () => set((s) => ({ form: { ...s.form, ...SAMPLE_INPUT, pointName: s.form.pointName } })),

    calculate() {
      const outcome = runAnalysis(get().form)
      if (!outcome.ok) return outcome
      set((s) => {
        const point: CapaPoint = { id: s.counter, result: outcome.result, ccType: 'auto', at: Date.now() }
        return { points: [...s.points, point], activeId: point.id, counter: s.counter + 1 }
      })
      return { ok: true }
    },

    selectPoint: (id) => set((s) => (s.points.some((p) => p.id === id) ? { activeId: id } : s)),

    deletePoint(id) {
      set((s) => {
        const pos = s.points.findIndex((p) => p.id === id)
        if (pos === -1) return s
        const points = s.points.filter((p) => p.id !== id)
        const { [id]: _removed, ...markers } = s.markers
        if (points.length === 0) return { points, markers, activeId: null, counter: 0 }
        // como el original: se queda en la misma posición (o la última)
        const keep = s.points.findIndex((p) => p.id === s.activeId)
        const activeId = keep === -1 || keep === pos ? points[Math.min(pos, points.length - 1)]!.id : s.activeId
        return { points, markers, activeId }
      })
    },

    // El original no toca los campos del formulario al limpiar el proyecto.
    clearProject: () =>
      set({ points: [], activeId: null, counter: 0, markers: {}, photo: null, photoName: null }),

    setCCType: (id, type) =>
      set((s) => ({ points: s.points.map((p) => (p.id === id ? { ...p, ccType: type } : p)) })),

    setPhoto: (photo, photoName) => set({ photo, photoName }),

    placeMarker: (id, x, y) =>
      set((s) => (s.points.some((p) => p.id === id) ? { markers: { ...s.markers, [id]: { x, y } } } : s)),

    removeMarker(id) {
      set((s) => {
        const { [id]: _removed, ...markers } = s.markers
        return { markers }
      })
    },

    setMarkerSize: (markerSize) => set({ markerSize }),
    setPhotoFit: (photoFit) => set({ photoFit }),
    setPanel: (panel, open) => set((s) => ({ panels: { ...s.panels, [panel]: open } })),
    setProjectName: (projectName) => set({ projectName }),
  }))

export function snapshotOf(s: CapaState): CapaState {
  return {
    form: s.form,
    points: s.points,
    activeId: s.activeId,
    counter: s.counter,
    photo: s.photo,
    photoName: s.photoName,
    markers: s.markers,
    markerSize: s.markerSize,
    photoFit: s.photoFit,
    panels: s.panels,
    projectName: s.projectName,
  }
}

/** Aplica un snapshot guardado; completa lo que falte (versiones anteriores) y valida el análisis activo. */
export function restoreInto(api: CapaApi, snapshot: CapaState): void {
  const base = initialData()
  const points = Array.isArray(snapshot.points) ? snapshot.points : []
  const activeId = points.some((p) => p.id === snapshot.activeId) ? snapshot.activeId : (points[points.length - 1]?.id ?? null)
  api.setState({
    ...base,
    ...snapshot,
    form: { ...base.form, ...snapshot.form },
    points,
    activeId,
    counter: Math.max(snapshot.counter ?? 0, ...points.map((p) => p.id + 1)),
    markers: snapshot.markers ?? {},
    panels: { ...base.panels, ...snapshot.panels },
  })
}

export function resetInto(api: CapaApi): void {
  api.setState(initialData())
}

export const selectActive = (s: CapaState): CapaPoint | null => s.points.find((p) => p.id === s.activeId) ?? null

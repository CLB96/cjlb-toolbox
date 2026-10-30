import { create } from 'zustand'
import { computeStats } from './logic/stats'
import { computeTarget } from './logic/target'
import { defaultMarkerPositions } from './logic/markers'
import { parseRows } from './logic/parse'
import {
  DEFAULT_TARGET_INPUTS,
  type CoveringType,
  type GapPoint,
  type KpiTexts,
  type TargetInputs,
} from './logic/types'

export const DEFAULT_MARKER_SIZE = 44

export interface LayoutMarker {
  pointIndex: number
  x: number
  y: number
}

export interface LayoutState {
  image: Blob | null
  imageName: string | null
  markers: LayoutMarker[]
  markerSize: number
}

/** Datos persistibles (arrays en vez de Set para ser clonables). */
export interface GapcheckState {
  fileName: string | null
  points: GapPoint[]
  maxIter: number
  visiblePoints: number[]
  visibleIters: number[]
  covering: CoveringType
  inputs: TargetInputs
  appliedTarget: number
  appliedCovering: CoveringType
  appliedInputs: TargetInputs
  tableOpen: boolean
  layout: LayoutState
}

export interface GapcheckActions {
  loadRows(fileName: string, rows: unknown[][]): boolean
  togglePoint(index: number): void
  toggleIter(index: number): void
  setCovering(covering: CoveringType): void
  setInput(key: keyof TargetInputs, value: string): void
  applyComparison(): void
  setTableOpen(open: boolean): void
  setLayoutImage(image: Blob | null, name: string | null): void
  moveMarker(pointIndex: number, x: number, y: number): void
  setMarkerSize(size: number): void
  reset(): void
}

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i)

const toggled = (list: number[], value: number): number[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

const markersFor = (count: number): LayoutMarker[] =>
  defaultMarkerPositions(count).map((p, pointIndex) => ({ pointIndex, x: p.x, y: p.y }))

const initialLayout = (): LayoutState => ({
  image: null,
  imageName: null,
  markers: [],
  markerSize: DEFAULT_MARKER_SIZE,
})

export const initialData = (): GapcheckState => ({
  fileName: null,
  points: [],
  maxIter: 0,
  visiblePoints: [],
  visibleIters: [],
  covering: 'hard',
  inputs: { ...DEFAULT_TARGET_INPUTS },
  appliedTarget: computeTarget('hard', DEFAULT_TARGET_INPUTS).target,
  appliedCovering: 'hard',
  appliedInputs: { ...DEFAULT_TARGET_INPUTS },
  tableOpen: false,
  layout: initialLayout(),
})

const comparisonOf = (s: Pick<GapcheckState, 'covering' | 'inputs'>) => ({
  appliedCovering: s.covering,
  appliedInputs: { ...s.inputs },
  appliedTarget: computeTarget(s.covering, s.inputs).target,
})

export const useGapcheckStore = create<GapcheckState & GapcheckActions>()((set, get) => ({
  ...initialData(),

  loadRows(fileName, rows) {
    const parsed = parseRows(rows)
    if (!parsed) return false
    const { layout, covering, inputs } = get()
    set({
      fileName,
      points: parsed.points,
      maxIter: parsed.maxIter,
      visiblePoints: range(parsed.points.length),
      visibleIters: range(parsed.maxIter),
      ...comparisonOf({ covering, inputs }),
      layout: layout.image
        ? { ...layout, markers: markersFor(parsed.points.length) }
        : layout,
    })
    return true
  },

  togglePoint: (i) => set((s) => ({ visiblePoints: toggled(s.visiblePoints, i) })),
  toggleIter: (j) => set((s) => ({ visibleIters: toggled(s.visibleIters, j) })),
  setCovering: (covering) => set({ covering }),
  setInput: (key, value) => set((s) => ({ inputs: { ...s.inputs, [key]: value } })),
  applyComparison: () => set((s) => comparisonOf(s)),
  setTableOpen: (tableOpen) => set({ tableOpen }),

  setLayoutImage(image, imageName) {
    set((s) => ({
      layout: {
        ...s.layout,
        image,
        imageName,
        markers: image && s.points.length > 0 ? markersFor(s.points.length) : s.layout.markers,
      },
    }))
  },

  moveMarker: (pointIndex, x, y) =>
    set((s) => ({
      layout: {
        ...s.layout,
        markers: s.layout.markers.map((m) => (m.pointIndex === pointIndex ? { ...m, x, y } : m)),
      },
    })),

  setMarkerSize: (markerSize) => set((s) => ({ layout: { ...s.layout, markerSize } })),

  reset: () => set(initialData()),
}))

export const selectKpis = (s: GapcheckState): KpiTexts =>
  computeStats(s.points, new Set(s.visiblePoints), new Set(s.visibleIters), s.appliedTarget)

export const selectLiveTarget = (s: GapcheckState) => computeTarget(s.covering, s.inputs)

/** Solo los datos (sin acciones), aptos para structured clone. */
export function getGapcheckSnapshot(): GapcheckState {
  const s = useGapcheckStore.getState()
  return {
    fileName: s.fileName,
    points: s.points,
    maxIter: s.maxIter,
    visiblePoints: s.visiblePoints,
    visibleIters: s.visibleIters,
    covering: s.covering,
    inputs: s.inputs,
    appliedTarget: s.appliedTarget,
    appliedCovering: s.appliedCovering,
    appliedInputs: s.appliedInputs,
    tableOpen: s.tableOpen,
    layout: s.layout,
  }
}

export function restoreGapcheck(snapshot: GapcheckState): void {
  useGapcheckStore.setState({ ...initialData(), ...snapshot })
}

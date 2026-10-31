import { createStore, type StoreApi } from 'zustand/vanilla'
import type { GanttKey } from './i18n'
import { deleteSubtree, duplicateSubtree, moveTask, normalizeTask, type MoveError } from './logic/mutations'
import { deserializeTask, serializeTask } from './logic/tree'
import type { FilterValue, SortValue, Status, StoredTask, Task, ViewMode } from './logic/types'

export const MAX_CHARTS = 5
export const TASK_COL_MIN = 80
export const TASK_COL_MAX = 520

/** Buscar, filtrar y ordenar: cada Gantt recuerda los suyos (mejora B3). */
export interface ChartView {
  search: string
  filter: FilterValue
  sort: SortValue
}

export interface GanttChart {
  id: string
  name: string
  tasks: StoredTask[]
  nextId: number
  /** Tareas plegadas, guardadas con el Gantt (mejora B1). */
  collapsed: number[]
  view: ChartView
}

/** Preferencias del original (savePrefs) comunes a todos los Gantts. */
export interface GanttPrefs {
  viewMode: ViewMode
  taskColWidth: number
  formOpen: boolean
  statsOpen: boolean
  insightOpen: boolean
}

/** Datos persistibles y clonables. */
export interface GanttState {
  charts: GanttChart[]
  activeId: string
  chartSeq: number
  prefs: GanttPrefs
}

/** Estado de pantalla que no se guarda (edición en curso, segmento de la dona). */
export interface GanttUi {
  editingId: number | null
  pieSelection: Status | null
}

export interface TaskFields {
  name: string
  start: string
  end: string
  status: Status
  comment: string
  parentId: string | number | null
}

export type ActionResult = { ok: true } | { ok: false; error: GanttKey }

export interface GanttActions {
  addTask(f: TaskFields): ActionResult
  saveEdit(id: number, f: TaskFields): ActionResult
  deleteTask(id: number): boolean
  duplicateTask(id: number, suffix: string): boolean
  moveTask(srcId: number, tgtId: number, after: boolean): { ok: boolean; error: MoveError | null }
  setTaskDates(id: number, start: Date, end: Date): void
  toggleCollapse(id: number): void
  setEditing(id: number | null): void
  setPieSelection(s: Status): void
  setPref<K extends keyof GanttPrefs>(key: K, value: GanttPrefs[K]): void
  setView<K extends keyof ChartView>(key: K, value: ChartView[K]): void
  clearFilters(): void
  createChart(name: string): ActionResult
  /** Mejora B4: crea un Gantt nuevo con las tareas importadas y lo deja activo. */
  importChart(name: string, tasks: StoredTask[], nextId: number): ActionResult
  renameChart(id: string, name: string): void
  deleteChart(id: string): ActionResult
  selectChart(id: string): void
}

export type GanttStore = GanttState & GanttUi & GanttActions
export type GanttApi = StoreApi<GanttStore>

export const DEFAULT_PREFS: GanttPrefs = {
  viewMode: 'day',
  taskColWidth: 280,
  formOpen: true,
  statsOpen: true,
  insightOpen: true,
}

export const DEFAULT_VIEW: ChartView = { search: '', filter: 'all', sort: 'startAsc' }

const emptyChart = (seq: number, name: string): GanttChart => ({
  id: `c${seq}`,
  name,
  tasks: [],
  nextId: 1,
  collapsed: [],
  view: { ...DEFAULT_VIEW },
})

/** Un Gantt vacío (sin demo, decisión del dueño). */
export const initialData = (): GanttState => ({
  charts: [emptyChart(1, 'Gantt 1')],
  activeId: 'c1',
  chartSeq: 1,
  prefs: { ...DEFAULT_PREFS },
})

const initialUi = (): GanttUi => ({ editingId: null, pieSelection: 'done' })

export function selectActiveChart(s: GanttState): GanttChart {
  return s.charts.find((c) => c.id === s.activeId) ?? s.charts[0]!
}

/** Tareas del Gantt activo como objetos con fechas. */
export function activeTasks(s: GanttState): Task[] {
  return selectActiveChart(s).tasks.map(deserializeTask)
}

export function createGanttStore(): GanttApi {
  return createStore<GanttStore>()((set, get) => {
    const active = () => selectActiveChart(get())
    const putChart = (chart: GanttChart) =>
      set((s) => ({ charts: s.charts.map((c) => (c.id === chart.id ? chart : c)) }))
    const putTasks = (tasks: Task[], nextId = active().nextId) =>
      putChart({ ...active(), tasks: tasks.map(serializeTask), nextId })
    const collapsedOf = () => new Set(active().collapsed)

    return {
      ...initialData(),
      ...initialUi(),

      addTask(f) {
        const chart = active()
        const tasks = activeTasks(get())
        const r = normalizeTask(tasks, f.name, f.start, f.end, f.status, chart.nextId, f.comment, f.parentId || null)
        if (!r.ok) return r
        putTasks([...tasks, r.task], chart.nextId + 1)
        set({ editingId: null })
        return { ok: true }
      },

      saveEdit(id, f) {
        const tasks = activeTasks(get())
        const idx = tasks.findIndex((x) => x.id === id)
        if (idx < 0) return { ok: true }
        const r = normalizeTask(tasks, f.name, f.start, f.end, f.status, id, f.comment, f.parentId || null)
        if (!r.ok) return r
        putTasks(tasks.map((t, i) => (i === idx ? r.task : t)))
        set({ editingId: null })
        return { ok: true }
      },

      deleteTask(id) {
        const r = deleteSubtree(activeTasks(get()), id)
        if (!r) return false
        putChart({
          ...active(),
          tasks: r.tasks.map(serializeTask),
          collapsed: active().collapsed.filter((x) => !r.removed.has(x)),
        })
        const editingId = get().editingId
        if (editingId !== null && r.removed.has(editingId)) set({ editingId: null })
        return true
      },

      duplicateTask(id, suffix) {
        const chart = active()
        const r = duplicateSubtree(activeTasks(get()), id, chart.nextId, suffix)
        if (!r) return false
        const collapsed = collapsedOf()
        for (const [src, clone] of r.idMap) if (collapsed.has(src)) collapsed.add(clone)
        putChart({ ...chart, tasks: r.tasks.map(serializeTask), nextId: r.nextId, collapsed: [...collapsed] })
        return true
      },

      moveTask(srcId, tgtId, after) {
        const r = moveTask(activeTasks(get()), srcId, tgtId, after)
        if (!r.ok) return { ok: false, error: r.error }
        putTasks(r.tasks)
        return { ok: true, error: null }
      },

      setTaskDates(id, start, end) {
        putTasks(
          activeTasks(get()).map((t) => (t.id === id ? { ...t, start: new Date(start), end: new Date(end) } : t)),
        )
      },

      toggleCollapse(id) {
        const c = collapsedOf()
        if (c.has(id)) c.delete(id)
        else c.add(id)
        putChart({ ...active(), collapsed: [...c] })
      },

      setEditing(id) {
        set({ editingId: id })
      },

      setPieSelection(s) {
        set({ pieSelection: s })
      },

      setPref(key, value) {
        set((s) => ({ prefs: { ...s.prefs, [key]: value } }))
      },

      setView(key, value) {
        putChart({ ...active(), view: { ...active().view, [key]: value } })
      },

      clearFilters() {
        putChart({ ...active(), view: { ...DEFAULT_VIEW } })
      },

      createChart(name) {
        const s = get()
        if (s.charts.length >= MAX_CHARTS) return { ok: false, error: 'chartsMax' }
        const seq = s.chartSeq + 1
        const chart = emptyChart(seq, name.trim() || `Gantt ${s.charts.length + 1}`)
        set({ charts: [...s.charts, chart], chartSeq: seq, activeId: chart.id, editingId: null })
        return { ok: true }
      },

      importChart(name, tasks, nextId) {
        const r = get().createChart(name)
        if (!r.ok) return r
        putChart({ ...active(), tasks, nextId })
        return r
      },

      renameChart(id, name) {
        const n = name.trim()
        if (!n) return
        set((s) => ({ charts: s.charts.map((c) => (c.id === id ? { ...c, name: n } : c)) }))
      },

      deleteChart(id) {
        const s = get()
        if (s.charts.length <= 1) return { ok: false, error: 'chartsLastOne' }
        const charts = s.charts.filter((c) => c.id !== id)
        set({
          charts,
          activeId: s.activeId === id ? charts[0]!.id : s.activeId,
          editingId: s.activeId === id ? null : s.editingId,
        })
        return { ok: true }
      },

      selectChart(id) {
        if (!get().charts.some((c) => c.id === id)) return
        set({ activeId: id, editingId: null })
      },
    }
  })
}

export function snapshotOf(s: GanttState): GanttState {
  return { charts: s.charts, activeId: s.activeId, chartSeq: s.chartSeq, prefs: s.prefs }
}

const clampWidth = (w: unknown): number =>
  Number.isFinite(w) ? Math.min(TASK_COL_MAX, Math.max(TASK_COL_MIN, w as number)) : DEFAULT_PREFS.taskColWidth

/** Guardados anteriores a B1/B3: sin plegados por Gantt y con buscar/filtrar/ordenar en prefs. */
function completeChart(c: GanttChart, legacyView: ChartView): GanttChart {
  return {
    ...c,
    collapsed: Array.isArray(c.collapsed) ? c.collapsed : [],
    view: { ...legacyView, ...c.view },
  }
}

/** Aplica un snapshot guardado; completa lo que falte y descarta el estado de pantalla. */
export function restoreInto(api: GanttApi, snapshot: GanttState): void {
  const base = initialData()
  const stored: Partial<GanttPrefs & ChartView> = snapshot.prefs ?? {}
  const { search, filter, sort, ...prefs } = { ...base.prefs, ...DEFAULT_VIEW, ...stored }
  const legacyView: ChartView = { search, filter, sort }
  const charts = (
    Array.isArray(snapshot.charts) && snapshot.charts.length ? snapshot.charts.slice(0, MAX_CHARTS) : base.charts
  ).map((c) => completeChart(c, legacyView))
  api.setState({
    charts,
    activeId: charts.some((c) => c.id === snapshot.activeId) ? snapshot.activeId : charts[0]!.id,
    chartSeq: Math.max(snapshot.chartSeq ?? 0, charts.length),
    prefs: { ...prefs, taskColWidth: clampWidth(prefs.taskColWidth) },
    ...initialUi(),
  })
}

export function resetInto(api: GanttApi): void {
  api.setState({ ...initialData(), ...initialUi() })
}

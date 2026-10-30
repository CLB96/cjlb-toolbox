import { createStore, type StoreApi } from 'zustand/vanilla'
import { translate } from './i18n'
import { defaultMarkerPositions } from './logic/markers'
import { parseSheetRows } from './logic/parse'
import { validateTimeRange, type TimeRangeError } from './logic/range'
import type {
  AdhesiveType,
  EventInputId,
  EventInputs,
  Lang,
  ParsedSheet,
  SubstrateType,
  TimeRange,
} from './logic/types'

export interface LayoutMarker {
  tcIndex: number
  x: number
  y: number
}

export interface SheetLayout {
  image: Blob | null
  imageName: string | null
  markers: LayoutMarker[]
  /** true cuando al restaurar se omitió una imagen demasiado grande pero se conservaron sus marcadores. */
  imageStripped: boolean
}

export interface CoolingParams {
  chiller: string
  nestUpper: string
  nestLower: string
}

export interface ProcessParams {
  thermoUpper: string
  nestUpper: string
  thermoLower: string
  nestLower: string
  slidersTemp: string
  leisters: string[]
}

export type ScalarParamKey = Exclude<keyof ProcessParams, 'leisters'>

/** Configuración que se guarda y se recupera por hoja (R2). */
export interface SheetConfig {
  testDate: string
  adhesive: AdhesiveType
  substrate: SubstrateType
  tcVisibility: boolean[]
  timeRange: TimeRange
  timeRangeInputs: { start: string; end: string }
  events: EventInputs
  coolingParams: CoolingParams
  params: ProcessParams
  layout: SheetLayout
}

export type SheetFailure = 'empty' | 'noTemperature'

export interface SheetEntry {
  name: string
  data: ParsedSheet | null
  reason?: SheetFailure
}

export type PanelKey = 'params' | 'events' | 'layout'

/** Datos persistibles y clonables. Los valores por defecto viven fuera (R1). */
export interface BondlineState {
  fileName: string | null
  sheets: SheetEntry[]
  sheetIndex: number
  config: SheetConfig
  sheetConfigs: Record<string, SheetConfig>
  panels: Record<PanelKey, boolean>
  layoutFit: boolean
}

export type SheetResult = { ok: true } | { ok: false; sheetName: string; reason: SheetFailure }

export interface BondlineActions {
  loadWorkbook(fileName: string, sheets: { name: string; raw: unknown[][] }[]): SheetResult
  selectSheet(index: number): SheetResult
  setTestDate(v: string): void
  setAdhesive(v: AdhesiveType): void
  setSubstrate(v: SubstrateType): void
  toggleTC(index: number): void
  setTimeRangeInput(key: 'start' | 'end', value: string): void
  applyTimeRange(): TimeRangeError | null
  resetTimeRange(): void
  setEvent(id: EventInputId, value: string): void
  setCoolingParam(key: keyof CoolingParams, value: string): void
  setParam(key: ScalarParamKey, value: string): void
  addLeister(): void
  removeLeister(): void
  setLeister(index: number, value: string): void
  setLayoutImage(image: Blob | null, name: string | null): void
  moveMarker(tcIndex: number, x: number, y: number): void
  setLayoutFit(fit: boolean): void
  setPanelOpen(key: PanelKey, open: boolean): void
  reset(): void
}

export type BondlineStore = BondlineState & BondlineActions
export type BondlineApi = StoreApi<BondlineStore>

const NO_RANGE: TimeRange = { active: false, start: 0, end: null }

const emptyEvents = (): EventInputs => ({
  eventPressStart: '',
  eventPressClosed: '',
  eventPressOpen: '',
  eventPressEnd: '',
  eventManipStart: '',
  eventManipEnd: '',
  eventCoolingStart: '',
  eventCoolingClosed: '',
  eventCoolingEnd: '',
})

export const initialConfig = (): SheetConfig => ({
  testDate: '',
  adhesive: 'waterbase',
  substrate: 'pcabs',
  tcVisibility: [],
  timeRange: { ...NO_RANGE },
  timeRangeInputs: { start: '', end: '' },
  events: emptyEvents(),
  coolingParams: { chiller: '', nestUpper: '', nestLower: '' },
  params: {
    thermoUpper: '',
    nestUpper: '',
    thermoLower: '',
    nestLower: '',
    slidersTemp: '',
    leisters: [''],
  },
  layout: { image: null, imageName: null, markers: [], imageStripped: false },
})

export const initialData = (): BondlineState => ({
  fileName: null,
  sheets: [],
  sheetIndex: 0,
  config: initialConfig(),
  sheetConfigs: {},
  panels: { params: false, events: false, layout: false },
  layoutFit: true,
})

const allVisible = (count: number): boolean[] => Array.from({ length: count }, () => true)

/** Marcadores en las posiciones por defecto sobre las TC visibles (R4). */
export function markersFor(visibility: boolean[]): LayoutMarker[] {
  const visible = visibility.flatMap((on, i) => (on ? [i] : []))
  return defaultMarkerPositions(visible.length).map((p, n) => ({ tcIndex: visible[n], x: p.x, y: p.y }))
}

const sheetFailure = (sheet: SheetEntry): SheetResult => ({
  ok: false,
  sheetName: sheet.name,
  reason: sheet.reason ?? 'empty',
})

/** Texto del aviso de hoja inválida (literal del original en ES; EN nuevo, R10). */
export function invalidSheetText(sheetName: string, reason: SheetFailure, lang: Lang = 'es'): string {
  return translate(lang, reason === 'empty' ? 'sheetEmpty' : 'sheetNoTemp', sheetName)
}

/** Primera visita (R2, como el original): hereda la configuración con rango y visibilidad TC reiniciados. */
function inheritConfig(current: SheetConfig, data: ParsedSheet): SheetConfig {
  const tcVisibility = allVisible(data.columns.length)
  return {
    ...current,
    tcVisibility,
    timeRange: { ...NO_RANGE },
    timeRangeInputs: { start: '', end: '' },
    layout: {
      ...current.layout,
      markers: current.layout.image ? markersFor(tcVisibility) : [],
      imageStripped: false,
    },
  }
}

export const selectActiveSheet = (s: Pick<BondlineState, 'sheets' | 'sheetIndex'>): ParsedSheet | null =>
  s.sheets[s.sheetIndex]?.data ?? null

/** Un store por instancia de la herramienta: no comparte estado entre usuarios. */
export const createBondlineStore = (): BondlineApi =>
  createStore<BondlineStore>()((set, get) => {
    const patchConfig = (patch: Partial<SheetConfig>) => set((s) => ({ config: { ...s.config, ...patch } }))
    const patchParams = (patch: (p: ProcessParams) => ProcessParams) =>
      set((s) => ({ config: { ...s.config, params: patch(s.config.params) } }))

    return {
      ...initialData(),

      loadWorkbook(fileName, rawSheets) {
        const sheets: SheetEntry[] = rawSheets.map(({ name, raw }) => {
          const parsed = parseSheetRows(raw)
          return parsed.ok ? { name, data: parsed.data } : { name, data: null, reason: parsed.reason }
        })
        const first = sheets[0]
        if (!first) return { ok: false, sheetName: '', reason: 'empty' }
        const firstData = first.data
        if (!firstData) return sheetFailure(first)
        set((s) => ({
          fileName,
          sheets,
          sheetIndex: 0,
          sheetConfigs: {},
          config: inheritConfig({ ...s.config, tcVisibility: [] }, firstData),
        }))
        return { ok: true }
      },

      selectSheet(index) {
        const s = get()
        const target = s.sheets[index]
        if (!target || index === s.sheetIndex) return { ok: true }
        if (!target.data) return sheetFailure(target)
        const current = s.sheets[s.sheetIndex]
        set({
          sheetIndex: index,
          sheetConfigs: { ...s.sheetConfigs, [current.name]: s.config },
          config: s.sheetConfigs[target.name] ?? inheritConfig(s.config, target.data),
        })
        return { ok: true }
      },

      setTestDate: (testDate) => patchConfig({ testDate }),
      setAdhesive: (adhesive) => patchConfig({ adhesive }),
      setSubstrate: (substrate) => patchConfig({ substrate }),

      toggleTC(index) {
        set((s) => {
          const tcVisibility = s.config.tcVisibility.map((on, i) => (i === index ? !on : on))
          const layout = s.config.layout
          return {
            config: {
              ...s.config,
              tcVisibility,
              layout: layout.image ? { ...layout, markers: markersFor(tcVisibility) } : layout,
            },
          }
        })
      },

      setTimeRangeInput: (key, value) =>
        set((s) => ({
          config: { ...s.config, timeRangeInputs: { ...s.config.timeRangeInputs, [key]: value } },
        })),

      applyTimeRange() {
        const s = get()
        const data = selectActiveSheet(s)
        if (!data) return null
        const { start, end } = s.config.timeRangeInputs
        const result = validateTimeRange(start, end, data.totalRows)
        if (!result.ok) return result.error
        patchConfig({ timeRange: result.range })
        return null
      },

      resetTimeRange: () =>
        patchConfig({ timeRange: { ...NO_RANGE }, timeRangeInputs: { start: '', end: '' } }),

      setEvent: (id, value) =>
        set((s) => ({ config: { ...s.config, events: { ...s.config.events, [id]: value } } })),

      setCoolingParam: (key, value) =>
        set((s) => ({
          config: { ...s.config, coolingParams: { ...s.config.coolingParams, [key]: value } },
        })),

      setParam: (key, value) => patchParams((p) => ({ ...p, [key]: value })),
      addLeister: () => patchParams((p) => ({ ...p, leisters: [...p.leisters, ''] })),
      removeLeister: () =>
        patchParams((p) => (p.leisters.length <= 1 ? p : { ...p, leisters: p.leisters.slice(0, -1) })),
      setLeister: (index, value) =>
        patchParams((p) => ({ ...p, leisters: p.leisters.map((v, i) => (i === index ? value : v)) })),

      setLayoutImage(image, imageName) {
        set((s) => {
          const { layout, tcVisibility } = s.config
          // quitar la imagen borra los marcadores; solo una imagen omitida al restaurar los conserva
          const keep = image !== null && layout.imageStripped
          const markers = image === null ? [] : keep ? layout.markers : markersFor(tcVisibility)
          return {
            config: { ...s.config, layout: { image, imageName, markers, imageStripped: false } },
          }
        })
      },

      moveMarker: (tcIndex, x, y) =>
        set((s) => ({
          config: {
            ...s.config,
            layout: {
              ...s.config.layout,
              markers: s.config.layout.markers.map((m) => (m.tcIndex === tcIndex ? { ...m, x, y } : m)),
            },
          },
        })),

      setLayoutFit: (layoutFit) => set({ layoutFit }),
      setPanelOpen: (key, open) => set((s) => ({ panels: { ...s.panels, [key]: open } })),
      reset: () => set(initialData()),
    }
  })

/** Solo los datos (sin acciones), aptos para structured clone. */
export function snapshotOf(s: BondlineState): BondlineState {
  return {
    fileName: s.fileName,
    sheets: s.sheets,
    sheetIndex: s.sheetIndex,
    config: s.config,
    sheetConfigs: s.sheetConfigs,
    panels: s.panels,
    layoutFit: s.layoutFit,
  }
}

/** Completa con valores iniciales lo que un snapshot anterior no traiga. */
function mergeConfig(saved: Partial<SheetConfig> | undefined): SheetConfig {
  const base = initialConfig()
  const c = saved ?? {}
  return {
    ...base,
    ...c,
    timeRange: { ...base.timeRange, ...c.timeRange },
    timeRangeInputs: { ...base.timeRangeInputs, ...c.timeRangeInputs },
    events: { ...base.events, ...c.events },
    coolingParams: { ...base.coolingParams, ...c.coolingParams },
    params: {
      ...base.params,
      ...c.params,
      leisters: c.params?.leisters?.length ? c.params.leisters : base.params.leisters,
    },
    layout: {
      ...base.layout,
      ...c.layout,
      imageStripped: c.layout?.imageStripped ?? (!c.layout?.image && (c.layout?.markers?.length ?? 0) > 0),
    },
  }
}

export function restoreInto(api: BondlineApi, snapshot: BondlineState): void {
  const base = initialData()
  api.setState({
    ...base,
    ...snapshot,
    config: mergeConfig(snapshot.config),
    sheetConfigs: Object.fromEntries(
      Object.entries(snapshot.sheetConfigs ?? {}).map(([name, c]) => [name, mergeConfig(c)]),
    ),
    panels: { ...base.panels, ...snapshot.panels },
  })
}

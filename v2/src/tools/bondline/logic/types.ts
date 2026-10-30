/** Columna de temperaturas de un termopar; null = celda sin dato. */
export type Column = (number | null)[]

export interface ParsedSheet {
  columns: Column[]
  totalRows: number
}

export type AdhesiveType = 'waterbase' | 'hotmelt'
export type SubstrateType = 'pcabs' | 'pp'
export type Lang = 'es' | 'en'

export interface TempRange {
  min: number
  max: number
}

export interface BondlineDefaults {
  waterbase: TempRange
  hotmelt: TempRange
  coolingTarget: number
}

export const FACTORY_DEFAULTS: BondlineDefaults = {
  waterbase: { min: 55, max: 75 },
  hotmelt: { min: 60, max: 80 },
  coolingTarget: 35,
}

/** Duración fija de la ventana de activación, en segundos. */
export const ACTIVATION_DURATION = 30

export const TC_COLORS: readonly string[] = [
  '#4f8cff', '#ef5b67', '#43b36b', '#8b5cf6', '#f59e0b',
  '#06b6d4', '#ec4899', '#84cc16', '#f43f5e', '#14b8a6',
  '#6366f1', '#d97706', '#0ea5e9', '#e11d48', '#10b981',
  '#a855f7', '#ca8a04', '#0891b2', '#be185d', '#3b82f6',
]

export interface TimeRange {
  active: boolean
  start: number
  end: number | null
}

export type EventInputId =
  | 'eventPressStart'
  | 'eventPressClosed'
  | 'eventPressOpen'
  | 'eventPressEnd'
  | 'eventManipStart'
  | 'eventManipEnd'
  | 'eventCoolingStart'
  | 'eventCoolingClosed'
  | 'eventCoolingEnd'

export type EventInputs = Record<EventInputId, string>

export type EventLabelKey =
  | 'pressStart'
  | 'pressClosed'
  | 'pressOpen'
  | 'pressEnd'
  | 'manipStart'
  | 'manipEnd'
  | 'coolingStart'
  | 'coolingClosed'
  | 'coolingEnd'

export interface EventConfig {
  id: EventInputId
  labelKey: EventLabelKey
  color: string
}

/** Orden del original: prensa, manipulación, cooling. */
export const EVENTS_CONFIG: readonly EventConfig[] = [
  { id: 'eventPressStart', labelKey: 'pressStart', color: '#4f8cff' },
  { id: 'eventPressClosed', labelKey: 'pressClosed', color: '#72a8ff' },
  { id: 'eventPressOpen', labelKey: 'pressOpen', color: '#a8cbff' },
  { id: 'eventPressEnd', labelKey: 'pressEnd', color: '#235fd2' },
  { id: 'eventManipStart', labelKey: 'manipStart', color: '#43b36b' },
  { id: 'eventManipEnd', labelKey: 'manipEnd', color: '#217543' },
  { id: 'eventCoolingStart', labelKey: 'coolingStart', color: '#06b6d4' },
  { id: 'eventCoolingClosed', labelKey: 'coolingClosed', color: '#22d3ee' },
  { id: 'eventCoolingEnd', labelKey: 'coolingEnd', color: '#0e7490' },
]

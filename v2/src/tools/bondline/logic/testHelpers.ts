import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { I18N } from '../../../../legacy-fixtures/bondline/legacyI18n'
import { legacyLoadSheet, legacyRenderCalc, type LegacyCalc, type LegacySheet } from '../../../../legacy-fixtures/bondline/legacyReference'
import { loadRealWorkbook } from '../../../../legacy-fixtures/bondline/realFixture'
import { adhesiveConfig } from './activation'
import { FACTORY_DEFAULTS, type AdhesiveType, type EventInputs, type Lang, type ParsedSheet, type TimeRange } from './types'

const real = loadRealWorkbook()
export const sheets: { name: string; raw: unknown[][] }[] = Object.entries(FIXTURES).map(([name, raw]) => ({ name, raw }))
if (real) for (const s of real) sheets.push({ name: `real:${s.name}`, raw: s.raw })

export const validSheets = sheets
  .map((s) => ({ ...s, legacy: legacyLoadSheet(s.raw) }))
  .filter((s): s is typeof s & { legacy: LegacySheet } => typeof s.legacy !== 'string')

export const ADHESIVES: AdhesiveType[] = ['waterbase', 'hotmelt']
export const LANGS: Lang[] = ['es', 'en']

// T() del original con el idioma como parámetro.
export function T(lang: Lang, key: string, ...args: (number | string)[]): string {
  const v = I18N[lang]?.[key] ?? I18N.es[key]
  return typeof v === 'function' ? v(...args) : (v ?? key)
}

export function rangesFor(legacy: LegacySheet): { name: string; tr: TimeRange }[] {
  const act = legacyRenderCalc({
    columns: legacy.columns,
    totalRows: legacy.totalRows,
    cfg: { min: 55, max: 75, label: 'Water Base' },
    timeRange: { active: false, start: 0, end: null },
  }).activationStart
  const s = act ?? 5
  return [
    { name: 'inactivo', tr: { active: false, start: 0, end: null } },
    { name: 'inactivo con valores', tr: { active: false, start: 40, end: 50 } },
    { name: '{0,null}', tr: { active: true, start: 0, end: null } },
    { name: '{10,60}', tr: { active: true, start: 10, end: 60 } },
    { name: '{60,null}', tr: { active: true, start: 60, end: null } },
    { name: 'corta la ventana', tr: { active: true, start: 0, end: s + 10 } },
    { name: 'activación antes del inicio', tr: { active: true, start: s + 5, end: null } },
    { name: 'inicio exacto en activación', tr: { active: true, start: s, end: s + 30 } },
  ]
}

export function calcOf(data: ParsedSheet, adhesive: AdhesiveType, tr: TimeRange): { lc: LegacyCalc; cfg: ReturnType<typeof adhesiveConfig> } {
  const cfg = adhesiveConfig(FACTORY_DEFAULTS, adhesive)
  return { cfg, lc: legacyRenderCalc({ columns: data.columns, totalRows: data.totalRows, cfg, timeRange: tr }) }
}

export const NO_EVENTS: EventInputs = {
  eventPressStart: '', eventPressClosed: '', eventPressOpen: '', eventPressEnd: '',
  eventManipStart: '', eventManipEnd: '',
  eventCoolingStart: '', eventCoolingClosed: '', eventCoolingEnd: '',
}

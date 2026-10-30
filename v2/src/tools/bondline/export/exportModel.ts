import type { Lang } from '../../../i18n/useI18n'
import { translate } from '../i18n'
import { computeLoss } from '../logic/loss'
import { selectActiveSheet, type BondlineState } from '../store'
import type { BondlineView } from '../useBondlineView'
import { TC_COLORS, type BondlineDefaults } from '../logic/types'

/** Ancho de columna del panel y relleno (downloadChart, inventario §7.5). */
export const PARAM_COL_W = 280
export const PANEL_PAD = 16
export const PANEL_W_WITH_LAYOUT = 1010
export const PANEL_W_FULL = 1800

export interface ExportStat {
  icon: string
  label: string
  value: string
  color: string
}

/** Fila de un bloque de parámetros; los desplazamientos son los del original (px desde la columna). */
export interface ExportParamRow {
  label: string
  value: string
  labelDx: number
  valueDx: number
  dy: number
  /** Pérdida > 0: se pinta en ámbar. */
  warn?: boolean
}

export interface ExportParamColumn {
  /** Posición horizontal en columnas de 280 px dentro del panel. */
  slot: number
  title: string
  rows: ExportParamRow[]
}

export interface ExportLegend {
  tcs: { label: string; color: string }[]
  limits: string
  limitsColor: string
  window: string
  cooling: string | null
}

export interface ExportMarker {
  tcIndex: number
  /** % relativo a la imagen (R4). */
  x: number
  y: number
  color: string
  label: string
}

export interface BondlineExportModel {
  title: string
  dateLine: string
  stats: ExportStat[]
  hasLayout: boolean
  panelWidth: number
  paramsTitle: string
  columns: ExportParamColumn[]
  /** Posiciones (slot) con divisor vertical a su izquierda. */
  dividers: number[]
  legend: ExportLegend
  markers: ExportMarker[]
  footer: string
  fileName: string
}

const DASH = '—'
const STAT_COLORS = ['#72a8ff', '#a78bfa', '#22d3ee', '#ff7683', '#59c97f'] as const
const STAT_FAIL_COLOR = '#ff7683'

function zoneColumn(
  slot: number,
  title: string,
  thermo: string,
  nest: string,
  nestKey: string,
  thermoKey: string,
): ExportParamColumn {
  const loss = computeLoss(thermoKey, nestKey)
  return {
    slot,
    title,
    rows: [
      { label: 'Termoreg.', value: `${thermo}°C`, labelDx: 0, valueDx: 90, dy: 15 },
      { label: 'Nido', value: `${nest}°C`, labelDx: 160, valueDx: 200, dy: 15 },
      { label: 'Pérdida', value: loss.text, labelDx: 0, valueDx: 90, dy: 33, warn: loss.positive },
    ],
  }
}

function singleRows(items: { label: string; value: string }[]): ExportParamRow[] {
  return items.map((it, i) => ({ ...it, labelDx: 0, valueDx: 90, dy: 15 + i * 18 }))
}

function paramColumns(state: BondlineState, t: (k: Parameters<typeof translate>[1]) => string, hasLayout: boolean) {
  const { params, coolingParams } = state.config
  const or = (v: string) => v || DASH
  const columns: ExportParamColumn[] = [
    zoneColumn(0, '▲ ' + t('paramUpper'), or(params.thermoUpper), or(params.nestUpper), params.nestUpper, params.thermoUpper),
    zoneColumn(1, '▼ ' + t('paramLower'), or(params.thermoLower), or(params.nestLower), params.nestLower, params.thermoLower),
  ]
  const dividers = [1, 2]
  let slot = 2

  const leisters = params.leisters.flatMap((v, i) => (v ? [{ label: `Leister ${i + 1}`, value: `${v}°C` }] : []))
  if (leisters.length) {
    columns.push({ slot, title: t('paramLeistersLabel'), rows: singleRows(leisters) })
    slot += 1
    dividers.push(slot)
  }
  if (params.slidersTemp) {
    columns.push({
      slot,
      title: t('paramSlidersLabel'),
      rows: singleRows([{ label: 'Temperatura', value: `${params.slidersTemp}°C` }]),
    })
  }

  // La columna Cooling siempre ocupa el hueco siguiente al de Sliders, haya o no Sliders (como el original).
  const coolingSlot = slot + 1
  const cooling = [
    { label: 'Chiller', value: coolingParams.chiller },
    { label: 'Nido Sup', value: coolingParams.nestUpper },
    { label: 'Nido Inf', value: coolingParams.nestLower },
  ].flatMap((r) => (r.value ? [{ label: r.label, value: `${r.value}°C` }] : []))
  const panelWidth = hasLayout ? PANEL_W_WITH_LAYOUT : PANEL_W_FULL
  // regla de cabida §7.5: colX + colW <= panelX + panelW - pad (colX relativo al panel)
  const fits = PANEL_PAD + coolingSlot * PARAM_COL_W + PARAM_COL_W <= panelWidth - PANEL_PAD
  if (cooling.length && fits) {
    columns.push({ slot: coolingSlot, title: '❄️ Cooling', rows: singleRows(cooling) })
    dividers.push(coolingSlot)
  }
  return { columns, dividers, panelWidth }
}

export function exportFileName(state: BondlineState): string {
  const sheetName = state.sheets.length > 0 ? state.sheets[state.sheetIndex]?.name ?? 'Hoja1' : 'Hoja1'
  const clean = sheetName.replace(/[/\\:*?"<>|]/g, '-')
  return `Bondline - ${state.config.testDate || 'SinFecha'} - ${clean}.png`
}

/** Modelo puro del PNG: todo el texto y los valores que dibuja `drawExport` (inventario §7). */
export function buildExportModel(
  state: BondlineState,
  view: BondlineView | null,
  defaults: BondlineDefaults,
  lang: Lang,
  now: Date,
): BondlineExportModel | null {
  const data = selectActiveSheet(state)
  if (!data || !view) return null
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k)
  const { tcVisibility, layout } = state.config
  const hasLayout = layout.image !== null
  const reset = tcVisibility.length !== data.columns.length
  const visible = data.columns.map((_, i) => reset || tcVisibility[i])
  const { kpis } = view
  const stats: ExportStat[] = [
    { icon: 'TC', label: t('statThermocouples'), value: String(data.columns.length), color: STAT_COLORS[0] },
    { icon: '⏱', label: t('statDuration'), value: `${view.range.rows}s`, color: STAT_COLORS[1] },
    { icon: '↓', label: t('statMinTemp'), value: kpis.min, color: STAT_COLORS[2] },
    { icon: '↑', label: t('statMaxTemp'), value: kpis.max, color: STAT_COLORS[3] },
    {
      icon: '⚡',
      label: t('statActivation'),
      value: kpis.activation,
      color: kpis.activated ? STAT_COLORS[4] : STAT_FAIL_COLOR,
    },
  ]
  const { columns, dividers, panelWidth } = paramColumns(state, t, hasLayout)
  const tcs = visible.flatMap((on, i) => (on ? [{ label: `TC-${i + 1}`, color: TC_COLORS[i % TC_COLORS.length] }] : []))
  return {
    title: lang === 'es' ? 'Bondline — Activación de Adhesivo' : 'Bondline — Adhesive Activation',
    dateLine: now.toLocaleString(lang === 'es' ? 'es-MX' : 'en-US'),
    stats,
    hasLayout,
    panelWidth,
    paramsTitle: t('exportParams'),
    columns,
    dividers,
    legend: {
      tcs,
      limits: t('legendLimits'),
      limitsColor: state.config.adhesive === 'hotmelt' ? '#f8b84f' : '#22d3ee',
      window: t('legendWindow'),
      cooling: view.cooling.hasCoolingEvents ? `🎯 Cooling ${defaults.coolingTarget}°C` : null,
    },
    markers: layout.markers
      .filter((m) => visible[m.tcIndex])
      .map((m) => ({
        tcIndex: m.tcIndex,
        x: m.x,
        y: m.y,
        color: TC_COLORS[m.tcIndex % TC_COLORS.length],
        label: String(m.tcIndex + 1),
      })),
    footer: t('footer'),
    fileName: exportFileName(state),
  }
}

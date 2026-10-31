import { createContext, useContext, useMemo } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { useBondline } from './BondlineStoreProvider'
import { selectActiveSheet, type SheetConfig } from './store'
import type { BondlineDefaultsApi } from './useBondlineDefaults'
import {
  adhesiveConfig,
  findActivationStart,
  windowStatus,
  yLimits,
  type AdhesiveCfg,
} from './logic/activation'
import { coolingCheck, type CoolingCheck } from './logic/cooling'
import { activeEvents, type ActiveEvent } from './logic/events'
import { effectiveRange, trimColumns, type EffectiveRange } from './logic/range'
import { activationResult, type ActivationResult } from './logic/results'
import { kpiTexts, type KpiTexts } from './logic/stats'
import {
  ACTIVATION_DURATION,
  type BondlineDefaults,
  type Column,
  type Lang,
  type ParsedSheet,
} from './logic/types'

/** Resultado derivado de la hoja activa: una sola fuente para gráfica, resumen y export. */
export interface BondlineView {
  cfg: AdhesiveCfg
  range: EffectiveRange
  trimmed: Column[]
  labels: number[]
  activationStart: number | null
  activationEnd: number | null
  allInRange: boolean
  /** false si la ventana de activación pasa del final de los datos visibles (A9). */
  windowComplete: boolean
  yMin: number
  yMax: number
  kpis: KpiTexts
  result: ActivationResult
  cooling: CoolingCheck
  events: ActiveEvent[]
}

/** Mismo orden de cálculo que renderChart del original (inventario §2A). */
export function computeView(
  data: ParsedSheet,
  config: SheetConfig,
  defaults: BondlineDefaults,
  lang: Lang,
): BondlineView {
  const { columns, totalRows } = data
  const cfg = adhesiveConfig(defaults, config.adhesive)
  const range = effectiveRange(totalRows, config.timeRange)
  // con un rango inválido conservado del original (fin NaN, inicio >= total) la longitud queda en 0
  const labels = Array.from({ length: Math.max(0, range.rows || 0) }, (_, i) => i)
  const trimmed = trimColumns(columns, range.start, range.end)
  // A10: mínimo, máximo, activación y cooling usan solo los TC visibles y los datos del rango activo
  const reset = config.tcVisibility.length !== columns.length
  const visible = columns.map((_, i) => reset || config.tcVisibility[i])
  const analysis = trimmed.filter((_, i) => visible[i])
  const rows = labels.length
  const relStart = analysis.length > 0 ? findActivationStart(analysis, rows, cfg.min) : null
  const win = relStart !== null ? windowStatus(analysis, rows, relStart, cfg) : null
  // activationStart sigue siendo el segundo absoluto de la hoja; lo mostrado es relativo al rango (A8)
  const activationStart = relStart !== null ? relStart + range.start : null
  const activationEnd = activationStart !== null ? activationStart + ACTIVATION_DURATION : null
  const allInRange = win !== null && win.complete && win.inRange
  const windowComplete = win?.complete ?? true
  const { yMin, yMax } = yLimits(trimmed, cfg.max)
  return {
    cfg,
    range,
    trimmed,
    labels,
    activationStart,
    activationEnd,
    allInRange,
    windowComplete,
    yMin,
    yMax,
    kpis: {
      ...kpiTexts({ columns: analysis, totalRows: rows }, relStart),
      tc: `${columns.length}`,
    },
    result: activationResult(activationStart, allInRange, range.start, cfg, windowComplete),
    cooling: coolingCheck(
      columns.filter((_, i) => visible[i]),
      Math.min(range.end, totalRows),
      config.events,
      defaults.coolingTarget,
      range.start,
    ),
    events: activeEvents(config.events, lang),
  }
}

/** Valores por defecto del usuario (R1), cargados una vez por instancia en BondlineTool. */
export const BondlineDefaultsContext = createContext<BondlineDefaultsApi | null>(null)

export function useBondlineDefaultsCtx(): BondlineDefaultsApi {
  const ctx = useContext(BondlineDefaultsContext)
  if (!ctx) throw new Error('BondlineDefaultsContext ausente')
  return ctx
}

/** Vista derivada de la hoja activa; null sin datos. */
export function useBondlineView(): BondlineView | null {
  const data = useBondline(selectActiveSheet)
  const config = useBondline((s) => s.config)
  const { defaults } = useBondlineDefaultsCtx()
  const { lang } = useI18n()
  return useMemo(
    () => (data ? computeView(data, config, defaults, lang) : null),
    [data, config, defaults, lang],
  )
}

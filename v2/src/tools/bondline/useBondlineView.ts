import { createContext, useContext, useMemo } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { useBondline } from './BondlineStoreProvider'
import { selectActiveSheet, type SheetConfig } from './store'
import type { BondlineDefaultsApi } from './useBondlineDefaults'
import {
  adhesiveConfig,
  findActivationStart,
  isWindowInRange,
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
  const activationStart = findActivationStart(columns, totalRows, cfg.min)
  const activationEnd = activationStart !== null ? activationStart + ACTIVATION_DURATION : null
  const allInRange =
    activationStart !== null && isWindowInRange(columns, totalRows, activationStart, range, cfg)
  const { yMin, yMax } = yLimits(trimmed)
  return {
    cfg,
    range,
    trimmed,
    labels,
    activationStart,
    activationEnd,
    allInRange,
    yMin,
    yMax,
    kpis: kpiTexts(data, activationStart),
    result: activationResult(activationStart, allInRange, range.start, cfg),
    cooling: coolingCheck(columns, totalRows, config.events, defaults.coolingTarget),
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

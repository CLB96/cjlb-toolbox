import type { Column, ParsedSheet } from './types'

export function minMaxTemp(columns: Column[]): { min: number; max: number } {
  let max = -Infinity
  let min = Infinity
  for (const col of columns) {
    for (const v of col) {
      if (v !== null) {
        if (v > max) max = v
        if (v < min) min = v
      }
    }
  }
  return { min, max }
}

export interface KpiTexts {
  tc: string
  duration: string
  min: string
  max: string
  activation: string
  activated: boolean
}

export function kpiTexts(data: ParsedSheet, activationStart: number | null): KpiTexts {
  const { min, max } = minMaxTemp(data.columns)
  return {
    tc: `${data.columns.length}`,
    duration: `${data.totalRows}s`,
    min: `${min.toFixed(1)}°`,
    max: `${max.toFixed(1)}°`,
    activation: activationStart !== null ? `t=${activationStart}s` : '—',
    activated: activationStart !== null,
  }
}

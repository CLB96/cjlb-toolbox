// Referencia legacy de Bondline: copia literal de las expresiones del original
// (bondline/index.html) con las lecturas de DOM y globales reemplazadas por parámetros.
// Origen por función:
//   legacyLoadSheet            <- loadSheet pasos 4-7, líneas 1596-1626 (filtro de filas, columnas, lastRow)
//   legacyRenderCalc           <- renderChart, líneas 1775-1828 (rango, ventana de activación, límites Y, stats)
//   legacyStatsTexts           <- renderChart, líneas 1832-1839 (barra de estadísticas)
//   legacyActivationResultHtml <- renderChart, líneas 2117-2132
//   legacyCooling              <- renderChart, líneas 1931-1941 y 2134-2171
//   legacyActiveEvents         <- getActiveEvents, líneas 1270-1288 (+ EVENTS_CONFIG/EVENTS_LABELS)
//   legacyCalcLoss             <- calcLoss, líneas 3083-3101
//   legacyMarkerPositions      <- createTCMarkers, líneas 2905-2936
//   legacySaveDefaults         <- saveDefaults, líneas 1067-1095
//   legacyApplyTimeRange       <- applyTimeRange, líneas 1714-1751
//   legacyDragDelta            <- mousemove del arrastre de eventos, líneas 2063-2072
//   legacyAnnotations          <- renderChart, líneas 1858-1970 (sin enter/leave)
import { ACTIVATION_DURATION, EVENTS_CONFIG, EVENTS_LABELS, I18N } from './legacyI18n'

export { ACTIVATION_DURATION }

export interface LegacyCfg {
  min: number
  max: number
  label: string
}
export interface LegacyTimeRange {
  active: boolean
  start: number
  end: number | null
}
export interface BondlineDefaults {
  waterbase: { min: number; max: number }
  hotmelt: { min: number; max: number }
  coolingTarget: number
}
export interface LegacyEvent {
  x: number
  label: string
  color: string
  id: string
}
export type LegacyColumns = (number | null)[][]
export interface LegacySheet {
  columns: LegacyColumns
  totalRows: number
}
export interface LegacyCalc {
  totalRows: number
  tcCount: number
  effectiveStart: number
  effectiveEnd: number
  effectiveRows: number
  labels: number[]
  trimmedColumns: LegacyColumns
  activationStart: number | null
  activationEnd: number | null
  allInRange: boolean
  yMin: number
  yMax: number
  minTemp: number
  maxTemp: number
}
export interface LegacyCoolingInput {
  hasCoolingEvents: boolean
  coolingStartTime: number
  coolingTargetTemp: number
}

// T() del original: currentLang pasa a ser parámetro.
function T(lang: string, key: string, ...args: any[]): any {
  const v = I18N[lang]?.[key] ?? I18N.es[key]
  return typeof v === 'function' ? v(...args) : v ?? key
}

export function legacyLoadSheet(raw: unknown[][]): LegacySheet | 'empty' | 'noTemperature' {
  const rows: any[][] = (raw as any[][]).filter((r) => r.some((v) => v !== null && v !== ''))
  if (!rows.length) return 'empty'

  const numCols = Math.max(...rows.map((r) => r.length))
  const allColumns: (number | null)[][] = []
  for (let c = 0; c < numCols; c++) {
    const col: (number | null)[] = []
    for (let r = 0; r < rows.length; r++) {
      const val = parseFloat(rows[r][c])
      col.push(isNaN(val) ? null : val)
    }
    allColumns.push(col)
  }

  const activeColumns = allColumns.filter((col) => col.some((v) => v !== null))
  if (!activeColumns.length) return 'noTemperature'

  let lastRow = 0
  for (let c = 0; c < activeColumns.length; c++) {
    for (let r = activeColumns[c].length - 1; r >= 0; r--) {
      if (activeColumns[c][r] !== null) {
        if (r + 1 > lastRow) lastRow = r + 1
        break
      }
    }
  }

  const columns = activeColumns.map((col) => col.slice(0, lastRow))
  return { columns, totalRows: lastRow }
}

export function legacyRenderCalc(p: {
  columns: LegacyColumns
  totalRows: number
  cfg: LegacyCfg
  timeRange: LegacyTimeRange
}): LegacyCalc {
  const { columns, totalRows, cfg } = p
  const timeRangeActive = p.timeRange.active
  const timeRangeStart = p.timeRange.start
  const timeRangeEnd = p.timeRange.end

  const effectiveStart = timeRangeActive ? timeRangeStart : 0
  const effectiveEnd = timeRangeActive && timeRangeEnd !== null ? timeRangeEnd : totalRows
  const effectiveRows = effectiveEnd - effectiveStart

  const labels = Array.from({ length: effectiveRows }, (_, i) => i)
  const trimmedColumns = columns.map((col) => col.slice(effectiveStart, effectiveEnd))

  let activationStart: number | null = null
  for (let r = 0; r < totalRows; r++) {
    if (columns.every((col) => col[r] !== null && (col[r] as number) >= cfg.min)) {
      activationStart = r
      break
    }
  }
  const activationEnd = activationStart !== null ? activationStart + ACTIVATION_DURATION : null

  let allInRange = false
  if (activationStart !== null) {
    const windowFullyVisible = activationStart >= effectiveStart && (activationEnd as number) <= effectiveEnd

    if (windowFullyVisible) {
      allInRange = true
      const end = Math.min(activationEnd as number, totalRows)
      for (let r = activationStart; r < end; r++) {
        for (let c = 0; c < columns.length; c++) {
          const v = columns[c][r]
          if (v === null || v < cfg.min || v > cfg.max) {
            allInRange = false
            break
          }
        }
        if (!allInRange) break
      }
    } else {
      allInRange = false
    }
  }

  const firstValues = trimmedColumns
    .map((col) => {
      for (let r = 0; r < col.length; r++) {
        if (col[r] !== null) return col[r]
      }
      return null
    })
    .filter((v) => v !== null) as number[]
  const avgFirst = firstValues.length ? firstValues.reduce((a, b) => a + b, 0) / firstValues.length : 0
  const yMax = 80,
    yMin = Math.floor(avgFirst * 0.95)

  let maxTemp = -Infinity,
    minTemp = Infinity
  columns.forEach((col) =>
    col.forEach((v) => {
      if (v !== null) {
        if (v > maxTemp) maxTemp = v
        if (v < minTemp) minTemp = v
      }
    }),
  )

  return {
    totalRows,
    tcCount: columns.length,
    effectiveStart,
    effectiveEnd,
    effectiveRows,
    labels,
    trimmedColumns,
    activationStart,
    activationEnd,
    allInRange,
    yMin,
    yMax,
    minTemp,
    maxTemp,
  }
}

export function legacyStatsTexts(
  calc: LegacyCalc,
  lang: string,
): { tc: string; duration: string; min: string; max: string; activation: string; activated: boolean; activationLabel: string } {
  const { activationStart } = calc
  return {
    tc: `${calc.tcCount}`,
    duration: `${calc.totalRows}s`,
    min: `${calc.minTemp.toFixed(1)}°`,
    max: `${calc.maxTemp.toFixed(1)}°`,
    activation: `${activationStart !== null ? 't=' + activationStart + 's' : '—'}`,
    activated: activationStart !== null,
    activationLabel: `${activationStart !== null ? T(lang, 'statActivation') : T(lang, 'statNotReached')}`,
  }
}

export function legacyActivationResultHtml(
  calc: LegacyCalc,
  cfg: LegacyCfg,
  lang: string,
): { className: string; html: string } {
  const { activationStart, allInRange, effectiveStart } = calc
  const displayActivationStart = activationStart !== null ? activationStart - effectiveStart : null
  if (activationStart === null) {
    return {
      className: 'activation-result fail',
      html: `<div class="result-title">${T(lang, 'resultFailTitle')}</div>${T(lang, 'resultFail', cfg.min, cfg.label)}`,
    }
  } else if (allInRange) {
    return {
      className: 'activation-result pass',
      html: `<div class="result-title">${T(lang, 'resultPassTitle')}</div>${T(lang, 'resultPass', cfg.min, displayActivationStart, ACTIVATION_DURATION, cfg.max)}`,
    }
  }
  return {
    className: 'activation-result fail',
    html: `<div class="result-title">${T(lang, 'resultOutTitle')}</div>${T(lang, 'resultOut', displayActivationStart, ACTIVATION_DURATION, cfg.min, cfg.max)}`,
  }
}

/** Entradas de enfriamiento tal como las lee el original: parseFloat del valor del input. */
export function legacyCoolingInput(
  inputs: { start: string; closed: string; end: string },
  target: number,
): LegacyCoolingInput {
  const coolingStartTime = parseFloat(inputs.start)
  const coolingClosed = parseFloat(inputs.closed)
  const coolingEnd = parseFloat(inputs.end)
  const hasCoolingEvents = !isNaN(coolingStartTime) || !isNaN(coolingClosed) || !isNaN(coolingEnd)
  return { hasCoolingEvents, coolingStartTime, coolingTargetTemp: target }
}

export function legacyCooling(
  columns: LegacyColumns,
  totalRows: number,
  inputs: { start: string; closed: string; end: string },
  target: number,
  lang: string,
): { className: string; display: string; html: string } {
  const { hasCoolingEvents, coolingStartTime, coolingTargetTemp } = legacyCoolingInput(inputs, target)
  if (hasCoolingEvents && !isNaN(coolingStartTime)) {
    let coolingAchievedTime: number | null = null

    for (let r = Math.floor(coolingStartTime); r < totalRows; r++) {
      const allCooled = columns.every((col) => col[r] !== null && (col[r] as number) <= coolingTargetTemp)

      if (allCooled) {
        coolingAchievedTime = r
        break
      }
    }

    if (coolingAchievedTime !== null) {
      const timeAfterCoolingStart = coolingAchievedTime - coolingStartTime
      return {
        className: 'activation-result pass',
        display: 'block',
        html: `<div class="result-title">${T(lang, 'coolingResultTitle')}</div>${T(lang, 'coolingResult', timeAfterCoolingStart, coolingTargetTemp)}`,
      }
    }
    return {
      className: 'activation-result fail',
      display: 'block',
      html: `<div class="result-title">${T(lang, 'coolingResultFailTitle')}</div>${T(lang, 'coolingResultFail', coolingTargetTemp)}`,
    }
  }
  return { className: 'activation-result', display: 'none', html: '' }
}

export function legacyActiveEvents(inputs: Record<string, string>, lang: string): LegacyEvent[] {
  const events: LegacyEvent[] = []
  Object.keys(EVENTS_CONFIG).forEach((category) => {
    Object.keys(EVENTS_CONFIG[category]).forEach((key) => {
      const config = EVENTS_CONFIG[category][key]
      const value = parseFloat(inputs[config.id])
      if (!isNaN(value) && value >= 0) {
        events.push({
          x: value,
          label: EVENTS_LABELS[lang][config.label],
          color: config.color,
          id: config.id,
        })
      }
    })
  })
  return events
}

export function legacyCalcLoss(thermoValue: string, nestValue: string): { text: string; className: string } {
  const thermo = parseFloat(thermoValue)
  const nest = parseFloat(nestValue)

  if (!isNaN(thermo) && !isNaN(nest)) {
    const loss = thermo - nest
    return {
      text: loss.toFixed(1) + ' °C',
      className: 'param-computed' + (loss > 0 ? ' loss-positive' : ' loss-zero'),
    }
  }
  return { text: '— °C', className: 'param-computed loss-zero' }
}

export function legacyMarkerPositions(visibleCount: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let visibleIndex = 0; visibleIndex < visibleCount; visibleIndex++) {
    let defaultX, defaultY

    if (visibleCount <= 2) {
      defaultX = 30 + visibleIndex * 40
      defaultY = 50
    } else if (visibleCount <= 4) {
      const row = Math.floor(visibleIndex / 2)
      const col = visibleIndex % 2
      defaultX = 25 + col * 50
      defaultY = 30 + row * 40
    } else if (visibleCount <= 6) {
      const row = Math.floor(visibleIndex / 3)
      const col = visibleIndex % 3
      defaultX = 20 + col * 30
      defaultY = 30 + row * 40
    } else if (visibleCount <= 9) {
      const row = Math.floor(visibleIndex / 3)
      const col = visibleIndex % 3
      defaultX = 20 + col * 30
      defaultY = 25 + row * 30
    } else {
      const row = Math.floor(visibleIndex / 5)
      const col = visibleIndex % 5
      defaultX = 15 + col * 18
      defaultY = 20 + row * 20
    }
    out.push({ x: defaultX, y: defaultY })
  }
  return out
}

export function legacySaveDefaults(form: {
  wbMin: string
  wbMax: string
  hmMin: string
  hmMax: string
  cooling: string
}): BondlineDefaults {
  return {
    waterbase: {
      min: parseFloat(form.wbMin) || 55,
      max: parseFloat(form.wbMax) || 75,
    },
    hotmelt: {
      min: parseFloat(form.hmMin) || 60,
      max: parseFloat(form.hmMax) || 80,
    },
    coolingTarget: parseFloat(form.cooling) || 35,
  }
}

export function legacyApplyTimeRange(
  startInput: string,
  endInput: string,
  totalRows: number,
  lang: string,
): { start: number; end: number | null } | { alert: string } {
  const start = parseInt(startInput) || 0
  const end = endInput ? parseInt(endInput) : null

  if (start < 0) {
    return { alert: lang === 'es' ? 'El tiempo de inicio debe ser mayor o igual a 0' : 'Start time must be 0 or greater' }
  }

  if (end !== null && end <= start) {
    return { alert: lang === 'es' ? 'El tiempo final debe ser mayor al inicial' : 'End time must be greater than start time' }
  }

  if (end !== null && end > totalRows) {
    return {
      alert: lang === 'es' ? `El tiempo final no puede exceder ${totalRows}s` : `End time cannot exceed ${totalRows}s`,
    }
  }

  return { start, end }
}

/** `text` es el deltaText sin la "s" final (el original añade `s` en el HTML del tooltip). */
export function legacyDragDelta(newX: number, originalX: number): { text: string; color: string } {
  const delta = newX - originalX
  const deltaText = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : `±0`
  const deltaColor = delta > 0 ? 'var(--green-text)' : delta < 0 ? 'var(--red-text)' : 'var(--text-3)'
  return { text: deltaText, color: deltaColor }
}

export function legacyAnnotations(
  calc: LegacyCalc,
  cfg: LegacyCfg,
  adhesiveType: string,
  events: LegacyEvent[],
  cooling: LegacyCoolingInput,
  dark: boolean,
  lang: string,
): Record<string, any> {
  const { activationStart, activationEnd, effectiveStart, effectiveRows } = calc

  const isHM = adhesiveType === 'hotmelt'
  const lc = isHM ? (dark ? 'rgba(248,184,79,' : 'rgba(245,158,11,') : dark ? 'rgba(34,211,238,' : 'rgba(6,182,212,'
  const gc = dark ? 'rgba(89,201,127,' : 'rgba(67,179,107,'

  const annotations: Record<string, any> = {
    minLine: { type: 'line', yMin: cfg.min, yMax: cfg.min, borderColor: lc + '0.8)', borderWidth: 2, borderDash: [8, 4], label: { display: true, content: T(lang, 'annotMin', cfg.min), position: 'start', backgroundColor: lc + '0.60)', color: lc + '1)', font: { size: 11, weight: '700' }, padding: { top: 4, bottom: 4, left: 8, right: 8 }, borderRadius: 8, yAdjust: 15 } },
    maxLine: { type: 'line', yMin: cfg.max, yMax: cfg.max, borderColor: lc + '0.8)', borderWidth: 2, borderDash: [8, 4], label: { display: true, content: T(lang, 'annotMax', cfg.max), position: 'start', backgroundColor: lc + '0.60)', color: lc + '1)', font: { size: 11, weight: '700' }, padding: { top: 4, bottom: 4, left: 8, right: 8 }, borderRadius: 8, yAdjust: -15 } },
  }
  if (activationStart !== null) {
    const adjustedActivationStart = activationStart - effectiveStart
    const adjustedActivationEnd = (activationEnd as number) - effectiveStart

    if (adjustedActivationEnd >= 0 && adjustedActivationStart < effectiveRows) {
      annotations.activationWindow = {
        type: 'box',
        xMin: Math.max(0, adjustedActivationStart),
        xMax: Math.min(effectiveRows - 1, adjustedActivationEnd),
        yMin: cfg.min,
        yMax: cfg.max,
        backgroundColor: gc + '0.08)',
        borderColor: gc + '0.45)',
        borderWidth: 2,
        borderDash: [6, 3],
        label: {
          display: true,
          content: T(lang, 'annotWindow', ACTIVATION_DURATION),
          position: { x: 'center', y: 'start' },
          color: dark ? '#9ae5b1' : '#217543',
          font: { size: 11, weight: '800' },
          padding: { top: 4, bottom: 4, left: 8, right: 8 },
          backgroundColor: gc + '0.14)',
          borderRadius: 8,
        },
      }
    }
  }

  events.forEach((evt, idx) => {
    const adjustedX = evt.x - effectiveStart

    if (adjustedX >= 0 && adjustedX < effectiveRows) {
      annotations[`event_${idx}`] = {
        type: 'line',
        xMin: adjustedX,
        xMax: adjustedX,
        borderColor: evt.color,
        borderWidth: 2,
        borderDash: [5, 5],
        label: {
          display: true,
          content: evt.label,
          position: 'start',
          backgroundColor: evt.color + '33',
          color: evt.color,
          font: { size: 10, weight: '700' },
          padding: { top: 3, bottom: 3, left: 6, right: 6 },
          borderRadius: 6,
          rotation: 270,
          yAdjust: -8,
        },
      }
    }
  })

  const { hasCoolingEvents, coolingStartTime, coolingTargetTemp } = cooling
  if (hasCoolingEvents && !isNaN(coolingStartTime)) {
    const adjustedCoolingStart = coolingStartTime - effectiveStart

    if (adjustedCoolingStart < effectiveRows) {
      const purpleColor = dark ? 'rgba(167,139,250,' : 'rgba(139,92,246,'
      annotations.coolingTargetLine = {
        type: 'line',
        xMin: Math.max(0, adjustedCoolingStart),
        xMax: effectiveRows - 1,
        yMin: coolingTargetTemp,
        yMax: coolingTargetTemp,
        borderColor: purpleColor + '0.9)',
        borderWidth: 3,
        borderDash: [10, 5],
        label: {
          display: true,
          content: `🎯 ${coolingTargetTemp}°C`,
          position: 'end',
          backgroundColor: purpleColor + '0.18)',
          color: purpleColor + '1)',
          font: { size: 11, weight: '800' },
          padding: { top: 4, bottom: 4, left: 8, right: 8 },
          borderRadius: 8,
          yAdjust: -15,
        },
      }
    }
  }

  return annotations
}

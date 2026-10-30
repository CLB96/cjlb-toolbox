import type { ChartConfiguration, ChartDataset, LegendItem, Scale, ScatterDataPoint } from 'chart.js'
import type {} from 'chartjs-plugin-annotation'
import type { Lang } from '../../../i18n/useI18n'
import { compressionTick } from '../logic/axis'
import { PALETTE_SOLID, hexToRgba, iterDataset, pointStyle } from '../logic/chartStyle'
import type { CoveringType, GapPoint, TargetInputs } from '../logic/types'
import { GAPCHECK_TEXTS } from '../i18n'

/** Colores de texto/rejilla/tooltip (tokens del tema). La paleta de datos no cambia. */
export interface GapcheckChartTheme {
  text: string
  grid: string
  tooltipBg: string
  tooltipTitle: string
  tooltipBody: string
  tooltipBorder: string
}

export interface ChartInput {
  points: readonly GapPoint[]
  maxIter: number
  visiblePoints: readonly number[]
  visibleIters: readonly number[]
  appliedTarget: number
  appliedCovering: CoveringType
  appliedInputs: TargetInputs
  lang: Lang
  theme: GapcheckChartTheme
  /** Clic en la leyenda: alterna la iteración en el store (R3). */
  onToggleIter: (iterIdx: number) => void
}

export type GapcheckChartConfig = ChartConfiguration<'scatter', ScatterDataPoint[]>

const TARGET_COLOR = '#43b36b'
const TICK_FONT = { size: 11, weight: '600' } as const
const TITLE_FONT = { size: 12, weight: '700' } as const

/** Dataset de una iteración con los estilos por punto de applyChartFilters (inventario §5). */
function iterationDataset(input: ChartInput, j: number, visiblePoints: ReadonlySet<number>) {
  const color = PALETTE_SOLID[j % PALETTE_SOLID.length]
  const data = new Set(input.visibleIters).has(j) ? iterDataset(input.points, visiblePoints, j) : []
  const styles = data.map((pt) => pointStyle(pt.y, input.appliedTarget))
  const dataset: ChartDataset<'scatter', ScatterDataPoint[]> = {
    label: `Iter ${j + 1}`,
    data,
    backgroundColor: hexToRgba(color, 0.82),
    borderColor: color,
    borderWidth: styles.map((s) => s.borderWidth),
    pointRadius: styles.map((s) => s.radius),
    pointHoverRadius: styles.map((s) => s.hoverRadius),
    pointStyle: styles.map((s) => s.style),
    showLine: false,
  }
  return dataset
}

function targetAnnotations(target: number) {
  if (!(target > 0)) return {}
  return {
    gapLine: {
      type: 'line' as const,
      yMin: target,
      yMax: target,
      borderColor: TARGET_COLOR,
      borderWidth: 2.5,
      borderDash: [6, 3],
      label: {
        display: true,
        content: `GapCheck: ${target.toFixed(2)} mm`,
        position: 'end' as const,
        backgroundColor: TARGET_COLOR,
        color: '#fff',
        font: { size: 11, weight: '700' as const },
      },
    },
  }
}

interface ChartCtx {
  chart: { scales: Record<string, { min: number; max: number }> }
}

function buildScales(input: ChartInput) {
  const { theme, points, appliedCovering, appliedInputs } = input
  const texts = GAPCHECK_TEXTS[input.lang]
  const names = points.map((p) => p.name)
  return {
    y: {
      position: 'left' as const,
      beginAtZero: false,
      grid: { color: theme.grid },
      title: { display: true, text: texts.axisThickness, color: theme.text, font: TITLE_FONT },
      ticks: {
        color: theme.text,
        font: TICK_FONT,
        callback: (value: number | string) => Number(value).toFixed(2) + ' mm',
      },
    },
    yPercentage: {
      position: 'right' as const,
      beginAtZero: false,
      grid: { display: false },
      title: { display: true, text: texts.axisCompression, color: theme.text, font: TITLE_FONT },
      ticks: {
        color: theme.text,
        font: TICK_FONT,
        callback: (value: number | string) =>
          compressionTick(Number(value), appliedCovering, appliedInputs),
      },
      min: (ctx: ChartCtx) => ctx.chart.scales.y.min,
      max: (ctx: ChartCtx) => ctx.chart.scales.y.max,
      // espeja los ticks del eje izquierdo del mismo gráfico (se construye antes: lado izquierdo)
      afterBuildTicks: (axis: Pick<Scale, 'chart' | 'ticks'>) => {
        const y = axis.chart.scales.y
        if (y) axis.ticks = y.ticks.map((tick) => ({ value: tick.value }))
      },
    },
    x: {
      type: 'linear' as const,
      min: 0,
      max: points.length + 1,
      grid: { color: theme.grid },
      ticks: {
        color: theme.text,
        font: TICK_FONT,
        stepSize: 1,
        maxRotation: 45,
        callback: (val: number | string) => {
          const idx = Math.round(Number(val)) - 1
          return idx >= 0 && idx < names.length ? names[idx] : ''
        },
      },
    },
  }
}

function buildPlugins(input: ChartInput) {
  const { theme } = input
  const names = input.points.map((p) => p.name)
  const visibleIters = new Set(input.visibleIters)
  return {
    legend: {
      display: true,
      position: 'bottom' as const,
      onClick: (_e: unknown, item: Pick<LegendItem, 'datasetIndex'>) => {
        if (item.datasetIndex !== undefined) input.onToggleIter(item.datasetIndex)
      },
      labels: {
        filter: (item: Pick<LegendItem, 'datasetIndex'>) =>
          visibleIters.has(item.datasetIndex ?? -1),
        color: theme.text,
        font: { size: 12, weight: '600' as const },
        padding: 15,
        usePointStyle: true,
        pointStyleWidth: 14,
      },
    },
    tooltip: {
      backgroundColor: theme.tooltipBg,
      titleColor: theme.tooltipTitle,
      bodyColor: theme.tooltipBody,
      borderColor: theme.tooltipBorder,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 10,
      displayColors: true,
      callbacks: {
        title: (items: { parsed: { x: number } }[]) => {
          if (!items.length) return ''
          const ptIdx = Math.round(items[0].parsed.x) - 1
          return names[ptIdx] || `P${ptIdx + 1}`
        },
        label: (item: { dataset: { label?: string }; parsed: { y: number } }) =>
          ` ${item.dataset.label}: ${item.parsed.y} mm`,
      },
    },
    annotation: { annotations: targetAnnotations(input.appliedTarget) },
  }
}

/** Configuración de la gráfica de createChart + applyChartFilters (inventario §5), pura. */
export function buildChartConfig(input: ChartInput): GapcheckChartConfig {
  const visiblePoints = new Set(input.visiblePoints)
  const datasets = Array.from({ length: input.maxIter }, (_, j) =>
    iterationDataset(input, j, visiblePoints),
  )
  return {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: buildPlugins(input),
      scales: buildScales(input),
    },
  } as unknown as GapcheckChartConfig
}

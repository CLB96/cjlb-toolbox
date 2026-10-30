import {
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  type ChartConfiguration,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { Lang } from '../../../i18n/useI18n'
import { translate } from '../i18n'
import { TC_COLORS, type AdhesiveType, type BondlineDefaults } from '../logic/types'
import type { BondlineView } from '../useBondlineView'
import { buildExportAnnotations } from './exportAnnotations'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, annotationPlugin)

export const EXPORT_CHART_W = 1800
export const EXPORT_CHART_H = 845

const TEXT = '#b3a6d9'
const TICKS = '#9a8fc0'
const GRID = 'rgba(255,255,255,.07)'

export interface ExportChartInput {
  view: BondlineView
  tcVisibility: readonly boolean[]
  adhesive: AdhesiveType
  defaults: BondlineDefaults
  lang: Lang
}

/** Configuración de la gráfica del PNG (inventario 7.6): solo TC visibles, sin tooltip ni leyenda. */
export function buildExportChartConfig(input: ExportChartInput): ChartConfiguration<'line'> {
  const { view, adhesive, defaults, lang } = input
  const reset = input.tcVisibility.length !== view.trimmed.length
  const datasets = view.trimmed.flatMap((col, i) =>
    reset || input.tcVisibility[i]
      ? [
          {
            label: `TC-${i + 1}`,
            data: col,
            borderColor: TC_COLORS[i % TC_COLORS.length],
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.3,
            spanGaps: true,
          },
        ]
      : [],
  )
  const t = (k: Parameters<typeof translate>[1], ...a: (number | string)[]) => translate(lang, k, ...a)
  const title = (text: string) => ({ display: true, text, color: TEXT, font: { size: 16, weight: 600 } })
  return {
    type: 'line',
    data: { labels: view.labels, datasets },
    options: {
      responsive: false,
      animation: false,
      scales: {
        x: { title: title(t('axisTime')), ticks: { color: TICKS, font: { size: 13 } }, grid: { color: GRID } },
        y: {
          min: view.yMin,
          max: view.yMax,
          title: title(t('axisTemp')),
          ticks: { color: TICKS, font: { size: 13 }, callback: (v: number | string) => v + '°C' },
          grid: { color: GRID },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        annotation: {
          annotations: buildExportAnnotations({
            view,
            adhesive,
            coolingTarget: defaults.coolingTarget,
            t: (key, value) => t(key, value),
          }),
        },
      },
    },
  } as unknown as ChartConfiguration<'line'>
}

export interface ExportChart {
  canvas: HTMLCanvasElement
  destroy: () => void
}

/**
 * Receta que funciona: canvas suelto con tamaño explícito, `responsive:false` y `animation:false`
 * (el primer render es síncrono). Quien la pide copia los píxeles (drawImage) ANTES de llamar a
 * destroy(), porque destroy() limpia el canvas.
 */
export function renderExportChart(input: ExportChartInput): ExportChart {
  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_CHART_W
  canvas.height = EXPORT_CHART_H
  const chart = new Chart(canvas, buildExportChartConfig(input))
  return { canvas, destroy: () => chart.destroy() }
}

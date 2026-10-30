import type { ChartConfiguration } from 'chart.js'
import type {} from 'chartjs-plugin-annotation'
import type { Lang } from '../../../i18n/useI18n'
import type { BondlineT } from '../i18n'
import type { BondlineView } from '../useBondlineView'
import { buildAnnotations, type Annotation } from '../logic/annotations'
import { TC_COLORS, type AdhesiveType, type Column } from '../logic/types'

/** Colores de texto/rejilla/tooltip del tema (R7). Datos y anotaciones: literales del original. */
export interface BondlineChartTheme {
  text: string
  grid: string
  tooltipBg: string
  tooltipTitle: string
  tooltipBody: string
  tooltipBorder: string
}

export interface ChartInput {
  view: BondlineView
  tcVisibility: readonly boolean[]
  adhesive: AdhesiveType
  coolingTarget: number
  lang: Lang
  dark: boolean
  theme: BondlineChartTheme
  t: BondlineT
}

export type BondlineChartConfig = ChartConfiguration<'line', Column, number>

const AXIS_TITLE_FONT = { size: 13, weight: '600' } as const

interface HoverCtx {
  element: { options: { borderWidth: number } }
}

/** Datasets de §5B: uno por TC, ocultos con la bandera (visibilidad de otra longitud = todas visibles). */
function datasets(view: BondlineView, tcVisibility: readonly boolean[]) {
  const reset = tcVisibility.length !== view.trimmed.length
  return view.trimmed.map((col, i) => ({
    label: `TC-${i + 1}`,
    data: col,
    borderColor: TC_COLORS[i % TC_COLORS.length],
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    pointRadius: 0,
    pointHoverRadius: 5,
    tension: 0.3,
    spanGaps: true,
    hidden: reset ? false : !tcVisibility[i],
  }))
}

/** Anotaciones de §5C con el realce al pasar el ratón de las líneas de suceso. */
function annotations(input: ChartInput): Record<string, Annotation> {
  const { view, adhesive, coolingTarget, dark, t } = input
  const anns = buildAnnotations({
    activationStart: view.activationStart,
    range: view.range,
    cfg: view.cfg,
    adhesive,
    events: view.events,
    cooling: view.cooling,
    coolingTarget,
    dark,
    t: (key, ...args) => t(key as Parameters<BondlineT>[0], ...args),
  })
  return Object.fromEntries(
    Object.entries(anns).map(([key, ann]) =>
      key.startsWith('event_')
        ? [
            key,
            {
              ...ann,
              enter({ element }: HoverCtx) {
                element.options.borderWidth = 3
              },
              leave({ element }: HoverCtx) {
                element.options.borderWidth = 2
              },
            },
          ]
        : [key, ann],
    ),
  )
}

/** Configuración de renderChart del original (inventario §5A–§5C), pura. */
export function buildChartConfig(input: ChartInput): BondlineChartConfig {
  const { view, theme, t } = input
  return {
    type: 'line',
    data: { labels: view.labels, datasets: datasets(view, input.tcVisibility) },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          title: { display: true, text: t('axisTime'), color: theme.text, font: AXIS_TITLE_FONT },
          ticks: { color: theme.text, font: { size: 11 }, maxTicksLimit: 30 },
          grid: { color: theme.grid },
        },
        y: {
          min: view.yMin,
          max: view.yMax,
          title: { display: true, text: t('axisTemp'), color: theme.text, font: AXIS_TITLE_FONT },
          ticks: { color: theme.text, font: { size: 11 }, callback: (v: number | string) => v + '°C' },
          grid: { color: theme.grid },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          titleFont: { weight: '800' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            title: (items: { label: string }[]) => `t = ${items[0].label}s`,
            label: (item: { dataset: { label?: string }; parsed: { y: number | null } }) =>
              ` ${item.dataset.label}: ${item.parsed.y?.toFixed(1) ?? '—'}°C`,
          },
        },
        annotation: { annotations: annotations(input) },
      },
    },
  } as unknown as BondlineChartConfig
}

import { Chart, Legend, LinearScale, PointElement, ScatterController, Tooltip } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { Lang } from '../../../i18n/useI18n'
import { FALLBACK_TOKENS } from '../../../theme/chartTheme'
import { buildChartConfig, type GapcheckChartTheme } from '../components/chartConfig'
import type { GapcheckState } from '../store'
import { EXPORT_CHART_H, EXPORT_CHART_W, EXPORT_SCALE } from './drawExport'

Chart.register(ScatterController, PointElement, LinearScale, Legend, Tooltip, annotationPlugin)

const dark = FALLBACK_TOKENS.dark

/** Colores del tema oscuro, fijos: el PNG es siempre Nebulosa aunque la app esté en claro. */
const DARK_THEME: GapcheckChartTheme = {
  text: dark['--fg-muted'],
  grid: 'rgba(255, 255, 255, 0.10)',
  tooltipBg: dark['--glass-solid'],
  tooltipTitle: dark['--fg'],
  tooltipBody: dark['--fg-muted'],
  tooltipBorder: dark['--edge'],
}

const noop = () => undefined

/**
 * Gráfica del export: misma configuración que la de pantalla (buildChartConfig, mismos datos,
 * filtros y línea objetivo) pero con tema oscuro, en un canvas fuera de pantalla de tamaño fijo,
 * sin animación ni responsive y a EXPORT_SCALE. Quien la pide debe llamar a destroy().
 */
export function renderExportChart(state: GapcheckState, lang: Lang): Chart<'scatter'> {
  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_CHART_W
  canvas.height = EXPORT_CHART_H
  const config = buildChartConfig({
    points: state.points,
    maxIter: state.maxIter,
    visiblePoints: state.visiblePoints,
    visibleIters: state.visibleIters,
    appliedTarget: state.appliedTarget,
    appliedCovering: state.appliedCovering,
    appliedInputs: state.appliedInputs,
    lang,
    theme: DARK_THEME,
    onToggleIter: noop,
  })
  return new Chart(canvas, {
    ...config,
    options: {
      ...config.options,
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      devicePixelRatio: EXPORT_SCALE,
    },
  })
}

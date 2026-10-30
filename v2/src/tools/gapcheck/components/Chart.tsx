import { useEffect, useMemo, useRef } from 'react'
import { Chart, Legend, LinearScale, PointElement, ScatterController, Tooltip } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { useI18n } from '../../../i18n/useI18n'
import { getChartTheme } from '../../../theme/chartTheme'
import { useTheme } from '../../../theme/useTheme'
import { useGapcheck, useGapcheckChartCanvas } from '../GapcheckStoreProvider'
import { useGapcheckT } from '../i18n'
import { buildChartConfig, type GapcheckChartTheme } from './chartConfig'

Chart.register(ScatterController, PointElement, LinearScale, Legend, Tooltip, annotationPlugin)

type ScatterChart = Chart<'scatter'>

/** Gráfica de dispersión (inventario §5). Se actualiza sin remontar el canvas. */
export function GapcheckChart() {
  const t = useGapcheckT()
  const { lang } = useI18n()
  const { resolved } = useTheme()
  const canvasRef = useGapcheckChartCanvas()
  const chartRef = useRef<ScatterChart | null>(null)

  const points = useGapcheck((s) => s.points)
  const maxIter = useGapcheck((s) => s.maxIter)
  const visiblePoints = useGapcheck((s) => s.visiblePoints)
  const visibleIters = useGapcheck((s) => s.visibleIters)
  const appliedTarget = useGapcheck((s) => s.appliedTarget)
  const appliedCovering = useGapcheck((s) => s.appliedCovering)
  const appliedInputs = useGapcheck((s) => s.appliedInputs)
  const toggleIter = useGapcheck((s) => s.toggleIter)

  const config = useMemo(() => {
    const ct = getChartTheme(resolved)
    const theme: GapcheckChartTheme = {
      text: ct.text,
      grid: ct.grid,
      tooltipBg: ct.tooltipBg,
      tooltipTitle: ct.tooltipTitle,
      tooltipBody: ct.tooltipBody,
      tooltipBorder: ct.tooltipBorder,
    }
    return buildChartConfig({
      points,
      maxIter,
      visiblePoints,
      visibleIters,
      appliedTarget,
      appliedCovering,
      appliedInputs,
      lang,
      theme,
      onToggleIter: toggleIter,
    })
  }, [points, maxIter, visiblePoints, visibleIters, appliedTarget, appliedCovering, appliedInputs, lang, resolved, toggleIter])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const chart = chartRef.current
    if (!chart) {
      chartRef.current = new Chart(canvas, config) as ScatterChart
      return
    }
    chart.data = config.data
    chart.options = config.options ?? {}
    chart.update()
  }, [config, canvasRef])

  useEffect(
    () => () => {
      chartRef.current?.destroy()
      chartRef.current = null
    },
    [],
  )

  return (
    <div className="gc-chart">
      <canvas ref={canvasRef} role="img" aria-label={t('chart')} />
    </div>
  )
}

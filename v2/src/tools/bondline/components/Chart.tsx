import { useEffect, useMemo, useRef } from 'react'
import {
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { useI18n } from '../../../i18n/useI18n'
import { getChartTheme } from '../../../theme/chartTheme'
import { useTheme } from '../../../theme/useTheme'
import { useBondline, useBondlineChartCanvas } from '../BondlineStoreProvider'
import { translate, type BondlineT } from '../i18n'
import { selectActiveSheet } from '../store'
import { useBondlineDefaultsCtx, type BondlineView } from '../useBondlineView'
import type { EventInputId } from '../logic/types'
import { buildChartConfig, type BondlineChartTheme } from './chartConfig'
import { useEventDrag } from './useEventDrag'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, annotationPlugin)

type LineChart = Chart<'line'>

interface Props {
  view: BondlineView
  disabled: boolean
}

/** Gráfica térmica (inventario §5): se crea una vez y se actualiza sin remontar el canvas. */
export function BondlineChart({ view, disabled }: Props) {
  const { lang } = useI18n()
  const { resolved } = useTheme()
  const canvasRef = useBondlineChartCanvas()
  const chartRef = useRef<LineChart | null>(null)
  const tcVisibility = useBondline((s) => s.config.tcVisibility)
  const adhesive = useBondline((s) => s.config.adhesive)
  const totalRows = useBondline((s) => selectActiveSheet(s)?.totalRows ?? 0)
  const setEventAction = useBondline((s) => s.setEvent)
  const { defaults } = useBondlineDefaultsCtx()

  const config = useMemo(() => {
    const ct = getChartTheme(resolved)
    const theme: BondlineChartTheme = {
      text: ct.text,
      grid: ct.grid,
      tooltipBg: ct.tooltipBg,
      tooltipTitle: ct.tooltipTitle,
      tooltipBody: ct.tooltipBody,
      tooltipBorder: ct.tooltipBorder,
    }
    const t: BondlineT = (key, ...args) => translate(lang, key, ...args)
    return buildChartConfig({
      view,
      tcVisibility,
      adhesive,
      coolingTarget: defaults.coolingTarget,
      lang,
      dark: resolved === 'dark',
      theme,
      t,
    })
  }, [view, tcVisibility, adhesive, defaults.coolingTarget, lang, resolved])

  // debe declararse antes de useEventDrag: la gráfica existe cuando el hook añade los listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const chart = chartRef.current
    if (!chart) {
      chartRef.current = new Chart(canvas, config) as LineChart
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

  const setEvent = (id: EventInputId, value: string) => {
    if (!disabled) setEventAction(id, value)
  }
  useEventDrag(chartRef, view.events, view.range, totalRows, setEvent, !disabled)

  return (
    <div className="bl-chart">
      <canvas ref={canvasRef} role="img" aria-label={translate(lang, 'exportTitle')} />
    </div>
  )
}

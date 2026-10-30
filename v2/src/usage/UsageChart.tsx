import { useEffect, useRef } from 'react'
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js'
import { getChartTheme } from '../theme/chartTheme'
import { useTheme } from '../theme/useTheme'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

type Props = { labels: string[]; hours: number[]; title: string }

/** Barras de horas por herramienta con los colores del tema activo. */
export function UsageChart({ labels, hours, title }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { resolved } = useTheme()

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const theme = getChartTheme(resolved)
    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { data: hours, backgroundColor: labels.map((_, i) => theme.series[i % theme.series.length]) },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: theme.text }, grid: { color: theme.grid } },
          y: { beginAtZero: true, ticks: { color: theme.text }, grid: { color: theme.grid } },
        },
      },
    })
    return () => chart.destroy()
  }, [labels, hours, resolved])

  return (
    <div className="usage-chart">
      <canvas ref={canvas} role="img" aria-label={title} />
    </div>
  )
}

import { useEffect, useRef } from 'react'
import {
  BarController, BarElement, CategoryScale, Chart, Legend, LinearScale,
  LineController, LineElement, PointElement, Tooltip,
  type ChartConfiguration,
} from 'chart.js'
import type { Componentes } from '../logic/types'
import type { Diseno } from '../logic/parse'
import { useGageflowT } from '../i18n'

Chart.register(
  BarController, BarElement, CategoryScale, LinearScale,
  LineController, LineElement, PointElement, Tooltip, Legend,
)

const PALETA = ['#8fb4ff', '#d16bff', '#ffd166', '#6a7bff', '#7cf0c4']

function varCss(nombre: string, respaldo: string): string {
  if (typeof window === 'undefined') return respaldo
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
  return v || respaldo
}

/** Crea el chart en un canvas y lo destruye al desmontar o cambiar la config. */
function useChart(config: ChartConfiguration | null) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !config) return
    const chart = new Chart(canvas, config)
    return () => chart.destroy()
  }, [config])
  return ref
}

export function ComponentesChart({ componentes, unidad }: { componentes: Componentes; unidad: string }) {
  const t = useGageflowT()
  const filas: [string, number, number][] = [
    [t('compEv'), componentes.ev.pctTolerancia ?? componentes.ev.pctContribucion, componentes.ev.seis],
    [t('compAv'), componentes.av.pctTolerancia ?? componentes.av.pctContribucion, componentes.av.seis],
    [t('compInt'), componentes.interaccion.pctTolerancia ?? componentes.interaccion.pctContribucion, componentes.interaccion.seis],
    [t('compGrr'), componentes.grr.pctTolerancia ?? componentes.grr.pctContribucion, componentes.grr.seis],
    [t('compPv'), componentes.parte.pctTolerancia ?? componentes.parte.pctContribucion, componentes.parte.seis],
  ]

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: filas.map(([n]) => n),
      datasets: [{
        label: '%',
        data: filas.map(([, pct]) => Number(pct.toFixed(1))),
        backgroundColor: filas.map((_, i) => PALETA[i]),
        borderRadius: 5,
        barThickness: 16,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.x.toFixed(1)} % · ${filas[c.dataIndex][2].toFixed(3)} ${unidad}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          grid: { color: varCss('--grid', 'rgba(255,255,255,.08)') },
          ticks: { color: varCss('--fg-muted', '#b3a6d9'), callback: (v) => `${v}%` },
        },
        y: {
          grid: { display: false },
          ticks: { color: varCss('--fg-muted', '#b3a6d9'), font: { size: 11 } },
        },
      },
    },
  }

  const ref = useChart(config)
  return <div className="gf-chart"><canvas ref={ref} aria-label={t('componentes')} /></div>
}

export function InteraccionChart({ diseno, matriz }: { diseno: Diseno; matriz: number[][][] }) {
  const t = useGageflowT()
  const medias = matriz.map((porOperador) =>
    porOperador.map((celda) => celda.reduce((a, b) => a + b, 0) / celda.length))

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: diseno.piezas,
      datasets: diseno.operadores.map((op, j) => ({
        label: op,
        data: medias.map((fila) => Number(fila[j].toFixed(4))),
        borderColor: PALETA[j % PALETA.length],
        backgroundColor: PALETA[j % PALETA.length],
        borderWidth: 2,
        pointRadius: 3,
        tension: 0,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: varCss('--fg-muted', '#b3a6d9'), boxWidth: 14, boxHeight: 2 },
        },
      },
      scales: {
        x: {
          grid: { color: varCss('--grid', 'rgba(255,255,255,.08)') },
          ticks: { color: varCss('--fg-muted', '#b3a6d9') },
          title: { display: true, text: t('piezas'), color: varCss('--fg-muted', '#b3a6d9') },
        },
        y: {
          grid: { color: varCss('--grid', 'rgba(255,255,255,.08)') },
          ticks: { color: varCss('--fg-muted', '#b3a6d9') },
        },
      },
    },
  }

  const ref = useChart(config)
  return <div className="gf-chart"><canvas ref={ref} aria-label={t('interaccion')} /></div>
}

import { act, fireEvent, render, screen } from '@testing-library/react'
import type { MutableRefObject } from 'react'
import { FIXTURES } from '../../../../legacy-fixtures/gapcheck/fixtures'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import {
  GapcheckStoreProvider,
  useGapcheckApi,
  useGapcheckChartCanvas,
} from '../GapcheckStoreProvider'
import type { GapcheckApi } from '../store'
import { GapcheckChart } from './Chart'
import { Filters } from './Filters'

const chartMock = vi.hoisted(() => {
  const instances: FakeChart[] = []
  class FakeChart {
    static register = vi.fn()
    canvas: HTMLCanvasElement
    data: { datasets: { data: unknown[] }[] }
    options: Record<string, unknown>
    update = vi.fn()
    destroy = vi.fn()
    constructor(canvas: HTMLCanvasElement, config: { data: FakeChart['data']; options: FakeChart['options'] }) {
      this.canvas = canvas
      this.data = config.data
      this.options = config.options
      instances.push(this)
    }
  }
  return { FakeChart, instances }
})

vi.mock('chart.js', () => ({
  Chart: chartMock.FakeChart,
  ScatterController: {},
  PointElement: {},
  LinearScale: {},
  Legend: {},
  Tooltip: {},
}))
vi.mock('chartjs-plugin-annotation', () => ({ default: {} }))

let api: GapcheckApi
let canvasRef: MutableRefObject<HTMLCanvasElement | null>
function Grab() {
  api = useGapcheckApi()
  canvasRef = useGapcheckChartCanvas()
  return null
}

function renderChart() {
  const utils = render(
    <GapcheckStoreProvider>
      <Grab />
      <Filters />
      <GapcheckChart />
    </GapcheckStoreProvider>,
  )
  return utils
}

function load() {
  act(() => {
    api.getState().loadRows('a.xlsx', FIXTURES.header)
  })
}

beforeEach(() => {
  chartMock.instances.length = 0
  localStorage.clear()
  __resetI18nForTests()
})

test('crea una sola gráfica y la actualiza sin remontar el canvas', () => {
  renderChart()
  load()
  expect(chartMock.instances).toHaveLength(1)
  const chart = chartMock.instances[0]
  expect(chart.data.datasets).toHaveLength(3)
  const canvas = chart.canvas
  act(() => api.getState().toggleIter(0))
  expect(chartMock.instances).toHaveLength(1)
  expect(chart.canvas).toBe(canvas)
  expect(chart.update).toHaveBeenCalled()
  expect(chart.data.datasets[0].data).toEqual([])
  expect(chart.data.datasets[1].data.length).toBeGreaterThan(0)
})

test('expone el canvas renderizado por la ref del proveedor (P2-A)', () => {
  renderChart()
  load()
  expect(canvasRef.current).toBeInstanceOf(HTMLCanvasElement)
  expect(canvasRef.current).toBe(chartMock.instances[0].canvas)
})

test('destruye la gráfica al desmontar', () => {
  const { unmount } = renderChart()
  load()
  const chart = chartMock.instances[0]
  unmount()
  expect(chart.destroy).toHaveBeenCalled()
  expect(canvasRef.current).toBeNull()
})

test('clic en la leyenda alterna la iteración y el chip se sincroniza (R3)', () => {
  renderChart()
  load()
  const chip = screen.getByRole('button', { name: 'Iter 2' })
  expect(chip).toHaveAttribute('aria-pressed', 'true')
  const legend = (chartMock.instances[0].options.plugins as { legend: { onClick: (e: unknown, i: { datasetIndex: number }) => void } }).legend
  act(() => legend.onClick({}, { datasetIndex: 1 }))
  expect(api.getState().visibleIters).toEqual([0, 2])
  expect(screen.getByRole('button', { name: 'Iter 2' })).toHaveAttribute('aria-pressed', 'false')
})

test('chips de punto e iteración con los textos originales y su efecto', () => {
  renderChart()
  load()
  expect(screen.getByText('Puntos')).toBeInTheDocument()
  expect(screen.getByText('Iteraciones')).toBeInTheDocument()
  const p = screen.getByRole('button', { name: 'B2' })
  fireEvent.click(p)
  expect(api.getState().visiblePoints).toEqual([0, 2, 3])
  expect(p).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(screen.getByRole('button', { name: 'Iter 3' }))
  expect(api.getState().visibleIters).toEqual([0, 1])
})

test('los chips reflejan el filtro real al reconstruir (R2)', () => {
  renderChart()
  load()
  act(() => {
    api.setState({ visibleIters: [1], visiblePoints: [0, 2] })
  })
  act(() => api.getState().applyComparison())
  expect(screen.getByRole('button', { name: 'Iter 1' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: 'Iter 2' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'B2' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: 'A1' })).toHaveAttribute('aria-pressed', 'true')
})

test('el chip de iteración activo usa el color de la paleta', () => {
  renderChart()
  load()
  const chip = screen.getByRole('button', { name: 'Iter 1' })
  expect(chip.style.borderColor).toBe('rgb(79, 140, 255)')
  fireEvent.click(chip)
  expect(chip.style.borderColor).toBe('')
})

import { act, fireEvent, render, screen } from '@testing-library/react'
import type { MutableRefObject } from 'react'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import { BondlineStoreProvider, useBondlineApi, useBondlineChartCanvas } from '../BondlineStoreProvider'
import type { BondlineApi } from '../store'
import type { BondlineDefaultsApi } from '../useBondlineDefaults'
import { BondlineDefaultsContext, useBondlineView } from '../useBondlineView'
import { FACTORY_DEFAULTS } from '../logic/types'
import { BondlineChart } from './Chart'
import { Legend } from './Legend'

const chartMock = vi.hoisted(() => {
  const instances: FakeChart[] = []
  class FakeChart {
    static register = vi.fn()
    canvas: HTMLCanvasElement
    data: { labels: number[]; datasets: { hidden: boolean; data: unknown[] }[] }
    options: { plugins: { annotation: { annotations: Record<string, { xMin?: number; borderColor?: string }> } } }
    scales = { x: { getPixelForValue: (v: number) => v * 10, getValueForPixel: (p: number) => p / 10 } }
    update = vi.fn()
    destroy = vi.fn()
    constructor(canvas: HTMLCanvasElement, config: Pick<FakeChart, 'data' | 'options'>) {
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
  LineController: {},
  LineElement: {},
  PointElement: {},
  CategoryScale: {},
  LinearScale: {},
  Tooltip: {},
}))
vi.mock('chartjs-plugin-annotation', () => ({ default: {} }))

const DEFAULTS: BondlineDefaultsApi = {
  defaults: FACTORY_DEFAULTS,
  loaded: true,
  save: async () => true,
  resetToFactory: async () => true,
}

let api: BondlineApi
let canvasRef: MutableRefObject<HTMLCanvasElement | null>
function Body({ disabled = false }: { disabled?: boolean }) {
  api = useBondlineApi()
  canvasRef = useBondlineChartCanvas()
  const view = useBondlineView()
  return view ? (
    <>
      <BondlineChart view={view} disabled={disabled} />
      <Legend view={view} disabled={disabled} />
    </>
  ) : null
}

const renderChart = (disabled = false) =>
  render(
    <BondlineStoreProvider>
      <BondlineDefaultsContext.Provider value={DEFAULTS}>
        <Body disabled={disabled} />
      </BondlineDefaultsContext.Provider>
    </BondlineStoreProvider>,
  )

function load() {
  act(() => {
    api.getState().loadWorkbook('b.xlsx', [{ name: 'H1', raw: FIXTURES.plain }])
  })
}

beforeEach(() => {
  chartMock.instances.length = 0
  localStorage.clear()
  __resetI18nForTests()
})

afterEach(() => {
  document.body.innerHTML = ''
})

test('crea una sola gráfica en el canvas del proveedor y la actualiza sin remontar', () => {
  const { unmount } = renderChart()
  load()
  expect(chartMock.instances).toHaveLength(1)
  const chart = chartMock.instances[0]
  expect(chart.canvas).toBe(canvasRef.current)
  expect(chart.data.datasets).toHaveLength(4)
  act(() => api.getState().setAdhesive('hotmelt'))
  expect(chartMock.instances).toHaveLength(1)
  expect(chart.update).toHaveBeenCalled()
  expect(chart.options.plugins.annotation.annotations.minLine.borderColor).toBe('rgba(245,158,11,0.8)')
  unmount()
  expect(chart.destroy).toHaveBeenCalledTimes(1)
})

test('leyenda: Ocultar cambia a Mostrar y oculta el dataset', () => {
  renderChart()
  load()
  const chart = chartMock.instances[0]
  const item = screen.getByText('TC-2').closest('[data-tc]')!
  const btn = item.querySelector('button')!
  expect(btn).toHaveTextContent('Ocultar')
  fireEvent.click(btn)
  expect(btn).toHaveTextContent('Mostrar')
  expect(item).toHaveClass('bl-legend__item--hidden')
  expect(chart.data.datasets.map((d) => d.hidden)).toEqual([false, true, false, false])
  fireEvent.click(btn)
  expect(btn).toHaveTextContent('Ocultar')
  expect(chart.data.datasets[1].hidden).toBe(false)
})

test('leyenda: límites, ventana y 🎯 Cooling solo con sucesos de cooling', () => {
  renderChart()
  load()
  expect(screen.getByText('Límites adhesivo')).toBeInTheDocument()
  expect(screen.getByText('Ventana activación')).toBeInTheDocument()
  expect(screen.queryByText(/🎯 Cooling/)).toBeNull()
  act(() => api.getState().setEvent('eventCoolingEnd', '100'))
  expect(screen.getByTestId('bl-legend')).toHaveTextContent('🎯 Cooling 35°C')
})

test('arrastrar un suceso con rango activo escribe el segundo absoluto y mueve la línea', () => {
  renderChart()
  load()
  act(() => {
    api.getState().setEvent('eventPressStart', '30')
    api.getState().setTimeRangeInput('start', '20')
    api.getState().applyTimeRange()
  })
  const chart = chartMock.instances[0]
  expect(chart.options.plugins.annotation.annotations.event_0.xMin).toBe(10)
  const canvas = canvasRef.current!
  fireEvent.click(canvas, { clientX: 100 })
  fireEvent.mouseDown(canvas, { clientX: 100 })
  fireEvent.mouseMove(canvas, { clientX: 150 })
  expect(api.getState().config.events.eventPressStart).toBe('35')
  expect(chart.options.plugins.annotation.annotations.event_0.xMin).toBe(15)
  expect(document.querySelectorAll('#dragEventTooltip')).toHaveLength(1)
  expect(document.querySelector('#dragEventTooltip')).toHaveTextContent('+5s — t=35s')
})

test('bloqueado: el arrastre no escribe y los botones de la leyenda están deshabilitados', () => {
  renderChart(true)
  load()
  act(() => api.getState().setEvent('eventPressStart', '30'))
  const canvas = canvasRef.current!
  fireEvent.click(canvas, { clientX: 300 })
  fireEvent.mouseDown(canvas, { clientX: 300 })
  fireEvent.mouseMove(canvas, { clientX: 400 })
  expect(api.getState().config.events.eventPressStart).toBe('30')
  expect(screen.getAllByRole('button', { name: 'Ocultar' })[0]).toBeDisabled()
})

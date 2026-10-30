import { act, fireEvent, render, screen } from '@testing-library/react'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import { BondlineStoreProvider, useBondlineApi } from '../BondlineStoreProvider'
import type { BondlineApi } from '../store'
import type { BondlineDefaultsApi } from '../useBondlineDefaults'
import { BondlineDefaultsContext, useBondlineView } from '../useBondlineView'
import { translate } from '../i18n'
import { FACTORY_DEFAULTS } from '../logic/types'
import { buildChartConfig } from './chartConfig'
import { Events } from './Events'
import { ProcessParams } from './ProcessParams'
import { ResultBoxes } from './ResultBoxes'

const DEFAULTS: BondlineDefaultsApi = {
  defaults: FACTORY_DEFAULTS,
  loaded: true,
  save: async () => true,
  resetToFactory: async () => true,
}

let api: BondlineApi
let chartAnnotations: Record<string, unknown> = {}
function Body() {
  api = useBondlineApi()
  const view = useBondlineView()
  if (view) {
    const theme = { text: '#t', grid: '#g', tooltipBg: '#b', tooltipTitle: '#a', tooltipBody: '#c', tooltipBorder: '#d' }
    chartAnnotations = buildChartConfig({
      view, tcVisibility: [], adhesive: 'waterbase', coolingTarget: 35, lang: 'es', dark: false, theme,
      t: (key, ...args) => translate('es', key, ...args),
    }).options?.plugins?.annotation?.annotations as Record<string, unknown>
  }
  return (
    <>
      <ProcessParams disabled={false} />
      {view && <ResultBoxes result={view.result} cooling={view.cooling} coolingTarget={35} />}
      <Events disabled={false} />
    </>
  )
}
const renderBody = () =>
  render(
    <BondlineStoreProvider>
      <BondlineDefaultsContext.Provider value={DEFAULTS}>
        <Body />
      </BondlineDefaultsContext.Provider>
    </BondlineStoreProvider>,
  )
const load = () =>
  act(() => {
    api.getState().loadWorkbook('b.xlsx', [{ name: 'H1', raw: FIXTURES.plain }])
  })
const open = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  localStorage.clear()
  __resetI18nForTests()
})

test('parámetros plegados por defecto; el estado se guarda en el store (R6)', () => {
  renderBody()
  const btn = screen.getByRole('button', { name: /Parámetros del proceso/ })
  expect(btn).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText('Termoregulador Superior')).toBeNull()
  fireEvent.click(btn)
  expect(btn).toHaveAttribute('aria-expanded', 'true')
  expect(api.getState().panels.params).toBe(true)
  expect(screen.getByText('Termoregulador Superior')).toBeInTheDocument()
})

test('pérdida: — °C vacío; 200 − 195 = 5.0 °C ámbar; valores como 12abc se aceptan', () => {
  renderBody()
  open(/Parámetros del proceso/)
  const upper = screen.getByTestId('lossUpper')
  expect(upper).toHaveTextContent('— °C')
  expect(upper).not.toHaveClass('bl-loss--pos')
  act(() => {
    api.getState().setParam('thermoUpper', '200')
    api.getState().setParam('nestUpper', '195')
  })
  expect(upper).toHaveTextContent('5.0 °C')
  expect(upper).toHaveClass('bl-loss--pos')
  act(() => api.getState().setParam('thermoLower', '12abc'))
  act(() => api.getState().setParam('nestLower', '2'))
  expect(screen.getByTestId('lossLower')).toHaveTextContent('10.0 °C')
})

test('escribir un suceso actualiza el store, las líneas de la gráfica y el resultado de cooling', () => {
  renderBody()
  load()
  open(/Sucesos/)
  fireEvent.change(screen.getByLabelText('Inicia Ciclo Cooling'), { target: { value: '40' } })
  expect(api.getState().config.events.eventCoolingStart).toBe('40')
  expect(screen.getByTestId('coolingResult')).toBeInTheDocument()
  // UI -> store -> vista -> configuración de la gráfica
  expect(chartAnnotations.event_0).toMatchObject({ xMin: 40, xMax: 40 })
  fireEvent.change(screen.getByLabelText('Inicia Ciclo Cooling'), { target: { value: '55' } })
  expect(chartAnnotations.event_0).toMatchObject({ xMin: 55 })
  expect(chartAnnotations.coolingTargetLine).toBeDefined()
})

test('parámetros de cooling ocultos hasta rellenar los 3 sucesos de cooling', () => {
  renderBody()
  load()
  open(/Sucesos/)
  expect(screen.queryByText('Parámetros de Cooling')).toBeNull()
  fireEvent.change(screen.getByLabelText('Inicia Ciclo Cooling'), { target: { value: '40' } })
  fireEvent.change(screen.getByLabelText('Cooling Cerrado'), { target: { value: '50' } })
  expect(screen.queryByText('Parámetros de Cooling')).toBeNull()
  fireEvent.change(screen.getByLabelText('Termina Ciclo Cooling'), { target: { value: '90' } })
  expect(screen.getByText('Parámetros de Cooling')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Chiller'), { target: { value: '5' } })
  expect(api.getState().config.coolingParams.chiller).toBe('5')
  expect(screen.getByLabelText('Cooling Nido Superior')).toBeInTheDocument()
  expect(screen.getByLabelText('Cooling Nido Inferior')).toBeInTheDocument()
})

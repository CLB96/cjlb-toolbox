import { act, fireEvent, render, screen } from '@testing-library/react'
import { FIXTURES } from '../../../../legacy-fixtures/bondline/fixtures'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import { BondlineStoreProvider, useBondlineApi } from '../BondlineStoreProvider'
import type { BondlineApi } from '../store'
import type { BondlineDefaultsApi } from '../useBondlineDefaults'
import { BondlineDefaultsContext, useBondlineView } from '../useBondlineView'
import { FACTORY_DEFAULTS } from '../logic/types'
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
function Body() {
  api = useBondlineApi()
  const view = useBondlineView()
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

test('escribir en los inputs actualiza el store', () => {
  renderBody()
  open(/Parámetros del proceso/)
  fireEvent.change(screen.getByLabelText('Termoregulador Superior'), { target: { value: '200' } })
  fireEvent.change(screen.getByLabelText('Temperatura Sliders'), { target: { value: '12.5' } })
  expect(api.getState().config.params.thermoUpper).toBe('200')
  expect(api.getState().config.params.slidersTemp).toBe('12.5')
})

test('leisters: añadir muestra Leister 2 y 3; quitar con uno no hace nada', () => {
  renderBody()
  open(/Parámetros del proceso/)
  expect(screen.getByText('Leister 1')).toBeInTheDocument()
  fireEvent.click(screen.getByTitle('−'))
  expect(api.getState().config.params.leisters).toHaveLength(1)
  fireEvent.click(screen.getByTitle('+'))
  fireEvent.click(screen.getByTitle('+'))
  expect(screen.getByText('Leister 2')).toBeInTheDocument()
  expect(screen.getByText('Leister 3')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Leister 2'), { target: { value: '300' } })
  expect(api.getState().config.params.leisters).toEqual(['', '300', ''])
  fireEvent.click(screen.getByTitle('−'))
  expect(screen.queryByText('Leister 3')).toBeNull()
})

test('sucesos plegados; 9 entradas en 3 grupos', () => {
  renderBody()
  load()
  const btn = screen.getByRole('button', { name: /Sucesos/ })
  expect(btn).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText('Inicia Ciclo Prensa')).toBeNull()
  fireEvent.click(btn)
  expect(api.getState().panels.events).toBe(true)
  for (const l of ['🔧 Prensa', '🤲 Manipulación', '❄️ Cooling']) expect(screen.getByText(l)).toBeInTheDocument()
  expect(screen.getAllByPlaceholderText('s')).toHaveLength(9)
  const input = screen.getByLabelText('Inicia Ciclo Prensa')
  expect(input).toHaveAttribute('step', '1')
  expect(input).toHaveAttribute('min', '0')
})

test('escribir un suceso actualiza el store, las líneas de la gráfica y el resultado de cooling', () => {
  renderBody()
  load()
  open(/Sucesos/)
  fireEvent.change(screen.getByLabelText('Inicia Ciclo Cooling'), { target: { value: '40' } })
  expect(api.getState().config.events.eventCoolingStart).toBe('40')
  expect(screen.getByTestId('coolingResult')).toBeInTheDocument()
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

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clear, createStore } from 'idb-keyval'
import * as XLSX from 'xlsx'
import { FIXTURES } from '../../../legacy-fixtures/gapcheck/fixtures'
import { loadRealRows } from '../../../legacy-fixtures/gapcheck/realFixture'
import { __resetI18nForTests, useI18n, type Lang } from '../../i18n/useI18n'
import { saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { useToasts } from '../../ui/toastStore'
import GapcheckTool from './GapcheckTool'
import { createGapcheckStore, snapshotOf } from './store'
import { GAPCHECK_TEXTS } from './i18n'

let setLangRef: ((l: Lang) => void) | null = null
function LangGrab() {
  setLangRef = useI18n().setLang
  return null
}

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  localStorage.clear()
  __resetI18nForTests()
  useToasts.setState({ toasts: [] })
})

const renderTool = () =>
  render(
    <UidProvider uid="u1">
      <LangGrab />
      <GapcheckTool toolId="gapcheck" active />
    </UidProvider>,
  )

async function seed(rows: unknown[][]) {
  const api = createGapcheckStore()
  expect(api.getState().loadRows('GAPDT.xlsx', rows)).toBe(true)
  await saveSnapshot('u1', 'gapcheck', snapshotOf(api.getState()))
}

const kpi = (id: string) => screen.getByTestId(`kpi-${id}`)

test('sin datos muestra la zona de carga con los textos originales', async () => {
  renderTool()
  expect(screen.getByText('Selecciona o arrastra tu archivo Excel')).toBeInTheDocument()
  expect(screen.getByText('Clic para subir').tagName).toBe('STRONG')
  expect(screen.getByRole('heading', { name: /Gapcheck Análisis/ })).toBeInTheDocument()
  expect(screen.queryByTestId('kpi-target')).toBeNull()
  await waitFor(() => expect(screen.getByLabelText(/Clic para subir/)).toBeEnabled())
})

test('la carga queda deshabilitada hasta restaurar', async () => {
  renderTool()
  expect(screen.getByLabelText(/Clic para subir/)).toBeDisabled()
  await waitFor(() => expect(screen.getByLabelText(/Clic para subir/)).toBeEnabled())
})

const real = loadRealRows()
test.skipIf(!real)('con el Excel real los 6 KPI muestran los valores del original', async () => {
  await seed(real as unknown[][])
  renderTool()
  await waitFor(() => expect(kpi('target')).toHaveTextContent('5.00'))
  expect(kpi('target')).toHaveTextContent('mm')
  expect(kpi('target').parentElement).toHaveTextContent(/GapCheck Objetivo.*Hard Covering/)
  expect(kpi('totalRecords')).toHaveTextContent(/^20$/)
  expect(kpi('avg')).toHaveTextContent(/^2\.25$/)
  expect(kpi('min')).toHaveTextContent(/^1\.7$/)
  expect(kpi('max')).toHaveTextContent(/^2\.65$/)
  expect(kpi('meeting')).toHaveTextContent(/^200 \/ 200$/)
  expect(screen.getByText(/iteraciones × 20 puntos/)).toBeInTheDocument()
})

test('cambiar a EN muestra los textos originales en inglés', async () => {
  await seed(FIXTURES.plain)
  renderTool()
  await screen.findByTestId('kpi-target')
  act(() => setLangRef!('en'))
  expect(screen.getByText('Global Average')).toBeInTheDocument()
  expect(screen.getByText('Skin Thickness (mm)')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Update Comparison/ })).toBeInTheDocument()
  expect(screen.getByText('10 iterations × 20 points')).toBeInTheDocument()
  expect(screen.getByText('Tipo de Covering')).toBeInTheDocument()
})

test('el resultado en vivo cambia al escribir pero el KPI espera al botón (R1)', async () => {
  await seed(FIXTURES.plain)
  renderTool()
  await waitFor(() => expect(screen.getByLabelText('Compresión Buscada')).toBeEnabled())
  fireEvent.change(screen.getByLabelText('Compresión Buscada'), { target: { value: '60' } })
  expect(screen.getByTestId('gapcheckValue')).toHaveTextContent('4.00')
  const formula = screen.getByTestId('gapcheckFormula')
  expect(formula).toHaveTextContent('Skin × (1 - 60%) → 10 × 0.40 = 4.00 mm')
  expect(within(formula).getByText('4.00 mm').tagName).toBe('STRONG')
  expect(kpi('target')).toHaveTextContent('5.00')
  await userEvent.click(screen.getByRole('button', { name: /Actualizar Comparación/ }))
  expect(kpi('target')).toHaveTextContent('4.00')
})

test('Soft Covering muestra sus campos con ids y valores por defecto', async () => {
  await seed(FIXTURES.plain)
  renderTool()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Soft Covering' })).toBeEnabled())
  await userEvent.click(screen.getByRole('button', { name: 'Soft Covering' }))
  const foam = screen.getByLabelText('Espesor de Foam (mm)')
  expect(foam).toHaveAttribute('id', 'foamThickness')
  expect(foam).toHaveValue(50)
  expect(screen.getByTestId('gapcheckValue')).toHaveTextContent('35.00')
  expect(document.getElementById('compressionPctSoft')).toHaveAttribute('max', '100')
})

test('subir un Excel carga los datos; un archivo ilegible avisa con toast', async () => {
  renderTool()
  const input = screen.getByLabelText(/Clic para subir/)
  await waitFor(() => expect(input).toBeEnabled())
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(FIXTURES.header), 'S')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  await userEvent.upload(input, new File([buf], 'datos.xlsx'))
  await waitFor(() => expect(kpi('totalRecords')).toHaveTextContent(/^4$/))
  expect(screen.getByText('datos.xlsx')).toBeInTheDocument()

  const change = screen.getByLabelText('Cambiar archivo')
  const bad = new File(['x'], 'roto.xlsx')
  Object.defineProperty(bad, 'arrayBuffer', { value: () => Promise.reject(new Error('boom')) })
  await userEvent.upload(change, bad)
  await waitFor(() =>
    expect(useToasts.getState().toasts.map((t) => t.message)).toContain(
      GAPCHECK_TEXTS.es.importFailed,
    ),
  )
})

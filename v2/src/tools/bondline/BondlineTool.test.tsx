import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clear, createStore } from 'idb-keyval'
import * as XLSX from 'xlsx'
import { FIXTURES } from '../../../legacy-fixtures/bondline/fixtures'
import { legacyActivationResultHtml, legacyRenderCalc } from '../../../legacy-fixtures/bondline/legacyReference'
import { loadRealWorkbook } from '../../../legacy-fixtures/bondline/realFixture'
import { __resetI18nForTests, useI18n } from '../../i18n/useI18n'
import { saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { useToasts } from '../../ui/toastStore'
import BondlineTool from './BondlineTool'
import { createBondlineStore, snapshotOf } from './store'

vi.mock('./components/Chart', () => ({ BondlineChart: () => <div data-testid="bl-chart" /> }))

const prefGate = vi.hoisted(() => ({ hold: null as Promise<void> | null, failSave: false }))
vi.mock('../../persistence/preferences', async (orig) => {
  const actual = await orig<typeof import('../../persistence/preferences')>()
  return {
    ...actual,
    loadPreference: async (...a: Parameters<typeof actual.loadPreference>) => {
      if (prefGate.hold) await prefGate.hold
      return actual.loadPreference(...a)
    },
    savePreference: async (...a: Parameters<typeof actual.savePreference>) => {
      if (prefGate.failSave) throw new Error('quota')
      return actual.savePreference(...a)
    },
  }
})

function LangGrab() {
  useI18n()
  return null
}

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  localStorage.clear()
  __resetI18nForTests()
  useToasts.setState({ toasts: [] })
  prefGate.hold = null
  prefGate.failSave = false
})

const renderTool = () =>
  render(
    <UidProvider uid="u1">
      <LangGrab />
      <BondlineTool toolId="bondline" active />
    </UidProvider>,
  )

async function seed(sheets: { name: string; raw: unknown[][] }[]) {
  const api = createBondlineStore()
  expect(api.getState().loadWorkbook('bondline.xlsx', sheets).ok).toBe(true)
  await saveSnapshot('u1', 'bondline', snapshotOf(api.getState()))
}

const kpi = (id: string) => screen.getByTestId(`kpi-${id}`)
const toasts = () => useToasts.getState().toasts.map((t) => t.message)
const ready = () => waitFor(() => expect(screen.getByRole('button', { name: 'Hotmelt' })).toBeEnabled())
const plainCalc = (min: number, max: number) =>
  legacyRenderCalc({
    columns: plainColumns(),
    totalRows: 120,
    cfg: { min, max, label: 'Water Base' },
    timeRange: { active: false, start: 0, end: null },
  })
const plainColumns = () =>
  (FIXTURES.plain[0] as number[]).map((_, c) => FIXTURES.plain.map((r) => r[c] as number))

test('sin datos muestra la zona de carga con los textos originales', async () => {
  renderTool()
  expect(screen.getByText('📂 Archivo de datos')).toBeInTheDocument()
  expect(screen.getByText('.xlsx / .xls / .csv — sin encabezados, cada columna = termopar')).toBeInTheDocument()
  expect(screen.getByText('haz clic para seleccionar').tagName).toBe('STRONG')
  expect(screen.queryByTestId('kpi-tc')).toBeNull()
  const input = screen.getByLabelText(/haz clic para seleccionar/)
  expect(input).toHaveAttribute('accept', '.xlsx,.xls,.csv')
  await waitFor(() => expect(input).toBeEnabled())
})

const real = loadRealWorkbook()
test.skipIf(!real)('con el Excel real: KPIs y caja de activación del original', async () => {
  await seed(real!)
  renderTool()
  await waitFor(() => expect(kpi('tc')).toHaveTextContent(/^6$/))
  expect(kpi('duration')).toHaveTextContent(/^91s$/)
  expect(kpi('min')).toHaveTextContent(/^28\.7°$/)
  expect(kpi('max')).toHaveTextContent(/^64\.4°$/)
  expect(kpi('activation')).toHaveTextContent(/^t=53s$/)
  const box = screen.getByTestId('activationResult')
  expect(box).toHaveTextContent('✓ Ventana de activación exitosa')
  expect(box).toHaveTextContent(
    'Todos los termopares alcanzaron 55°C en t=53s. Durante los 30s siguientes, todas las lecturas se mantuvieron entre 55°C y 75°C.',
  )
  expect(screen.getByText(/91 s × 6 termopares/)).toBeInTheDocument()
})

test('Hotmelt cambia tempInfo y recalcula; PP solo cambia la flama', async () => {
  await seed([{ name: 'H', raw: FIXTURES.plain }])
  renderTool()
  await ready()
  expect(screen.getByTestId('tempInfo')).toHaveTextContent('Mín: 55°C | Máx: 75°C')
  const wb = plainCalc(55, 75)
  expect(kpi('activation')).toHaveTextContent(`t=${wb.activationStart}s`)
  await userEvent.click(screen.getByRole('button', { name: 'Hotmelt' }))
  expect(screen.getByTestId('tempInfo')).toHaveTextContent('Mín: 60°C | Máx: 80°C')
  const hm = plainCalc(60, 80)
  expect(hm.activationStart).not.toBe(wb.activationStart)
  expect(kpi('activation')).toHaveTextContent(`t=${hm.activationStart}s`)

  const before = screen.getByTestId('activationResult').innerHTML
  expect(screen.getByTestId('substrateInfo')).toHaveTextContent('Necesita Flama: NO')
  await userEvent.click(screen.getByRole('button', { name: 'PP' }))
  expect(screen.getByTestId('substrateInfo')).toHaveTextContent('Necesita Flama: SÍ')
  expect(screen.getByTestId('activationResult').innerHTML).toBe(before)
})

test('guardar defaults aplica parseFloat || fábrica (R1) y recalcula la caja', async () => {
  await seed([{ name: 'H', raw: FIXTURES.plain }])
  renderTool()
  await ready()
  await userEvent.click(screen.getByRole('button', { name: /Valores Default/ }))
  expect(screen.getByRole('dialog', { name: '⚙️ Valores Default' })).toBeInTheDocument()
  expect(screen.getByText('Configura los rangos de temperatura predeterminados')).toBeInTheDocument()
  fireEvent.change(document.getElementById('defaultWaterBaseMin')!, { target: { value: '' } })
  fireEvent.change(document.getElementById('defaultWaterBaseMax')!, { target: { value: '60' } })
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(screen.getByTestId('tempInfo')).toHaveTextContent('Mín: 55°C | Máx: 60°C')
  const legacy = legacyActivationResultHtml(plainCalc(55, 60), { min: 55, max: 60, label: 'Water Base' }, 'es')
  const box = screen.getByTestId('activationResult')
  expect(box.innerHTML).toBe(legacy.html)
  expect(box.className).toContain('fail')
})

test('restaurar valores de fábrica pide confirmación, no cierra y refresca al momento (R8)', async () => {
  await seed([{ name: 'H', raw: FIXTURES.plain }])
  renderTool()
  await ready()
  await userEvent.click(screen.getByRole('button', { name: /Valores Default/ }))
  fireEvent.change(document.getElementById('defaultWaterBaseMax')!, { target: { value: '60' } })
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(screen.getByTestId('tempInfo')).toHaveTextContent('Máx: 60°C'))

  await userEvent.click(screen.getByRole('button', { name: /Valores Default/ }))
  expect(document.getElementById('defaultWaterBaseMax')).toHaveValue(60)
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
  await userEvent.click(screen.getByRole('button', { name: 'Restaurar valores de fábrica' }))
  expect(confirm).toHaveBeenCalledWith('¿Restaurar valores de fábrica?')
  expect(document.getElementById('defaultWaterBaseMax')).toHaveValue(60)
  await userEvent.click(screen.getByRole('button', { name: 'Restaurar valores de fábrica' }))
  await waitFor(() => expect(document.getElementById('defaultWaterBaseMax')).toHaveValue(75))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByTestId('tempInfo')).toHaveTextContent('Mín: 55°C | Máx: 75°C')
  confirm.mockRestore()
})

test('varias hojas: selector, flechas y hoja inválida con toast literal', async () => {
  await seed([
    { name: 'Uno', raw: FIXTURES.plain },
    { name: 'Mala', raw: FIXTURES.allText },
    { name: 'Tres', raw: FIXTURES.outOfRange },
  ])
  renderTool()
  await ready()
  expect(screen.getByText('📊 Hoja Activa')).toBeInTheDocument()
  const select = screen.getByRole('combobox')
  expect([...(select as HTMLSelectElement).options].map((o) => o.text)).toEqual(['1. Uno', '2. Mala', '3. Tres'])
  expect(screen.getByTitle('Hoja anterior')).toBeDisabled()
  await userEvent.click(screen.getByTitle('Hoja siguiente'))
  expect(toasts()).toContain('La hoja "Mala" no contiene datos de temperatura válidos')
  expect(select).toHaveValue('0')
  await userEvent.selectOptions(select, '2')
  expect(select).toHaveValue('2')
  expect(screen.getByTitle('Hoja siguiente')).toBeDisabled()
})

test('rango temporal: errores literales por toast y valores inválidos sin romper', async () => {
  await seed([{ name: 'H', raw: FIXTURES.plain }])
  renderTool()
  await ready()
  const start = screen.getByLabelText('Inicio (s)')
  const end = screen.getByLabelText('Fin (s)')
  expect(start).toHaveAttribute('placeholder', '0')
  expect(end).toHaveAttribute('placeholder', 'Auto')
  fireEvent.change(start, { target: { value: '-3' } })
  await userEvent.click(screen.getByTitle('Aplicar rango'))
  expect(toasts()).toContain('El tiempo de inicio debe ser mayor o igual a 0')
  fireEvent.change(start, { target: { value: '10' } })
  fireEvent.change(end, { target: { value: '500' } })
  await userEvent.click(screen.getByTitle('Aplicar rango'))
  expect(toasts()).toContain('El tiempo final no puede exceder 120s')
  fireEvent.change(end, { target: { value: '5' } })
  await userEvent.click(screen.getByTitle('Aplicar rango'))
  expect(toasts()).toContain('El tiempo final debe ser mayor al inicial')
  fireEvent.change(end, { target: { value: '60.5' } })
  await userEvent.click(screen.getByTitle('Aplicar rango'))
  expect(toasts()).toContain('El rango usa segundos enteros: se ignoraron los decimales')
  // inicio >= total: se acepta como el original y no rompe la vista
  fireEvent.change(start, { target: { value: '200' } })
  fireEvent.change(end, { target: { value: '' } })
  await userEvent.click(screen.getByTitle('Aplicar rango'))
  expect(screen.getByTestId('activationResult')).toHaveTextContent('⚠')
  await userEvent.click(screen.getByTitle('Restaurar'))
  expect(start).toHaveValue(null)
  expect(screen.getByTestId('activationResult')).toHaveTextContent('✓')
})

test('edición deshabilitada hasta restaurar y cargar los defaults', async () => {
  let release!: () => void
  prefGate.hold = new Promise<void>((r) => (release = r))
  await seed([{ name: 'H', raw: FIXTURES.plain }])
  renderTool()
  await screen.findByTestId('kpi-tc')
  expect(screen.getByRole('button', { name: 'Hotmelt' })).toBeDisabled()
  expect(screen.getByLabelText('Fecha de Prueba')).toBeDisabled()
  expect(screen.getByRole('button', { name: /Valores Default/ })).toBeDisabled()
  release()
  await ready()
  expect(screen.getByLabelText('Fecha de Prueba')).toBeEnabled()
})

test('subir un libro carga los datos; ilegible o vacío avisan por toast', async () => {
  renderTool()
  const input = screen.getByLabelText(/haz clic para seleccionar/)
  await waitFor(() => expect(input).toBeEnabled())
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(FIXTURES.plain), 'S1')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  await userEvent.upload(input, new File([buf], 'ciclo.xlsx'))
  await waitFor(() => expect(kpi('tc')).toHaveTextContent(/^4$/))
  expect(screen.getByText('ciclo.xlsx')).toBeInTheDocument()

  const change = screen.getByLabelText('Cambiar archivo')
  const bad = new File(['x'], 'roto.xlsx')
  Object.defineProperty(bad, 'arrayBuffer', { value: () => Promise.reject(new Error('boom')) })
  await userEvent.upload(change, bad)
  await waitFor(() => expect(toasts()).toContain('Error al leer el archivo. Por favor intenta de nuevo.'))
  expect(change).toHaveValue('') // se limpia: el mismo archivo corregido se puede recargar (mejora A16)

  const empty = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(empty, XLSX.utils.aoa_to_sheet([]), 'Vacia')
  const ebuf = XLSX.write(empty, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  await userEvent.upload(change, new File([ebuf], 'vacio.xlsx'))
  await waitFor(() => expect(toasts()).toContain('La hoja "Vacia" no contiene datos válidos'))
  expect(screen.getByText('ciclo.xlsx')).toBeInTheDocument()
})

test('si guardar los defaults falla, el diálogo sigue abierto con un toast', async () => {
  await seed([{ name: 'H', raw: FIXTURES.plain }])
  renderTool()
  await ready()
  prefGate.failSave = true
  await userEvent.click(screen.getByRole('button', { name: /Valores Default/ }))
  fireEvent.change(document.getElementById('defaultWaterBaseMax')!, { target: { value: '60' } })
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(toasts()).toContain('No se pudieron guardar tus preferencias.'))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(document.getElementById('defaultWaterBaseMax')).toHaveValue(60)
  expect(screen.getByTestId('tempInfo')).toHaveTextContent('Máx: 75°C')
})

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clear, createStore } from 'idb-keyval'
import * as XLSX from 'xlsx'
import { FIXTURES } from '../../../legacy-fixtures/bondline/fixtures'
import { loadRealWorkbook } from '../../../legacy-fixtures/bondline/realFixture'
import { AppShell } from '../../app/AppShell'
import { __resetI18nForTests } from '../../i18n/useI18n'
import { listSnapshots, loadSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { useToasts } from '../../ui/toastStore'
import { TOOLS } from '../registry'
import { STATIC_TEXTS } from './i18n'
import type { BondlineState } from './store'

// jsdom no tiene canvas: la gráfica real tiene sus propias pruebas
vi.mock('./components/Chart', () => ({ BondlineChart: () => <div data-testid="bl-chart" /> }))

const ui = (uid = 'u1') => (
  <UidProvider uid={uid}>
    <AppShell tools={TOOLS} />
  </UidProvider>
)

const kpi = (id: string) => screen.getByTestId(`kpi-${id}`)
const field = (label: string) => screen.getByLabelText(label)
const defaultField = (id: string) => document.getElementById(id) as HTMLInputElement

function xlsxFile(sheets: { name: string; raw: unknown[][] }[]): File {
  const wb = XLSX.utils.book_new()
  for (const s of sheets) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.raw), s.name)
  return new File([XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer], 'BOND.xlsx')
}

async function history(): Promise<BondlineState[]> {
  const metas = await listSnapshots('u1', 'bondline')
  const snaps = await Promise.all(metas.map((m) => loadSnapshot<BondlineState>('u1', 'bondline', m.id)))
  return snaps.map((s) => s!.data)
}

async function openTool(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: /Bondline/ }))
  const input = await screen.findByLabelText(/haz clic para seleccionar/)
  await waitFor(() => expect(input).toBeEnabled())
  return input
}

async function saveWaterbaseMin(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.click(screen.getByRole('button', { name: /Valores Default/ }))
  await user.clear(defaultField('defaultWaterBaseMin'))
  await user.type(defaultField('defaultWaterBaseMin'), value)
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(screen.getByTestId('tempInfo')).toHaveTextContent(`Mín: ${value}°C`))
}

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  localStorage.clear()
  __resetI18nForTests()
  useToasts.setState({ toasts: [] })
  window.location.hash = '#/home'
})

const real = loadRealWorkbook()
test.skipIf(!real)('con el Excel real: KPIs y resultado del original', async () => {
  const user = userEvent.setup()
  render(ui())
  await user.upload(await openTool(user), xlsxFile(real!))
  await waitFor(() => expect(kpi('tc')).toHaveTextContent(/^6$/))
  expect(kpi('duration')).toHaveTextContent(/^91s$/)
  expect(kpi('min')).toHaveTextContent(/^28\.7°$/)
  expect(kpi('max')).toHaveTextContent(/^64\.4°$/)
  expect(kpi('activation')).toHaveTextContent(/^t=53s$/)
  expect(screen.getByTestId('activationResult')).toHaveTextContent('✓ Ventana de activación exitosa')
})

test('editar → remontar restaura → Empezar de cero conserva los defaults → restaurar versión', async () => {
  const user = userEvent.setup()
  const { unmount } = render(ui())
  const sheets = [
    { name: 'Uno', raw: FIXTURES.plain },
    { name: 'Dos', raw: FIXTURES.outOfRange },
  ]
  await user.upload(await openTool(user), xlsxFile(sheets))
  await waitFor(() => expect(kpi('tc')).toBeInTheDocument())

  // valores por defecto: preferencia del usuario (R1)
  await saveWaterbaseMin(user, '50')

  // hoja 2 y edición: fecha, adhesivo, rango, suceso, parámetros y leisters
  await user.selectOptions(screen.getByRole('combobox'), '1')
  await user.type(field('Fecha de Prueba'), '30/10/2026')
  await user.click(screen.getByRole('button', { name: 'Hotmelt' }))
  await user.type(field('Inicio (s)'), '20')
  await user.type(field('Fin (s)'), '80')
  await user.click(screen.getByRole('button', { name: STATIC_TEXTS.applyRange }))
  await user.click(screen.getByRole('button', { name: /Sucesos/ }))
  await user.type(field('Inicia Ciclo Prensa'), '8')
  await user.click(screen.getByRole('button', { name: /Parámetros del proceso/ }))
  await user.type(field('Termoregulador Superior'), '85')
  await user.type(field('Nido Superior'), '80')
  await user.click(screen.getByRole('button', { name: '+' }))
  await user.type(field('Leister 2'), '120')
  expect(screen.getByTestId('lossUpper')).toHaveTextContent('5.0')

  // desmontar guarda lo pendiente; remontar restaura todo
  unmount()
  await waitFor(async () => expect((await history()).length).toBeGreaterThan(0))
  render(ui())
  await user.click(screen.getByRole('tab', { name: /Bondline/ }))
  await waitFor(() => expect(field('Fecha de Prueba')).toHaveValue('30/10/2026'))
  expect(screen.getByRole('combobox')).toHaveValue('1')
  expect(screen.getByRole('button', { name: 'Hotmelt' })).toHaveAttribute('aria-pressed', 'true')
  expect(field('Inicio (s)')).toHaveValue(20)
  expect(field('Fin (s)')).toHaveValue(80)
  // los paneles abiertos también se restauran
  expect(field('Inicia Ciclo Prensa')).toHaveValue(8)
  expect(field('Termoregulador Superior')).toHaveValue(85)
  expect(field('Leister 2')).toHaveValue(120)
  // la hoja 1 no heredó nada de la 2 (R2)
  await user.selectOptions(screen.getByRole('combobox'), '0')
  expect(field('Fecha de Prueba')).toHaveValue('')

  // Empezar de cero: EmptyState, versión previa en el historial y defaults intactos (R1)
  await user.click(screen.getByRole('tab', { name: 'Inicio' }))
  const resume = await screen.findByRole('region', { name: '¿Volver donde lo dejaste?' })
  await user.click(within(resume).getByRole('button', { name: 'Empezar de cero' }))
  await waitFor(() => expect(window.location.hash).toBe('#/bondline'))
  expect(await screen.findByText('📂 Archivo de datos')).toBeInTheDocument()
  expect(screen.queryByTestId('kpi-tc')).toBeNull()
  await waitFor(async () => {
    const snaps = await history()
    expect(snaps.some((s) => s.sheets.length === 0)).toBe(true)
    expect(snaps.some((s) => s.sheets.length === 2)).toBe(true)
  })
  await user.click(screen.getByRole('button', { name: /Valores Default/ }))
  await waitFor(() => expect(defaultField('defaultWaterBaseMin')).toHaveValue(50))
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))

  // restaurar la versión con datos no toca los defaults
  await user.click(screen.getByRole('button', { name: /Historial/ }))
  const restores = await screen.findAllByRole('button', { name: 'Restaurar' })
  await user.click(restores[restores.length - 1])
  await waitFor(() => expect(kpi('tc')).toBeInTheDocument())
  await user.click(screen.getByRole('button', { name: /Valores Default/ }))
  expect(defaultField('defaultWaterBaseMin')).toHaveValue(50)
})

test('otro usuario no ve el análisis ni los defaults del anterior', async () => {
  const user = userEvent.setup()
  const first = render(ui('u1'))
  await user.upload(await openTool(user), xlsxFile([{ name: 'Uno', raw: FIXTURES.plain }]))
  await waitFor(() => expect(kpi('tc')).toBeInTheDocument())
  await saveWaterbaseMin(user, '50')
  first.unmount()
  await waitFor(async () => expect((await history()).length).toBeGreaterThan(0))

  window.location.hash = '#/home'
  render(ui('u2'))
  await openTool(user)
  expect(screen.queryByTestId('kpi-tc')).toBeNull()
  await user.click(screen.getByRole('button', { name: /Valores Default/ }))
  await waitFor(() => expect(defaultField('defaultWaterBaseMin')).toHaveValue(55))
})

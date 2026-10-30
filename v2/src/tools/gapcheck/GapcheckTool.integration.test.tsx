import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clear, createStore } from 'idb-keyval'
import * as XLSX from 'xlsx'
import { FIXTURES } from '../../../legacy-fixtures/gapcheck/fixtures'
import { loadRealRows } from '../../../legacy-fixtures/gapcheck/realFixture'
import { AppShell } from '../../app/AppShell'
import { __resetI18nForTests } from '../../i18n/useI18n'
import { listSnapshots, loadSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { useToasts } from '../../ui/toastStore'
import { TOOLS } from '../registry'
import type { GapcheckState as GapcheckSnapshot } from './store'

// jsdom no tiene canvas: la gráfica real tiene sus propias pruebas
vi.mock('./components/Chart', () => ({ GapcheckChart: () => <div data-testid="gc-chart" /> }))

// Con el Excel real (gitignored) se comprueban los valores del original; si no, una fixture sintética
const real = loadRealRows()
const ROWS = real ?? FIXTURES.plain
const EXPECTED = real
  ? { avg: '2.25', min: '1.7', max: '2.65', meeting: '200 / 200' }
  : null

const ui = () => (
  <UidProvider uid="u1">
    <AppShell tools={TOOLS} />
  </UidProvider>
)

const kpi = (id: string) => screen.getByTestId(`kpi-${id}`)

function xlsxFile(rows: unknown[][]): File {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'S')
  return new File([XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer], 'GAPDT.xlsx')
}

async function history(): Promise<GapcheckSnapshot[]> {
  const metas = await listSnapshots('u1', 'gapcheck')
  const snaps = await Promise.all(metas.map((m) => loadSnapshot<GapcheckSnapshot>('u1', 'gapcheck', m.id)))
  return snaps.map((s) => s!.data)
}

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  localStorage.clear()
  __resetI18nForTests()
  useToasts.setState({ toasts: [] })
  window.location.hash = '#/home'
})

test('cargar → filtros, covering y entradas → aplicar → remontar restaura → Empezar de cero', async () => {
  const user = userEvent.setup()
  const { unmount } = render(ui())

  await user.click(screen.getByRole('tab', { name: /GapCheck/ }))
  const input = await screen.findByLabelText(/Clic para subir/)
  await waitFor(() => expect(input).toBeEnabled())
  await user.upload(input, xlsxFile(ROWS))

  // KPIs de la fixture (con el Excel real, los del original)
  await waitFor(() => expect(kpi('target')).toHaveTextContent(/^5\.00/))
  expect(kpi('totalRecords')).toHaveTextContent(/^20$/)
  if (EXPECTED) {
    expect(kpi('avg')).toHaveTextContent(new RegExp(`^${EXPECTED.avg}$`))
    expect(kpi('min')).toHaveTextContent(new RegExp(`^${EXPECTED.min}$`))
    expect(kpi('max')).toHaveTextContent(new RegExp(`^${EXPECTED.max}$`))
    expect(kpi('meeting')).toHaveTextContent(EXPECTED.meeting)
  }
  expect(screen.getByText('GAPDT.xlsx')).toBeInTheDocument()

  // filtros: ocultar el primer punto y la primera iteración
  const points = screen.getByRole('group', { name: 'Puntos' })
  const firstPoint = within(points).getAllByRole('button')[0]
  await user.click(firstPoint)
  expect(firstPoint).toHaveAttribute('aria-pressed', 'false')
  const iters = screen.getByRole('group', { name: 'Iteraciones' })
  const firstIter = within(iters).getAllByRole('button')[0]
  await user.click(firstIter)
  expect(firstIter).toHaveAttribute('aria-pressed', 'false')

  // covering Soft + entradas + aplicar
  await user.click(screen.getByRole('button', { name: 'Soft Covering' }))
  const pct = screen.getByLabelText('Compresión Buscada')
  await user.clear(pct)
  await user.type(pct, '60')
  const live = screen.getByTestId('gapcheckValue').textContent!
  expect(kpi('target')).toHaveTextContent(/^5\.00/) // R1: el KPI espera al botón
  await user.click(screen.getByRole('button', { name: /Actualizar Comparación/ }))
  expect(kpi('target')).toHaveTextContent(live)
  expect(kpi('target').parentElement).toHaveTextContent('Soft Covering')

  // desmontar guarda lo pendiente; remontar restaura todo
  unmount()
  await waitFor(async () => expect((await history()).length).toBeGreaterThan(0))
  render(ui())
  await user.click(screen.getByRole('tab', { name: /GapCheck/ }))
  await waitFor(() => expect(kpi('target')).toHaveTextContent(live))
  expect(kpi('target').parentElement).toHaveTextContent('Soft Covering')
  expect(screen.getByRole('button', { name: 'Soft Covering' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByLabelText('Compresión Buscada')).toHaveValue(60)
  const pointsAfter = screen.getByRole('group', { name: 'Puntos' })
  expect(within(pointsAfter).getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'false')
  const itersAfter = screen.getByRole('group', { name: 'Iteraciones' })
  expect(within(itersAfter).getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('GAPDT.xlsx')).toBeInTheDocument()

  // Empezar de cero: EmptyState y la versión previa queda en el historial
  await user.click(screen.getByRole('tab', { name: 'Inicio' }))
  const resume = await screen.findByRole('region', { name: '¿Volver donde lo dejaste?' })
  await user.click(within(resume).getByRole('button', { name: 'Empezar de cero' }))
  await waitFor(() => expect(window.location.hash).toBe('#/gapcheck'))
  expect(await screen.findByText('Selecciona o arrastra tu archivo Excel')).toBeInTheDocument()
  expect(screen.queryByTestId('kpi-target')).toBeNull()
  await waitFor(async () => {
    const snaps = await history()
    expect(snaps.some((s) => s.points.length === 0)).toBe(true)
    expect(snaps.some((s) => s.points.length === 20 && s.covering === 'soft')).toBe(true)
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsagePage } from './UsagePage'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'a', email: 'admin@x.com', displayName: 'Admin', emailVerified: true },
    isAdmin: true,
  }),
}))
vi.mock('../access/AccessRequestsPanel', () => ({ AccessRequestsPanel: () => <div>panel-solicitudes</div> }))
vi.mock('./UsageChart', () => ({ UsageChart: () => <div>grafico</div> }))
vi.mock('./usageService', () => ({ fetchSessions: vi.fn() }))

const writeFile = vi.fn()
const sheets: unknown[][][] = []
vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: (rows: unknown[][]) => {
      sheets.push(rows)
      return { rows }
    },
    book_new: () => ({}),
    book_append_sheet: vi.fn(),
  },
  writeFile: (...a: unknown[]) => writeFile(...a),
}))
import { fetchSessions } from './usageService'

const sess = {
  id: '1',
  uid: 'u',
  email: 'ana@x.com',
  name: 'Ana',
  tool: 'gapcheck',
  start: 0,
  lastBeat: 1_700_000_000_000,
  activeSeconds: 3600,
}

beforeEach(() => {
  vi.mocked(fetchSessions).mockReset()
  writeFile.mockReset()
  sheets.length = 0
})

test('muestra la tabla por persona, el panel de solicitudes y exporta a Excel', async () => {
  vi.mocked(fetchSessions).mockResolvedValue([sess])
  render(<UsagePage />)
  expect(await screen.findByText('ana@x.com')).toBeInTheDocument()
  expect(screen.getByText('panel-solicitudes')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }))
  await vi.waitFor(() => expect(writeFile).toHaveBeenCalled())
  expect(writeFile.mock.calls[0][1]).toMatch(/^cjlb-uso-\d{4}-\d{2}-\d{2}\.xlsx$/)
  expect(sheets[0][0]).toEqual(['Nombre', 'Correo', 'Horas', 'Última conexión', 'Herramientas'])
  expect(sheets[0][1].slice(0, 3)).toEqual(['Ana', 'ana@x.com', 1])
})

test('si falla la carga muestra error, no una tabla vacía', async () => {
  vi.mocked(fetchSessions).mockRejectedValue(new Error('x'))
  render(<UsagePage />)
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el uso.')
})

test('el filtro Mes vuelve a consultar', async () => {
  vi.mocked(fetchSessions).mockResolvedValue([])
  render(<UsagePage />)
  await screen.findByText('Sin uso en este periodo.')
  await userEvent.click(screen.getByRole('button', { name: 'Mes' }))
  await vi.waitFor(() => expect(fetchSessions).toHaveBeenCalledTimes(2))
})

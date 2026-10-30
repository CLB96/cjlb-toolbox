import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SnapshotMeta } from '../persistence/snapshotStore'
import { TOOLS } from '../tools/registry'

const navigate = vi.hoisted(() => vi.fn())
vi.mock('../app/useRoute', () => ({ useRoute: () => ({ route: 'home', navigate }) }))
vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'u1', email: 'a@b.com', displayName: 'Ana Pérez', emailVerified: true },
  }),
}))
const store = vi.hoisted(() => ({
  latestPerTool: vi.fn(),
  markFreshStart: vi.fn(),
}))
vi.mock('../persistence/snapshotStore', () => store)
const toastFn = vi.hoisted(() => vi.fn())
vi.mock('../ui/toastStore', () => ({ toast: toastFn }))

import { HomePage } from './HomePage'

const snap: SnapshotMeta = {
  id: 'local:gapcheck:1',
  uid: 'local',
  toolId: 'gapcheck',
  savedAt: Date.now() - 25 * 60_000,
}

beforeEach(() => {
  vi.clearAllMocks()
  store.latestPerTool.mockResolvedValue([])
  store.markFreshStart.mockResolvedValue(undefined)
})

test('sin snapshots: saludo, 5 tarjetas y sin sección de reanudar', async () => {
  render(<HomePage />)
  expect(screen.getByRole('heading', { level: 1, name: 'Hola, Ana Pérez' })).toBeInTheDocument()
  await waitFor(() => expect(store.latestPerTool).toHaveBeenCalledWith('local'))
  expect(screen.getAllByTestId('tool-card')).toHaveLength(5)
  expect(screen.queryByText('¿Volver donde lo dejaste?')).toBeNull()
})

test('Continuar navega sin marcar inicio limpio', async () => {
  store.latestPerTool.mockResolvedValue([snap])
  const user = userEvent.setup()
  render(<HomePage />)
  await screen.findByText('¿Volver donde lo dejaste?')
  expect(screen.getByText('hace 25 min')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  expect(navigate).toHaveBeenCalledWith('gapcheck')
  expect(store.markFreshStart).not.toHaveBeenCalled()
})

test('Empezar de cero marca inicio limpio y luego navega', async () => {
  store.latestPerTool.mockResolvedValue([snap])
  const user = userEvent.setup()
  render(<HomePage />)
  await user.click(await screen.findByRole('button', { name: 'Empezar de cero' }))
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('gapcheck'))
  expect(store.markFreshStart).toHaveBeenCalledWith('local', 'gapcheck')
  expect(store.markFreshStart.mock.invocationCallOrder[0]).toBeLessThan(
    navigate.mock.invocationCallOrder[0]!,
  )
})

test('si markFreshStart falla muestra toast y no navega', async () => {
  store.latestPerTool.mockResolvedValue([snap])
  store.markFreshStart.mockRejectedValue(new Error('x'))
  const user = userEvent.setup()
  render(<HomePage />)
  await user.click(await screen.findByRole('button', { name: 'Empezar de cero' }))
  await waitFor(() => expect(toastFn).toHaveBeenCalledWith('error', expect.any(String)))
  expect(navigate).not.toHaveBeenCalled()
})

test('si latestPerTool falla muestra toast y la página sigue', async () => {
  store.latestPerTool.mockRejectedValue(new Error('x'))
  render(<HomePage />)
  await waitFor(() => expect(toastFn).toHaveBeenCalledWith('error', expect.any(String)))
  expect(screen.getAllByTestId('tool-card')).toHaveLength(5)
})

test('tarjeta hold deshabilitada con su etiqueta; badges visibles', async () => {
  const tools = [
    { ...TOOLS[3]! },
    { ...TOOLS[0]!, status: 'hold' as const, holdLabelEs: 'Planificado' },
  ]
  render(<HomePage tools={tools} />)
  const cards = screen.getAllByTestId('tool-card')
  expect(within(cards[0]!).getByText('Nuevo')).toBeInTheDocument()
  expect(within(cards[1]!).getByText('Planificado')).toBeInTheDocument()
  expect(within(cards[1]!).getByRole('button')).toBeDisabled()
  await waitFor(() => expect(store.latestPerTool).toHaveBeenCalled())
})

test('ícono: emoji sin iconSvg; img con iconSvg y vuelve al emoji si falla', async () => {
  const noSvg = { ...TOOLS[0]!, icon: '📊' }
  const { rerender } = render(<HomePage tools={[noSvg]} />)
  expect(screen.getByText('📊')).toBeInTheDocument()
  expect(document.querySelector('img.tool-card__icon-img')).toBeNull()

  rerender(<HomePage tools={[{ ...noSvg, iconSvg: '/x.svg' }]} />)
  const img = document.querySelector('img.tool-card__icon-img') as HTMLImageElement
  expect(img).toHaveAttribute('src', '/x.svg')
  fireEvent.error(img)
  await waitFor(() => {
    expect(document.querySelector('img.tool-card__icon-img')).toBeNull()
    expect(screen.getByText('📊')).toBeInTheDocument()
  })
})

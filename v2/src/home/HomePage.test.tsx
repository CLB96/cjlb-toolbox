import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SnapshotMeta } from '../persistence/snapshotStore'

const navigate = vi.hoisted(() => vi.fn())
vi.mock('../app/useRoute', () => ({ useRoute: () => ({ route: 'home', navigate }) }))
const store = vi.hoisted(() => ({
  latestPerTool: vi.fn(),
  markFreshStart: vi.fn(),
}))
vi.mock('../persistence/snapshotStore', () => store)
const toastFn = vi.hoisted(() => vi.fn())
vi.mock('../ui/toastStore', () => ({ toast: toastFn }))

import { HomePage } from './HomePage'
import { SessionProvider } from '../auth/session'
import { registerTool } from '../persistence/flushRegistry'

const session = {
  user: { uid: 'u1', email: 'a@b.com', displayName: 'Ana Pérez', emailVerified: true },
  isAdmin: false,
}

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
  render(
    <SessionProvider session={session}>
      <HomePage />
    </SessionProvider>,
  )
  expect(screen.getByRole('heading', { level: 1, name: 'Hola, Ana Pérez' })).toBeInTheDocument()
  await waitFor(() => expect(store.latestPerTool).toHaveBeenCalledWith('local'))
  expect(screen.getAllByTestId('tool-card')).toHaveLength(5)
  expect(screen.queryByText('¿Volver donde lo dejaste?')).toBeNull()
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

test('espera el flush de las herramientas montadas antes de leer la lista de reanudar', async () => {
  let release!: () => void
  const flush = vi.fn(() => new Promise<void>((r) => (release = r)))
  const off = registerTool('gapcheck', { uid: 'local', flush, startFresh: vi.fn() })
  render(<HomePage />)
  await waitFor(() => expect(flush).toHaveBeenCalled())
  expect(store.latestPerTool).not.toHaveBeenCalled()
  release()
  await waitFor(() => expect(store.latestPerTool).toHaveBeenCalledWith('local'))
  off()
})

test('Empezar de cero con la herramienta montada la resetea en vez de dejar el flag', async () => {
  store.latestPerTool.mockResolvedValue([snap])
  const handle = { uid: 'local', flush: vi.fn().mockResolvedValue(undefined), startFresh: vi.fn().mockResolvedValue(undefined) }
  const off = registerTool('gapcheck', handle)
  const user = userEvent.setup()
  render(<HomePage />)
  await user.click(await screen.findByRole('button', { name: 'Empezar de cero' }))
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('gapcheck'))
  expect(handle.startFresh).toHaveBeenCalledTimes(1)
  expect(store.markFreshStart).not.toHaveBeenCalled()
  off()
})

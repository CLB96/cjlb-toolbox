import { renderHook, act } from '@testing-library/react'
import { useUsageTracking } from './useUsageTracking'
import { useToasts } from '../ui/toastStore'

let mockRoute = 'gantt'
vi.mock('../app/useRoute', () => ({
  useRoute: () => ({ route: mockRoute, navigate: vi.fn() }),
}))
vi.mock('./usageService', () => ({
  recordLogin: vi.fn(),
  startSession: vi.fn(),
  beat: vi.fn(),
}))
import { beat, recordLogin, startSession } from './usageService'

const user = { uid: 'u1', email: 'a@b.com', displayName: 'Ana', emailVerified: true }

beforeEach(() => {
  vi.useFakeTimers()
  mockRoute = 'gantt'
  useToasts.setState({ toasts: [] })
  vi.mocked(recordLogin).mockReset().mockResolvedValue()
  vi.mocked(startSession).mockReset().mockResolvedValue('s1')
  vi.mocked(beat).mockReset().mockResolvedValue()
})
afterEach(() => vi.useRealTimers())

test('registra el login y abre sesión; a los 60 s con interacción hace beat de 60', async () => {
  renderHook(() => useUsageTracking(user))
  await act(async () => {})
  expect(recordLogin).toHaveBeenCalledWith(user)
  expect(startSession).toHaveBeenCalledWith(user, 'gantt')
  await act(async () => {
    document.dispatchEvent(new Event('pointerdown'))
    await vi.advanceTimersByTimeAsync(60_000)
  })
  expect(beat).toHaveBeenCalledWith('s1', 60)
})

test('al cambiar de ruta hace beat final y abre sesión nueva', async () => {
  const { rerender } = renderHook(() => useUsageTracking(user))
  await act(async () => {})
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20_000)
  })
  mockRoute = 'bondline'
  rerender()
  await act(async () => {})
  expect(beat).toHaveBeenCalledWith('s1', 20)
  expect(startSession).toHaveBeenLastCalledWith(user, 'bondline')
})

test('un fallo de beat avisa una sola vez por sesión y sigue registrando', async () => {
  vi.mocked(beat).mockRejectedValue(new Error('x'))
  let shown = 0
  const unsub = useToasts.subscribe((st, prev) => {
    shown += Math.max(0, st.toasts.length - prev.toasts.length)
  })
  renderHook(() => useUsageTracking(user))
  await act(async () => {})
  await act(async () => {
    await vi.advanceTimersByTimeAsync(180_000)
  })
  expect(vi.mocked(beat).mock.calls.length).toBeGreaterThanOrEqual(3)
  unsub()
  expect(shown).toBe(1)
})

test('si startSession no responde en 15 s avisa una vez y sigue esperando', async () => {
  vi.mocked(startSession).mockReturnValue(new Promise(() => {}))
  let shown = 0
  const unsub = useToasts.subscribe((st, prev) => {
    shown += Math.max(0, st.toasts.length - prev.toasts.length)
  })
  renderHook(() => useUsageTracking(user))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(14_000)
  })
  expect(shown).toBe(0)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2_000)
  })
  unsub()
  expect(shown).toBe(1)
})

test('si beat no responde en 15 s avisa una vez', async () => {
  vi.mocked(beat).mockReturnValue(new Promise(() => {}))
  let shown = 0
  const unsub = useToasts.subscribe((st, prev) => {
    shown += Math.max(0, st.toasts.length - prev.toasts.length)
  })
  renderHook(() => useUsageTracking(user))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000 + 16_000)
  })
  unsub()
  expect(shown).toBe(1)
})

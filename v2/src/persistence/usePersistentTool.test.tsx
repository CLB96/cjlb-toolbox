import { act, render, renderHook, waitFor } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import { StrictMode, type ReactNode } from 'react'
import { UidProvider } from './uidContext'
import { flushTool } from './flushRegistry'
import { listSnapshots, markFreshStart, saveSnapshot } from './snapshotStore'
import { usePersistentTool } from './usePersistentTool'
import { useToasts } from '../ui/toastStore'

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  useToasts.setState({ toasts: [] })
})

const wrap = (uid: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <UidProvider uid={uid}>{children}</UidProvider>
  }

function adapter(state = { v: 0 }) {
  return { restore: vi.fn(), getSnapshot: vi.fn(() => state) }
}

test('restaura el último snapshot al montar', async () => {
  await saveSnapshot('u1', 'gantt', { v: 7 })
  const ad = adapter()
  renderHook(() => usePersistentTool('gantt', ad), { wrapper: wrap('u1') })
  await waitFor(() => expect(ad.restore).toHaveBeenCalledWith({ v: 7 }))
})

test('tras markFreshStart no restaura (esperando a que el hook esté listo) y conserva el historial', async () => {
  await saveSnapshot('u1', 'gantt', { v: 7 })
  await markFreshStart('u1', 'gantt')
  const ad = adapter()
  const { result } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: wrap('u1') })
  act(() => result.current.markDirty())
  await act(async () => {
    await result.current.flush()
  })
  expect(ad.getSnapshot).toHaveBeenCalled()
  expect(ad.restore).not.toHaveBeenCalled()
  expect(await listSnapshots('u1', 'gantt')).toHaveLength(2)
})

test('StrictMode: markFreshStart sigue sin restaurar tras el doble efecto', async () => {
  await saveSnapshot('u1', 'gantt', { v: 7 })
  await markFreshStart('u1', 'gantt')
  const ad = adapter()
  const { result } = renderHook(() => usePersistentTool('gantt', ad), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <StrictMode>
        <UidProvider uid="u1">{children}</UidProvider>
      </StrictMode>
    ),
  })
  act(() => result.current.markDirty())
  await act(async () => {
    await result.current.flush()
  })
  expect(ad.getSnapshot).toHaveBeenCalled()
  expect(ad.restore).not.toHaveBeenCalled()
})

test('markDirty antes de estar listo: restaura primero y luego guarda', async () => {
  await saveSnapshot('u1', 'gantt', { v: 7 })
  const ad = adapter({ v: 8 })
  function C() {
    usePersistentTool('gantt', ad).markDirty()
    return null
  }
  render(
    <UidProvider uid="u1">
      <C />
    </UidProvider>,
  )
  await act(async () => {
    await flushTool('gantt')
  })
  expect(ad.restore).toHaveBeenCalledWith({ v: 7 })
  expect(ad.restore.mock.invocationCallOrder[0]).toBeLessThan(
    ad.getSnapshot.mock.invocationCallOrder[0],
  )
  expect(await listSnapshots('u1', 'gantt')).toHaveLength(2)
})

test('cambio de uid: lo pendiente de A se guarda bajo A y nada bajo el nuevo uid', async () => {
  let uid = 'uA'
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <UidProvider uid={uid}>{children}</UidProvider>
  )
  const ad = adapter({ v: 5 })
  const { result, rerender } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: Wrapper })
  act(() => result.current.markDirty())
  uid = 'uB'
  await act(async () => {
    rerender()
  })
  await waitFor(async () => expect(await listSnapshots('uA', 'gantt')).toHaveLength(1))
  await act(async () => {
    await flushTool('gantt')
  })
  expect(await listSnapshots('uB', 'gantt')).toHaveLength(0)
})

test('restoreVersion que falla muestra toast de error en vez de rechazar', async () => {
  const meta = await saveSnapshot('u1', 'gantt', { v: 1 })
  const ad = adapter()
  const { result } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: wrap('u1') })
  await waitFor(() => expect(ad.restore).toHaveBeenCalledTimes(1))
  ad.restore.mockImplementation(() => {
    throw new Error('boom')
  })
  await act(async () => {
    await result.current.restoreVersion(meta.id)
  })
  expect(useToasts.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
})

test('markDirty + flushTool guarda y actualiza lastSavedAt', async () => {
  const ad = adapter({ v: 3 })
  const { result } = renderHook(() => usePersistentTool('gapcheck', ad), { wrapper: wrap('u9') })
  expect(result.current.lastSavedAt).toBeNull()
  act(() => result.current.markDirty())
  await act(async () => {
    await flushTool('gapcheck')
  })
  expect(result.current.lastSavedAt).not.toBeNull()
  expect(await listSnapshots('u9', 'gapcheck')).toHaveLength(1)
})

test('un fallo de guardado muestra toast de error', async () => {
  const ad = adapter()
  ad.getSnapshot.mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  const { result } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: wrap('u1') })
  act(() => result.current.markDirty())
  await act(async () => {
    await result.current.flush()
  })
  expect(useToasts.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
})

test('sin provider usa uid local y se desregistra al desmontar', async () => {
  const ad = adapter({ v: 1 })
  function C() {
    const p = usePersistentTool('bondline', ad)
    p.markDirty()
    return null
  }
  const { unmount } = render(<C />)
  await act(async () => {
    await flushTool('bondline')
  })
  expect(await listSnapshots('local', 'bondline')).toHaveLength(1)
  unmount()
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20))
  })
  ad.getSnapshot.mockClear()
  await flushTool('bondline')
  expect(ad.getSnapshot).not.toHaveBeenCalled()
})

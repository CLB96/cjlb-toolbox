import { act, render, renderHook, waitFor } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import type { ReactNode } from 'react'
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

test('tras markFreshStart no restaura y conserva el historial', async () => {
  await saveSnapshot('u1', 'gantt', { v: 7 })
  await markFreshStart('u1', 'gantt')
  const ad = adapter()
  const { result } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: wrap('u1') })
  await act(async () => {
    await result.current.flush()
  })
  expect(ad.restore).not.toHaveBeenCalled()
  expect(await listSnapshots('u1', 'gantt')).toHaveLength(1)
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
  ad.getSnapshot.mockClear()
  await flushTool('bondline')
  expect(ad.getSnapshot).not.toHaveBeenCalled()
})

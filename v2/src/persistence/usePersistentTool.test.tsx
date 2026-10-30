import { act, render, renderHook, waitFor } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import { StrictMode, useEffect, type ReactNode } from 'react'
import { UidProvider } from './uidContext'
import { flushTool } from './flushRegistry'
import {
  consumeFreshStart,
  listSnapshots,
  loadSnapshot,
  markFreshStart,
  saveSnapshot,
} from './snapshotStore'
import { startFresh } from './freshStart'
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
  return { restore: vi.fn(), getSnapshot: vi.fn(() => state), reset: vi.fn() }
}

/** Adaptador con estado real: restore/reset cambian lo que devuelve getSnapshot. */
function statefulAdapter<S>(initial: S) {
  const box = { state: initial }
  return {
    box,
    getSnapshot: vi.fn(() => box.state),
    restore: vi.fn((s: S) => {
      box.state = s
    }),
    reset: vi.fn(() => {
      box.state = initial
    }),
  }
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

test('cambio de uid: lo pendiente de A se guarda bajo A y nada bajo el nuevo uid', async () => {
  let uid = 'uA'
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <UidProvider uid={uid}>{children}</UidProvider>
  )
  const ad = adapter({ v: 5 })
  const { result, rerender } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.restored).toBe(true))
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

test('StrictMode: el efecto desechado no guarda el estado inicial en blanco', async () => {
  await saveSnapshot('u1', 'gantt', { v: 7 })
  const ad = statefulAdapter({ v: 0 })
  function C() {
    const p = usePersistentTool('gantt', ad)
    const { markDirty } = p
    useEffect(() => {
      markDirty()
    }, [markDirty])
    return null
  }
  render(
    <StrictMode>
      <UidProvider uid="u1">
        <C />
      </UidProvider>
    </StrictMode>,
  )
  await waitFor(() => expect(ad.restore).toHaveBeenCalledWith({ v: 7 }))
  await act(async () => {
    await flushTool('gantt')
    await new Promise((r) => setTimeout(r, 20))
  })
  const all = await listSnapshots('u1', 'gantt')
  const datas = await Promise.all(all.map(async (m) => (await loadSnapshot('u1', 'gantt', m.id))?.data))
  expect(datas).not.toContainEqual({ v: 0 })
  expect(datas[0]).toEqual({ v: 7 })
})

test('startFresh con la herramienta montada: guarda el estado actual, resetea y guarda el blanco', async () => {
  await saveSnapshot('u1', 'gantt', { v: 7 })
  const ad = statefulAdapter({ v: 0 })
  const { result } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.restored).toBe(true))
  ad.box.state = { v: 8 }
  await act(async () => {
    await startFresh('u1', 'gantt')
  })
  expect(ad.reset).toHaveBeenCalledTimes(1)
  expect(ad.box.state).toEqual({ v: 0 })
  const all = await listSnapshots('u1', 'gantt')
  const datas = await Promise.all(all.map(async (m) => (await loadSnapshot('u1', 'gantt', m.id))?.data))
  expect(datas.slice(0, 2)).toEqual([{ v: 0 }, { v: 8 }])
  expect(await consumeFreshStart('u1', 'gantt')).toBe(false)
})

test('startFresh de otro uid no toca la herramienta montada', async () => {
  const ad = statefulAdapter({ v: 0 })
  const { result } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.restored).toBe(true))
  await startFresh('u2', 'gantt')
  expect(ad.reset).not.toHaveBeenCalled()
  expect(await consumeFreshStart('u2', 'gantt')).toBe(true)
})

function bigBlob() {
  const b = new Blob(['x'])
  Object.defineProperty(b, 'size', { value: 20 * 1024 * 1024 + 1 })
  return b
}

test('aviso de archivo grande: una sola vez por estado omitido, otra vez tras un guardado sin omitir', async () => {
  const ad = statefulAdapter<{ v: number; big: Blob | null }>({ v: 0, big: null })
  const { result } = renderHook(() => usePersistentTool('gantt', ad), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.restored).toBe(true))
  const warns = () => useToasts.getState().toasts.filter((t) => t.kind === 'warn').length
  const save = async () => {
    act(() => result.current.markDirty())
    await act(async () => {
      await result.current.flush()
    })
  }
  ad.box.state = { v: 1, big: bigBlob() }
  await save()
  expect(warns()).toBe(1)
  ad.box.state = { v: 2, big: ad.box.state.big }
  await save()
  await save()
  expect(warns()).toBe(1)
  ad.box.state = { v: 3, big: null }
  await save()
  ad.box.state = { v: 4, big: bigBlob() }
  await save()
  expect(warns()).toBe(2)
})

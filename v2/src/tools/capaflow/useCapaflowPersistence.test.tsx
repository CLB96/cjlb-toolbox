import { act, renderHook, waitFor } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import type { ReactNode } from 'react'
import { listSnapshots, loadSnapshot, saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { CapaflowStoreProvider, useCapaApi } from './CapaflowStoreProvider'
import { initialData, type CapaState } from './store'
import { useCapaflowPersistence } from './useCapaflowPersistence'

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
})

const wrap = (uid: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <UidProvider uid={uid}>
        <CapaflowStoreProvider>{children}</CapaflowStoreProvider>
      </UidProvider>
    )
  }

const useBoth = () => ({ tool: useCapaflowPersistence(), api: useCapaApi() })

test('un cálculo se guarda con flush y el estado del usuario A no se filtra al usuario B', async () => {
  const a = renderHook(useBoth, { wrapper: wrap('A') })
  await waitFor(() => expect(a.result.current.tool.restored).toBe(true))
  act(() => {
    a.result.current.api.getState().loadSample()
    a.result.current.api.getState().calculate()
    a.result.current.api.getState().setPhoto(new Blob(['x'], { type: 'image/png' }), 'p.png')
  })
  await act(async () => {
    await a.result.current.tool.flush()
  })
  const [latest] = await listSnapshots('A', 'capaflow')
  const snap = await loadSnapshot<CapaState>('A', 'capaflow', latest!.id)
  expect(snap!.data.points).toHaveLength(1)
  expect(snap!.data.photoName).toBe('p.png')
  expect(snap!.data.photo).not.toBeNull() // fake-indexeddb no conserva la clase Blob de jsdom
  a.unmount()

  const b = renderHook(useBoth, { wrapper: wrap('B') })
  await waitFor(() => expect(b.result.current.tool.restored).toBe(true))
  expect(b.result.current.api.getState().points).toHaveLength(0)
  expect(await listSnapshots('B', 'capaflow')).toHaveLength(0)
})

test('restaura el snapshot guardado en el store de la instancia', async () => {
  await saveSnapshot('A', 'capaflow', { ...initialData(), counter: 4, form: { ...initialData().form, lsl: '9.5' } })
  const a = renderHook(useBoth, { wrapper: wrap('A') })
  await waitFor(() => expect(a.result.current.api.getState().form.lsl).toBe('9.5'))
  expect(a.result.current.api.getState().counter).toBe(4)
})

test('dos Providers montados no comparten estado', () => {
  const one = renderHook(useCapaApi, { wrapper: wrap('A') })
  const two = renderHook(useCapaApi, { wrapper: wrap('A') })
  one.result.current.getState().setField('lsl', '1')
  expect(two.result.current.getState().form.lsl).toBe('')
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import type { ReactNode } from 'react'
import { FIXTURES } from '../../../legacy-fixtures/gapcheck/fixtures'
import { listSnapshots, saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { GapcheckStoreProvider, useGapcheckApi } from './GapcheckStoreProvider'
import { useGapcheckPersistence } from './useGapcheckPersistence'
import { initialData } from './store'

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
})

const wrap = (uid: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <UidProvider uid={uid}>
        <GapcheckStoreProvider>{children}</GapcheckStoreProvider>
      </UidProvider>
    )
  }

const useBoth = () => ({ tool: useGapcheckPersistence(), api: useGapcheckApi() })

test('el estado del usuario A no se filtra al usuario B', async () => {
  const a = renderHook(useBoth, { wrapper: wrap('A') })
  await waitFor(() => expect(a.result.current.tool.restored).toBe(true))
  act(() => {
    a.result.current.api.getState().loadRows('a.xlsx', FIXTURES.header)
  })
  await act(async () => {
    await a.result.current.tool.flush()
  })
  expect(await listSnapshots('A', 'gapcheck')).toHaveLength(1)
  a.unmount()

  const b = renderHook(useBoth, { wrapper: wrap('B') })
  await waitFor(() => expect(b.result.current.tool.restored).toBe(true))
  expect(b.result.current.api.getState().points).toHaveLength(0)
  expect(b.result.current.api.getState().fileName).toBeNull()
  await act(async () => {
    await b.result.current.tool.flush()
  })
  expect(await listSnapshots('B', 'gapcheck')).toHaveLength(0)
})

test('restaura el snapshot guardado en el store de la instancia', async () => {
  await saveSnapshot('A', 'gapcheck', { ...initialData(), fileName: 'saved.xlsx' })
  const a = renderHook(useBoth, { wrapper: wrap('A') })
  await waitFor(() => expect(a.result.current.api.getState().fileName).toBe('saved.xlsx'))
})

test('no guarda antes de restored', async () => {
  const a = renderHook(useBoth, { wrapper: wrap('A') })
  expect(a.result.current.tool.restored).toBe(false)
  act(() => {
    a.result.current.api.getState().setTableOpen(true)
  })
  await act(async () => {
    await a.result.current.tool.flush()
  })
  expect(await listSnapshots('A', 'gapcheck')).toHaveLength(0)
  await waitFor(() => expect(a.result.current.tool.restored).toBe(true))
})

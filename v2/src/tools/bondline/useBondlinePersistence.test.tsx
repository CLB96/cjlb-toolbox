import { act, renderHook, waitFor } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import type { ReactNode } from 'react'
import { FIXTURES } from '../../../legacy-fixtures/bondline/fixtures'
import { listSnapshots, saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { BondlineStoreProvider, useBondlineApi } from './BondlineStoreProvider'
import { initialData } from './store'
import { useBondlinePersistence } from './useBondlinePersistence'

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
})

const wrap = (uid: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <UidProvider uid={uid}>
        <BondlineStoreProvider>{children}</BondlineStoreProvider>
      </UidProvider>
    )
  }

const useBoth = () => ({ tool: useBondlinePersistence(), api: useBondlineApi() })

test('el estado del usuario A no se filtra al usuario B', async () => {
  const a = renderHook(useBoth, { wrapper: wrap('A') })
  await waitFor(() => expect(a.result.current.tool.restored).toBe(true))
  act(() => {
    a.result.current.api.getState().loadWorkbook('a.xlsx', [{ name: 'H', raw: FIXTURES.plain }])
  })
  await act(async () => {
    await a.result.current.tool.flush()
  })
  expect(await listSnapshots('A', 'bondline')).toHaveLength(1)
  a.unmount()

  const b = renderHook(useBoth, { wrapper: wrap('B') })
  await waitFor(() => expect(b.result.current.tool.restored).toBe(true))
  expect(b.result.current.api.getState().sheets).toHaveLength(0)
  expect(b.result.current.api.getState().fileName).toBeNull()
  await act(async () => {
    await b.result.current.tool.flush()
  })
  expect(await listSnapshots('B', 'bondline')).toHaveLength(0)
})

test('restaura el snapshot guardado en el store de la instancia', async () => {
  await saveSnapshot('A', 'bondline', { ...initialData(), fileName: 'saved.xlsx' })
  const a = renderHook(useBoth, { wrapper: wrap('A') })
  await waitFor(() => expect(a.result.current.api.getState().fileName).toBe('saved.xlsx'))
})

test('dos Providers montados no comparten estado', () => {
  const one = renderHook(useBondlineApi, { wrapper: wrap('A') })
  const two = renderHook(useBondlineApi, { wrapper: wrap('A') })
  one.result.current.getState().setTestDate('2026-01-01')
  expect(two.result.current.getState().config.testDate).toBe('')
})

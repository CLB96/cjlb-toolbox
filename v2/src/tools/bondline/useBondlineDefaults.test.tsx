import { act, renderHook, waitFor } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import type { ReactNode } from 'react'
import { UidProvider } from '../../persistence/uidContext'
import { loadPreference, savePreference } from '../../persistence/preferences'
import { useToasts } from '../../ui/toastStore'
import { BONDLINE_DEFAULTS_KEY, useBondlineDefaults } from './useBondlineDefaults'
import { FACTORY_DEFAULTS } from './logic/types'

beforeEach(async () => {
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  useToasts.setState({ toasts: [] })
})

const wrap = (uid: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <UidProvider uid={uid}>{children}</UidProvider>
  }

const form = { wbMin: '', wbMax: '80', hmMin: '', hmMax: '', cooling: '' }

test('sin preferencia: fábrica y loaded true', async () => {
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  expect(result.current.loaded).toBe(false)
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(result.current.defaults).toEqual(FACTORY_DEFAULTS)
})

test('save aplica R1, guarda bajo el uid y otro uid no lo ve', async () => {
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  await act(() => result.current.save(form))
  const expected = { waterbase: { min: 55, max: 80 }, hotmelt: { min: 60, max: 80 }, coolingTarget: 35 }
  expect(result.current.defaults).toEqual(expected)
  expect(await loadPreference('u1', BONDLINE_DEFAULTS_KEY)).toEqual(expected)
  expect(await loadPreference('u2', BONDLINE_DEFAULTS_KEY)).toBeUndefined()
  const other = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u2') })
  await waitFor(() => expect(other.result.current.loaded).toBe(true))
  expect(other.result.current.defaults).toEqual(FACTORY_DEFAULTS)
})

test('carga la preferencia guardada al montar', async () => {
  const saved = { waterbase: { min: 1, max: 2 }, hotmelt: { min: 3, max: 4 }, coolingTarget: 5 }
  await savePreference('u1', BONDLINE_DEFAULTS_KEY, saved)
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(result.current.defaults).toEqual(saved)
})

test('preferencia corrupta o parcial -> fábrica', async () => {
  await savePreference('u1', BONDLINE_DEFAULTS_KEY, { waterbase: 3 })
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(result.current.defaults).toEqual(FACTORY_DEFAULTS)
})

test('resetToFactory guarda y aplica fábrica', async () => {
  await savePreference('u1', BONDLINE_DEFAULTS_KEY, {
    waterbase: { min: 1, max: 2 },
    hotmelt: { min: 3, max: 4 },
    coolingTarget: 5,
  })
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.defaults.coolingTarget).toBe(5))
  await act(() => result.current.resetToFactory())
  expect(result.current.defaults).toEqual(FACTORY_DEFAULTS)
  expect(await loadPreference('u1', BONDLINE_DEFAULTS_KEY)).toEqual(FACTORY_DEFAULTS)
})

test('fallo al guardar muestra toast y no cambia los valores', async () => {
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  const prefs = await import('../../persistence/preferences')
  const spy = vi.spyOn(prefs, 'savePreference').mockRejectedValueOnce(new Error('boom'))
  await act(() => result.current.save(form))
  expect(useToasts.getState().toasts.some((x) => x.kind === 'error')).toBe(true)
  expect(result.current.defaults).toEqual(FACTORY_DEFAULTS)
  spy.mockRestore()
})

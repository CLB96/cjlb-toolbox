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

test('sin preferencia: fÃ¡brica y loaded true', async () => {
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

test('preferencia corrupta o parcial -> fÃ¡brica', async () => {
  await savePreference('u1', BONDLINE_DEFAULTS_KEY, { waterbase: 3 })
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(result.current.defaults).toEqual(FACTORY_DEFAULTS)
})

test('resetToFactory guarda y aplica fÃ¡brica', async () => {
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

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const OTHER = { waterbase: { min: 1, max: 2 }, hotmelt: { min: 3, max: 4 }, coolingTarget: 5 }

test('un guardado durante la carga inicial gana sobre el valor cargado', async () => {
  const prefs = await import('../../persistence/preferences')
  const load = deferred<unknown>()
  const spy = vi.spyOn(prefs, 'loadPreference').mockReturnValueOnce(load.promise as Promise<undefined>)
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await act(async () => {
    await result.current.save(form)
  })
  await act(async () => {
    load.resolve(OTHER)
    await load.promise
  })
  expect(result.current.defaults.waterbase).toEqual({ min: 55, max: 80 })
  expect(result.current.loaded).toBe(true)
  spy.mockRestore()
})

test('un guardado fallido durante la carga inicial no descarta la carga', async () => {
  const prefs = await import('../../persistence/preferences')
  const load = deferred<unknown>()
  const loadSpy = vi.spyOn(prefs, 'loadPreference').mockReturnValueOnce(load.promise as Promise<undefined>)
  const saveSpy = vi.spyOn(prefs, 'savePreference').mockRejectedValueOnce(new Error('boom'))
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await act(async () => {
    expect(await result.current.save(form)).toBe(false)
  })
  await act(async () => {
    load.resolve(OTHER)
    await load.promise
  })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(result.current.defaults).toEqual(OTHER)
  loadSpy.mockRestore()
  saveSpy.mockRestore()
})

test('cambiar de uid mientras se guarda: al resolver, el estado refleja al nuevo usuario', async () => {
  const prefs = await import('../../persistence/preferences')
  const write = deferred<void>()
  const spy = vi.spyOn(prefs, 'savePreference').mockReturnValueOnce(write.promise)
  let uid = 'u1'
  const Wrapper = ({ children }: { children: ReactNode }) => <UidProvider uid={uid}>{children}</UidProvider>
  const { result, rerender } = renderHook(() => useBondlineDefaults(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  let pending!: Promise<boolean>
  act(() => {
    pending = result.current.save(form)
  })
  uid = 'u2'
  rerender()
  await waitFor(() => expect(result.current.loaded).toBe(true))
  await act(async () => {
    write.resolve()
    await pending
  })
  expect(result.current.loaded).toBe(true)
  expect(result.current.defaults).toEqual(FACTORY_DEFAULTS)
  spy.mockRestore()
})

test('save y resetToFactory resuelven true en éxito y false en fallo', async () => {
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  let ok: boolean | undefined
  await act(async () => {
    ok = await result.current.save(form)
  })
  expect(ok).toBe(true)
  const prefs = await import('../../persistence/preferences')
  const spy = vi.spyOn(prefs, 'savePreference').mockRejectedValue(new Error('boom'))
  await act(async () => {
    ok = await result.current.save(form)
  })
  expect(ok).toBe(false)
  await act(async () => {
    ok = await result.current.resetToFactory()
  })
  expect(ok).toBe(false)
  spy.mockRestore()
})

test('fallo al cargar muestra toast y usa fábrica', async () => {
  const prefs = await import('../../persistence/preferences')
  const spy = vi.spyOn(prefs, 'loadPreference').mockRejectedValueOnce(new Error('boom'))
  const { result } = renderHook(() => useBondlineDefaults(), { wrapper: wrap('u1') })
  await waitFor(() => expect(result.current.loaded).toBe(true))
  expect(result.current.defaults).toEqual(FACTORY_DEFAULTS)
  expect(useToasts.getState().toasts.some((x) => x.kind === 'error')).toBe(true)
  spy.mockRestore()
})

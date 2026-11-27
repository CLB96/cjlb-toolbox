import { act, renderHook } from '@testing-library/react'
import { SUCCESS_MS, useActionStatus } from './useActionStatus'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('pasa de cargando a listo y vuelve al reposo', async () => {
  const { result } = renderHook(() => useActionStatus())
  let resolve!: () => void
  let done: Promise<unknown>
  act(() => {
    done = result.current.run('a', () => new Promise<void>((r) => (resolve = r)))
  })
  expect(result.current.statusOf('a')).toBe('loading')
  expect(result.current.statusOf('b')).toBe('idle')
  await act(async () => {
    resolve()
    await done
  })
  expect(result.current.statusOf('a')).toBe('success')
  act(() => {
    vi.advanceTimersByTime(SUCCESS_MS)
  })
  expect(result.current.statusOf('a')).toBe('idle')
})

test('si falla vuelve al reposo y propaga el error', async () => {
  const { result } = renderHook(() => useActionStatus())
  await act(async () => {
    await expect(result.current.run('a', () => Promise.reject(new Error('x')))).rejects.toThrow('x')
  })
  expect(result.current.statusOf('a')).toBe('idle')
})

test('no lanza dos a la vez', async () => {
  const { result } = renderHook(() => useActionStatus())
  const fn = vi.fn(() => new Promise<void>(() => {}))
  act(() => {
    void result.current.run('a', fn)
  })
  let second: unknown = 'x'
  await act(async () => {
    second = await result.current.run('b', fn)
  })
  expect(second).toBeUndefined()
  expect(fn).toHaveBeenCalledTimes(1)
})

test('reset vuelve al reposo de inmediato', async () => {
  const { result } = renderHook(() => useActionStatus())
  await act(async () => {
    await result.current.run('a', async () => true)
  })
  expect(result.current.statusOf('a')).toBe('success')
  act(() => result.current.reset())
  expect(result.current.statusOf('a')).toBe('idle')
})

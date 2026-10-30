import { createAutosave } from './autosave'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})

function setup(save = vi.fn().mockResolvedValue(undefined)) {
  const onError = vi.fn()
  const a = createAutosave({ intervalMs: 60_000, save, onError })
  return { a, save, onError }
}

test('guarda al cumplirse el intervalo solo si está dirty', async () => {
  const { a, save } = setup()
  a.markDirty()
  await vi.advanceTimersByTimeAsync(59_999)
  expect(save).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(save).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(60_000)
  expect(save).toHaveBeenCalledTimes(1)
  a.dispose()
})

test('pagehide con cambios pendientes guarda de inmediato', async () => {
  const { a, save } = setup()
  a.markDirty()
  window.dispatchEvent(new Event('pagehide'))
  await vi.advanceTimersByTimeAsync(0)
  expect(save).toHaveBeenCalledTimes(1)
  a.dispose()
})

test('un fallo (QuotaExceededError) llama onError y el intervalo sigue vivo', async () => {
  const quota = new DOMException('full', 'QuotaExceededError')
  const save = vi.fn().mockRejectedValueOnce(quota).mockResolvedValue(undefined)
  const { a, onError } = setup(save)
  a.markDirty()
  await vi.advanceTimersByTimeAsync(60_000)
  expect(onError).toHaveBeenCalledWith(quota)
  await vi.advanceTimersByTimeAsync(60_000)
  expect(save).toHaveBeenCalledTimes(2)
  expect(onError).toHaveBeenCalledTimes(1)
  a.dispose()
})

test('flush sin cambios no guarda y dispose detiene todo', async () => {
  const { a, save } = setup()
  await a.flush()
  expect(save).not.toHaveBeenCalled()
  a.markDirty()
  a.dispose()
  await vi.advanceTimersByTimeAsync(120_000)
  window.dispatchEvent(new Event('pagehide'))
  expect(save).not.toHaveBeenCalled()
})

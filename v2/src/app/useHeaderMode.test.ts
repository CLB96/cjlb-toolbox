import { act, renderHook } from '@testing-library/react'
import { COLLAPSE_MS, FULL_MS, useHeaderMode } from './useHeaderMode'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('en Inicio es solo el círculo', () => {
  const { result } = renderHook(() => useHeaderMode(false))
  expect(result.current).toBe('col')
})

test('en una herramienta se ve completo, se aprieta y queda en círculo', () => {
  const { result } = renderHook(() => useHeaderMode(true))
  expect(result.current).toBe('full')
  act(() => {
    vi.advanceTimersByTime(FULL_MS)
  })
  expect(result.current).toBe('collapsing')
  const onResize = vi.fn()
  window.addEventListener('resize', onResize)
  act(() => {
    vi.advanceTimersByTime(COLLAPSE_MS)
  })
  expect(result.current).toBe('col')
  expect(onResize).toHaveBeenCalled()
  window.removeEventListener('resize', onResize)
})

test('de Inicio a una herramienta vuelve a mostrarse completo', () => {
  const { result, rerender } = renderHook(({ tool }) => useHeaderMode(tool), { initialProps: { tool: false } })
  rerender({ tool: true })
  expect(result.current).toBe('full')
})

test('cambiar de herramienta con el círculo no lo reabre', () => {
  const { result, rerender } = renderHook(({ tool }) => useHeaderMode(tool), { initialProps: { tool: true } })
  act(() => {
    vi.advanceTimersByTime(FULL_MS)
  })
  act(() => {
    vi.advanceTimersByTime(COLLAPSE_MS)
  })
  rerender({ tool: true })
  expect(result.current).toBe('col')
})

test('volver a Inicio antes de que termine cancela el colapso', () => {
  const { result, rerender } = renderHook(({ tool }) => useHeaderMode(tool), { initialProps: { tool: true } })
  rerender({ tool: false })
  act(() => {
    vi.advanceTimersByTime(FULL_MS + COLLAPSE_MS)
  })
  expect(result.current).toBe('col')
})

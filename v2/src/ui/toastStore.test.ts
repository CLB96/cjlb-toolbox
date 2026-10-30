import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast, useToasts, TOAST_TTL_MS } from './toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToasts.setState({ toasts: [] })
  })
  afterEach(() => vi.useRealTimers())

  it('auto-dismisses after 5000 ms', () => {
    toast('info', 'hola')
    expect(TOAST_TTL_MS).toBe(5000)
    vi.advanceTimersByTime(4999)
    expect(useToasts.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(useToasts.getState().toasts).toHaveLength(0)
  })
})

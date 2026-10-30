import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme, __resetThemeForTests } from './useTheme'

function mockMatchMedia(dark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('dark') ? dark : !dark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    __resetThemeForTests()
  })
  afterEach(() => vi.restoreAllMocks())

  it('resolves to dark when nothing is stored and the system prefers dark', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('system')
    expect(result.current.resolved).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('setMode persists and applies the theme', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setMode('light'))
    expect(result.current.resolved).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('cjlb.theme')).toBe('light')
  })

  it('keeps working when localStorage throws', () => {
    mockMatchMedia(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useTheme())
    expect(result.current.resolved).toBe('light')
    act(() => result.current.setMode('dark'))
    expect(result.current.resolved).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

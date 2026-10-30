import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useI18n, __resetI18nForTests } from './useI18n'

describe('useI18n', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ''
    __resetI18nForTests()
  })

  it('defaults to es and interpolates variables', () => {
    const { result } = renderHook(() => useI18n())
    expect(result.current.lang).toBe('es')
    expect(result.current.t('home.greeting', { name: 'Ana' })).toBe('Hola, Ana')
    expect(document.documentElement.lang).toBe('es')
  })

  it('switches to en, persists and updates html lang', () => {
    const { result } = renderHook(() => useI18n())
    act(() => result.current.setLang('en'))
    expect(result.current.lang).toBe('en')
    expect(result.current.t('home.greeting', { name: 'Ana' })).toBe('Hello, Ana')
    expect(localStorage.getItem('cjlb.lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

})

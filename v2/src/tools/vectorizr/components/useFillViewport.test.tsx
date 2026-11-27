import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFillViewport } from './useFillViewport'

function Probe({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useFillViewport(ref, enabled)
  return <div ref={ref} data-testid="box" />
}

const setViewport = (h: number) => Object.defineProperty(window, 'innerHeight', { configurable: true, value: h })
const fillOf = (el: HTMLElement) => el.style.getPropertyValue('--vz-fill')

afterEach(() => vi.restoreAllMocks())

describe('useFillViewport', () => {
  it('ocupa el alto que queda de la ventana desde la parte superior del elemento, menos el margen inferior', () => {
    setViewport(1000)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 300 } as DOMRect)
    const { getByTestId } = render(<Probe enabled />)
    expect(fillOf(getByTestId('box'))).toBe('684px')
  })

  it('se recalcula al cambiar el tamaño de la ventana (otro monitor, zoom del navegador)', () => {
    setViewport(1000)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 300 } as DOMRect)
    const { getByTestId } = render(<Probe enabled />)
    setViewport(1400)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(fillOf(getByTestId('box'))).toBe('1084px')
  })

  it('en pantallas muy bajas no baja del mínimo', () => {
    setViewport(500)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 400 } as DOMRect)
    const { getByTestId } = render(<Probe enabled />)
    expect(fillOf(getByTestId('box'))).toBe('360px')
  })

  it('apagado quita la variable', () => {
    setViewport(1000)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 300 } as DOMRect)
    const { getByTestId, rerender } = render(<Probe enabled />)
    rerender(<Probe enabled={false} />)
    expect(fillOf(getByTestId('box'))).toBe('')
  })
})

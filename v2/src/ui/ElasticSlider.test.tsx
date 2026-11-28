import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ElasticSlider } from './ElasticSlider'

function mockMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduced && q.includes('reduce'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ElasticSlider', () => {
  it('es un input range de verdad: nombre, valor, límites y cambios', () => {
    const onChange = vi.fn()
    render(
      <label>
        Brillo
        <ElasticSlider min={-50} max={100} value={30} onChange={(e) => onChange(Number(e.target.value))} />
      </label>,
    )
    const s = screen.getByRole('slider', { name: /Brillo/ })
    expect(s).toHaveValue('30')
    expect(s).toHaveAttribute('min', '-50')
    expect(s).toHaveAttribute('max', '100')
    fireEvent.change(s, { target: { value: '55' } })
    expect(onChange).toHaveBeenCalledWith(55)
  })

  it('marca que se está arrastrando al pulsar y lo quita al soltar o al perder el foco', () => {
    const onPointerUp = vi.fn()
    const { container } = render(<ElasticSlider min={0} max={10} value={5} onChange={() => {}} onPointerUp={onPointerUp} />)
    const root = container.querySelector('.vz-sl')!
    const input = screen.getByRole('slider')
    expect(root).toHaveAttribute('data-on', 'false')
    fireEvent.pointerDown(input)
    expect(root).toHaveAttribute('data-on', 'true')
    fireEvent.pointerUp(input)
    expect(root).toHaveAttribute('data-on', 'false')
    expect(onPointerUp).toHaveBeenCalledTimes(1)
    fireEvent.pointerDown(input)
    fireEvent.blur(input)
    expect(root).toHaveAttribute('data-on', 'false')
  })

  it('con «reducir movimiento» el relleno salta al valor sin resorte', () => {
    mockMotion(true)
    const { container, rerender } = render(<ElasticSlider min={0} max={100} value={0} onChange={() => {}} />)
    const root = container.querySelector('.vz-sl') as HTMLElement
    expect(root.style.getPropertyValue('--p')).toBe('0')
    rerender(<ElasticSlider min={0} max={100} value={50} onChange={() => {}} />)
    expect(root.style.getPropertyValue('--p')).toBe('0.5')
  })

  it('con movimiento el relleno llega al valor siguiendo un resorte', async () => {
    mockMotion(false)
    vi.useFakeTimers()
    let clock = 0
    vi.spyOn(performance, 'now').mockImplementation(() => clock)
    vi.stubGlobal('requestAnimationFrame', (cb: (n: number) => void) => setTimeout(() => cb((clock += 16)), 16) as unknown as number)
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
    const { container, rerender } = render(<ElasticSlider min={0} max={100} value={0} onChange={() => {}} />)
    const root = container.querySelector('.vz-sl') as HTMLElement
    rerender(<ElasticSlider min={0} max={100} value={100} onChange={() => {}} />)
    vi.advanceTimersByTime(48)
    const mid = Number(root.style.getPropertyValue('--p'))
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
    vi.advanceTimersByTime(4000)
    expect(Number(root.style.getPropertyValue('--p'))).toBe(1)
    vi.useRealTimers()
  })
})

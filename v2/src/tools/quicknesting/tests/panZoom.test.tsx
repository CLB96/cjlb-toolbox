import { fireEvent, render, screen } from '@testing-library/react'
import { __resetI18nForTests } from '../../../i18n/useI18n'
import { Drawing } from '../components/Drawing'
import { panView, zoomView } from '../components/usePanZoom'

const base = { x: 0, y: 0, w: 100, h: 200 }
const square = { id: 'c1', points: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]] }
const viewBox = () => document.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)

describe('zoom y paneo del dibujo', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetI18nForTests()
  })

  it('acerca hacia un punto fijo y respeta los límites', () => {
    const v = zoomView(base, base, 0.5, 50, 100)
    expect(v).toEqual({ x: 25, y: 50, w: 50, h: 100 })
    expect(zoomView(base, base, 0.0001, 0, 0).w).toBeCloseTo(100 / 40, 9)
    expect(zoomView(base, base, 10, 0, 0).w).toBe(200)
  })

  it('mueve la vista en sentido contrario al arrastre', () => {
    expect(panView(base, 10, -5)).toEqual({ x: -10, y: 5, w: 100, h: 200 })
  })

  it('los botones acercan, alejan y vuelven a ver todo', () => {
    render(<Drawing pieces={[square]} width={100} length={200} title="dibujo" />)
    const start = viewBox()
    fireEvent.click(screen.getByRole('button', { name: 'Acercar' }))
    expect(viewBox()[2]).toBeLessThan(start[2])
    fireEvent.click(screen.getByRole('button', { name: 'Ver todo' }))
    expect(viewBox()).toEqual(start)
    fireEvent.click(screen.getByRole('button', { name: 'Alejar' }))
    expect(viewBox()[2]).toBeGreaterThan(start[2])
  })

  it('teclado y doble clic', () => {
    render(<Drawing pieces={[square]} width={100} length={200} title="dibujo" />)
    const svg = screen.getByRole('img', { name: 'dibujo' })
    const start = viewBox()
    fireEvent.keyDown(svg, { key: '+' })
    fireEvent.keyDown(svg, { key: 'ArrowLeft' })
    expect(viewBox()[0]).toBeLessThan(start[0] + (start[2] - viewBox()[2]) / 2)
    fireEvent.doubleClick(svg)
    expect(viewBox()).toEqual(start)
  })

  it('no dibuja geometría inválida', () => {
    const { container } = render(<Drawing pieces={[square]} width={0} length={200} title="dibujo" />)
    expect(container.querySelector('svg')).toBeNull()
  })
})

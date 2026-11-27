import { describe, expect, it } from 'vitest'
import { panView, zoomView, ZOOM_MAX } from './useCanvasZoom'

const home = { scale: 1, x: 0, y: 0 }

describe('zoom del modo manual', () => {
  it('acerca hacia el cursor: el punto bajo el cursor no se mueve', () => {
    const v = zoomView(home, 2, 300, 200, 800, 600)
    expect(v.scale).toBe(2)
    expect((300 - v.x) / v.scale).toBeCloseTo(300)
    expect((200 - v.y) / v.scale).toBeCloseTo(200)
  })

  it('no pasa del máximo ni baja de 100 %', () => {
    expect(zoomView(home, 1000, 0, 0, 800, 600).scale).toBe(ZOOM_MAX)
    expect(zoomView({ scale: 2, x: -100, y: -80 }, 0.1, 400, 300, 800, 600)).toEqual(home)
  })

  it('el desplazamiento no deja ver fuera de la imagen', () => {
    const v = panView({ scale: 2, x: -100, y: -100 }, 5000, 5000, 800, 600)
    expect(v.x).toBe(0)
    expect(v.y).toBe(0)
    const w = panView({ scale: 2, x: -100, y: -100 }, -5000, -5000, 800, 600)
    expect(w.x).toBe(-800)
    expect(w.y).toBe(-600)
  })

  it('sin zoom no hay desplazamiento', () => {
    expect(panView(home, 40, 40, 800, 600)).toEqual(home)
  })
})

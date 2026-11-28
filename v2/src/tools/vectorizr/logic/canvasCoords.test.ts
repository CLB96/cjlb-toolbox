import { describe, expect, it } from 'vitest'
import { imageToView, viewDims, viewToImage } from './canvasCoords'

describe('foto girada en el paso Vectorizar', () => {
  const W = 200
  const H = 100

  it('con 90° o 270° el lienzo intercambia ancho y alto', () => {
    expect(viewDims(W, H, 0)).toEqual({ w: 200, h: 100 })
    expect(viewDims(W, H, 90)).toEqual({ w: 100, h: 200 })
    expect(viewDims(W, H, 180)).toEqual({ w: 200, h: 100 })
    expect(viewDims(W, H, 270)).toEqual({ w: 100, h: 200 })
  })

  it('girar a la derecha lleva la esquina de arriba a la izquierda a arriba a la derecha', () => {
    expect(imageToView(0, 0, W, H, 90)).toEqual({ x: 100, y: 0 })
    expect(imageToView(W, 0, W, H, 90)).toEqual({ x: 100, y: 200 })
    expect(imageToView(0, 0, W, H, 180)).toEqual({ x: 200, y: 100 })
    expect(imageToView(0, 0, W, H, 270)).toEqual({ x: 0, y: 200 })
  })

  it('sin giro no cambia nada', () => {
    expect(imageToView(30, 40, W, H, 0)).toEqual({ x: 30, y: 40 })
    expect(viewToImage(30, 40, W, H, 0)).toEqual({ x: 30, y: 40 })
  })

  it.each([0, 90, 180, 270])('ida y vuelta con %i° devuelve el mismo punto', (r) => {
    const v = imageToView(37, 81, W, H, r)
    const back = viewToImage(v.x, v.y, W, H, r)
    expect(back.x).toBeCloseTo(37, 9)
    expect(back.y).toBeCloseTo(81, 9)
  })
})

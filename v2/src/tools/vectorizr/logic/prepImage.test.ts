import { describe, expect, it } from 'vitest'
import { adjustFilter, adjustPixels, dragCrop, hitHandle, isPrepped, MIN_CROP, normalizeCrop, offsetPoints, snapToCrop } from './prepImage'

const W = 1000
const H = 800

describe('preparar la foto antes de detectar', () => {
  describe('normalizeCrop', () => {
    it('un recorte que cubre toda la imagen no recorta nada', () => {
      expect(normalizeCrop({ x: 0, y: 0, w: W, h: H }, W, H)).toBeNull()
    })

    it('redondea y deja el recorte dentro de la imagen', () => {
      expect(normalizeCrop({ x: -10.4, y: 5.6, w: 2000, h: 100.2 }, W, H)).toEqual({ x: 0, y: 6, w: 1000, h: 100 })
    })

    it('aplica un tamaño mínimo', () => {
      const c = normalizeCrop({ x: 10, y: 10, w: 2, h: 2 }, W, H)!
      expect(c.w).toBe(MIN_CROP)
      expect(c.h).toBe(MIN_CROP)
    })
  })

  describe('hitHandle', () => {
    const crop = { x: 100, y: 100, w: 400, h: 300 }
    it('detecta esquinas y bordes', () => {
      expect(hitHandle(crop, 100, 100, 10)).toBe('nw')
      expect(hitHandle(crop, 500, 400, 10)).toBe('se')
      expect(hitHandle(crop, 300, 100, 10)).toBe('n')
      expect(hitHandle(crop, 500, 250, 10)).toBe('e')
    })
    it('dentro del marco mueve y fuera no hace nada', () => {
      expect(hitHandle(crop, 300, 250, 10)).toBe('move')
      expect(hitHandle(crop, 800, 700, 10)).toBeNull()
    })
  })

  describe('dragCrop', () => {
    const start = { x: 100, y: 100, w: 400, h: 300 }
    it('la esquina nw mueve dos lados y deja los otros fijos', () => {
      expect(dragCrop(start, 'nw', 50, 20, W, H)).toEqual({ x: 150, y: 120, w: 350, h: 280 })
    })
    it('el borde e solo cambia el ancho', () => {
      expect(dragCrop(start, 'e', 100, 999, W, H)).toEqual({ x: 100, y: 100, w: 500, h: 300 })
    })
    it('no deja cruzar los lados: respeta el tamaño mínimo', () => {
      const c = dragCrop(start, 'e', -1000, 0, W, H)
      expect(c.w).toBe(MIN_CROP)
      expect(c.x).toBe(100)
    })
    it('no sale de la imagen', () => {
      expect(dragCrop(start, 'se', 5000, 5000, W, H)).toEqual({ x: 100, y: 100, w: 900, h: 700 })
    })
    it('mover conserva el tamaño y se queda dentro', () => {
      expect(dragCrop(start, 'move', 5000, -5000, W, H)).toEqual({ x: 600, y: 0, w: 400, h: 300 })
    })
  })

  describe('offsetPoints', () => {
    it('suma el origen del recorte sin modificar el original', () => {
      const pts = [{ x: 1, y: 2 }]
      expect(offsetPoints(pts, 10, 20)).toEqual([{ x: 11, y: 22 }])
      expect(pts).toEqual([{ x: 1, y: 2 }])
    })
    it('con desplazamiento cero devuelve los mismos puntos', () => {
      const pts = [{ x: 1, y: 2 }]
      expect(offsetPoints(pts, 0, 0)).toBe(pts)
    })
  })

  describe('snapToCrop', () => {
    const crop = { x: 100, y: 50, w: 300, h: 400 } // derecha 400, abajo 450
    const tol = 8

    it('pega al borde del recorte los puntos que quedaron cerca y quita los intermedios del tramo recto', () => {
      const pts = [
        { x: 150, y: 60 },
        { x: 300, y: 55 },
        { x: 395, y: 120 },
        { x: 397, y: 200 },
        { x: 402, y: 300 },
        { x: 398, y: 440 },
        { x: 250, y: 445 },
        { x: 120, y: 300 },
      ]
      const out = snapToCrop(pts, crop, tol)
      // 395,397,402,398 caen en x=400: los de en medio se quitan y solo quedan los extremos del tramo
      expect(out.filter((p) => p.x === 400).map((p) => p.y)).toEqual([120, 440])
      expect(out.some((p) => p.x === 250 && p.y === 450)).toBe(true)
    })

    it('un punto lejos del borde no se mueve', () => {
      const pts = [{ x: 200, y: 200 }, { x: 250, y: 260 }, { x: 180, y: 300 }]
      expect(snapToCrop(pts, crop, tol)).toEqual(pts)
    })

    it('las esquinas se pegan a las dos líneas y el contorno conserva su forma', () => {
      const pts = [{ x: 103, y: 53 }, { x: 399, y: 52 }, { x: 398, y: 449 }, { x: 101, y: 447 }]
      expect(snapToCrop(pts, crop, tol)).toEqual([{ x: 100, y: 50 }, { x: 400, y: 50 }, { x: 400, y: 450 }, { x: 100, y: 450 }])
    })

    it('con pocos puntos no deja un contorno de menos de 3', () => {
      const pts = [{ x: 101, y: 100 }, { x: 102, y: 200 }, { x: 101, y: 300 }]
      expect(snapToCrop(pts, crop, tol).length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('brillo y contraste', () => {
    const px = (v: number) => new Uint8ClampedArray([v, v, v, 255, v, v, v, 255])

    it('en 0 no cambia nada ni genera filtro', () => {
      const d = px(120)
      adjustPixels(d, 0, 0)
      expect(Array.from(d)).toEqual(Array.from(px(120)))
      expect(adjustFilter(0, 0)).toBeUndefined()
    })

    it('más brillo aclara y menos oscurece, sin tocar el alfa', () => {
      const up = px(100)
      adjustPixels(up, 50, 0)
      const down = px(100)
      adjustPixels(down, -30, 0)
      expect(up[0]!).toBeGreaterThan(100)
      expect(down[0]!).toBeLessThan(100)
      expect(up[3]).toBe(255)
    })

    it('más contraste separa claros y oscuros alrededor del gris medio', () => {
      const dark = px(60)
      const light = px(200)
      adjustPixels(dark, 0, 50)
      adjustPixels(light, 0, 50)
      expect(dark[0]!).toBeLessThan(60)
      expect(light[0]!).toBeGreaterThan(200)
    })

    it('el filtro CSS usa los mismos factores', () => {
      expect(adjustFilter(50, -20)).toBe('brightness(1.5) contrast(0.8)')
    })
  })

  describe('isPrepped', () => {
    it('es falso sin recorte ni borrados y verdadero con alguno', () => {
      const none = { crop: null, strokes: [], brightness: 0, contrast: 0 }
      expect(isPrepped(none)).toBe(false)
      expect(isPrepped({ ...none, crop: { x: 1, y: 1, w: 50, h: 50 } })).toBe(true)
      expect(isPrepped({ ...none, strokes: [{ points: [{ x: 1, y: 1 }], size: 5 }] })).toBe(true)
      expect(isPrepped({ ...none, brightness: 10 })).toBe(true)
      expect(isPrepped({ ...none, contrast: -20 })).toBe(true)
    })
  })
})

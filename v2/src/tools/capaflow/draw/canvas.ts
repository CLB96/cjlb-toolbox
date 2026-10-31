import type { Lang } from '../logic'

export interface DrawEnv {
  isDark: boolean
  lang: Lang
  /** Traductor de los textos de tooltip (claves tooltip.*). */
  tr: (key: 'tooltip.binRange' | 'tooltip.freq' | 'tooltip.aboveMedian' | 'tooltip.belowMedian' | 'tooltip.observation' | 'tooltip.value' | 'tooltip.median' | 'cc.ooc' | 'cc.inControl') => string
}

/** Devuelve el texto del tooltip para una posición del canvas, o null si no hay nada bajo el puntero. */
export type HitTest = (mx: number, my: number) => string | null

export interface Pad {
  t: number
  r: number
  b: number
  l: number
}

/** Como el original: ancho = offsetWidth (o un valor por defecto), alto fijo, lienzo limpio. */
export function prepareCanvas(canvas: HTMLCanvasElement, height: number, fallbackWidth: number): CanvasRenderingContext2D | null {
  canvas.width = canvas.offsetWidth || fallbackWidth
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  return ctx
}

export const dist = (ax: number, ay: number, bx: number, by: number): number => Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)

/** Punto más cercano a menos de 20 px (misma regla de todos los tooltips del original). */
export function nearest<T>(items: T[], px: (item: T) => number, py: (item: T) => number, mx: number, my: number): { item: T; index: number } | null {
  let best: { item: T; index: number } | null = null
  let min = Infinity
  items.forEach((item, index) => {
    const d = dist(mx, my, px(item), py(item))
    if (d < min && d < 20) {
      min = d
      best = { item, index }
    }
  })
  return best
}

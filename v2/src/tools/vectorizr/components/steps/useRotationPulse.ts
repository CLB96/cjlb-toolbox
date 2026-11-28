import { useEffect, useRef, type RefObject } from 'react'

/** Al girar la foto, un pequeño destello del lienzo acompaña el cambio (no corre con «reducir movimiento»). */
export function useRotationPulse(canvas: RefObject<HTMLCanvasElement | null>, rotation: number): void {
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced) canvas.current?.animate?.([{ opacity: 0.2 }, { opacity: 1 }], { duration: 380, easing: 'cubic-bezier(0.3, 1.2, 0.5, 1)' })
  }, [canvas, rotation])
}

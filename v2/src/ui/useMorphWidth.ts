import { useEffect, useRef, type RefObject } from 'react'

/** Tiempo máximo antes de soltar el ancho fijado, por si no llega `transitionend` (movimiento reducido). */
const SETTLE_MS = 900

/**
 * Lleva un botón de su ancho natural a un círculo (ancho = alto) cuando `busy` es true y de vuelta cuando es false.
 * Se fija el ancho en px para poder animarlo; al volver se suelta para que el botón recupere su ancho automático.
 * `busy` undefined = el botón no usa estado y el hook no hace nada.
 */
export function useMorphWidth(ref: RefObject<HTMLElement | null>, busy: boolean | undefined): void {
  const natural = useRef(0)
  const wasBusy = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || busy === undefined || busy === wasBusy.current) return
    wasBusy.current = busy
    if (busy) {
      natural.current = el.offsetWidth
      el.style.width = `${natural.current}px`
      void el.offsetWidth // se aplica el ancho de partida antes de animar
      el.style.paddingInline = '0'
      el.style.width = `${el.offsetHeight}px`
      return
    }
    el.style.paddingInline = ''
    el.style.width = `${natural.current}px`
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      el.style.width = ''
      el.removeEventListener('transitionend', onEnd)
    }
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'width') settle()
    }
    el.addEventListener('transitionend', onEnd)
    const timer = setTimeout(settle, SETTLE_MS)
    return () => {
      clearTimeout(timer)
      settle()
    }
  }, [ref, busy])
}

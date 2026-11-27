import { useLayoutEffect, type RefObject } from 'react'

/** Margen que se deja debajo, en px. */
const BOTTOM_GAP = 16
/** En ventanas muy bajas la herramienta no se encoge más que esto (la página hace scroll). */
const MIN_HEIGHT = 360

/**
 * Pone en `--vz-fill` el alto que queda de la ventana desde la parte superior del elemento, para que la herramienta
 * llene la pantalla sin importar el monitor ni el zoom del navegador. Se recalcula al cambiar el tamaño de la
 * ventana o de la página (por ejemplo si la cabecera se parte en dos líneas).
 */
export function useFillViewport(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (!enabled) {
      el.style.removeProperty('--vz-fill')
      return
    }
    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      const height = Math.max(MIN_HEIGHT, Math.round(window.innerHeight - top - BOTTOM_GAP))
      el.style.setProperty('--vz-fill', `${height}px`)
    }
    measure()
    window.addEventListener('resize', measure)
    // la cabecera de arriba puede cambiar de alto sin que cambie la ventana
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (observer && el.parentElement) observer.observe(el.parentElement)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
      el.style.removeProperty('--vz-fill')
    }
  }, [ref, enabled])
}

import { useLayoutEffect, type RefObject } from 'react'

/** Cabeceras propias de cada herramienta (la fila a la que sube el círculo). */
export const TOOL_HEAD_SELECTOR = '.gt-head, .gc-head, .bl-head, .cf-head, .vz-head, .gf-header, .qn-header'

/** Arriba de la cabecera de la herramienta una vez colapsado (coincide con --bar-slot en header.css). */
const SLOT_TOP = 12
const ORB_SIZE = 40
const MIN_TOP = 4

/**
 * Pone en `--orb-y` la posición vertical que centra el círculo con la cabecera de la herramienta activa,
 * porque cada herramienta tiene una cabecera de alto distinto.
 */
export function useOrbAlign(shellRef: RefObject<HTMLElement | null>, active: boolean): void {
  useLayoutEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    if (!active) {
      shell.style.removeProperty('--orb-y')
      return
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => apply())
    let observed: Element | null = null
    function apply() {
      const head = shell!.querySelector(`[role="tabpanel"]:not([hidden]) :is(${TOOL_HEAD_SELECTOR})`)
      if (!head) return
      if (observer && head !== observed) {
        if (observed) observer.unobserve(observed)
        observer.observe(head)
        observed = head
      }
      const top = Math.max(MIN_TOP, SLOT_TOP + (head as HTMLElement).offsetHeight / 2 - ORB_SIZE / 2)
      shell!.style.setProperty('--orb-y', `${Math.round(top)}px`)
    }
    apply()
    const host = shell.querySelector('.tool-host')
    // la herramienta carga después (lazy): se vuelve a medir cuando aparece su cabecera
    const mutations = typeof MutationObserver === 'undefined' || !host ? null : new MutationObserver(apply)
    if (host) mutations?.observe(host, { childList: true, subtree: true })
    return () => {
      observer?.disconnect()
      mutations?.disconnect()
      shell.style.removeProperty('--orb-y')
    }
  }, [shellRef, active])
}

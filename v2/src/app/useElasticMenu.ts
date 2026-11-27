import { useEffect, useRef, type RefObject } from 'react'
import { bulges, contentOpacity, menuShapePath, stepSpring, type Spring } from './elasticMenu'

/** Espacio sobre el contenido (el círculo) y márgenes dentro del cuadro. */
const TOP_OFFSET = 68
const BOTTOM_PAD = 10
const SIDE_PAD = 16

type Refs = {
  shape: RefObject<SVGSVGElement | null>
  content: RefObject<HTMLElement | null>
}

/**
 * Menú que sale del círculo: un resorte lleva el cuadro de 0 (círculo) a 1 (abierto) y los bordes se abomban
 * según la velocidad. Dibuja un trazo SVG detrás del contenido y controla su opacidad; todo con transform/opacity.
 * `active` es true solo cuando la barra es un círculo; si no, se limpian los estilos en línea.
 */
export function useElasticMenu(open: boolean, active: boolean, { shape, content }: Refs): void {
  const spring = useRef<Spring>({ p: 0, v: 0 })

  useEffect(() => {
    const svg = shape.current
    const box = content.current
    // sin matchMedia (pruebas) el menú no se anima ni se oculta con estilos en línea
    if (!svg || !box || typeof window.matchMedia !== 'function') return
    const gradient = svg.querySelector<SVGPathElement>('.topbar__shape-grad')
    const solid = svg.querySelector<SVGPathElement>('.topbar__shape-solid')
    if (!gradient || !solid) return

    if (!active) {
      spring.current = { p: 0, v: 0 }
      gradient.style.opacity = '0'
      solid.style.opacity = '0'
      for (const prop of ['opacity', 'transform', 'visibility', 'pointer-events']) box.style.removeProperty(prop)
      return
    }

    const target = open ? 1 : 0
    const draw = () => {
      const { p, v } = spring.current
      const panelW = box.offsetWidth + SIDE_PAD
      const panelH = TOP_OFFSET + box.offsetHeight + BOTTOM_PAD
      const { bx, by } = bulges(v, panelW, panelH)
      const d = menuShapePath(p, bx, by, panelW, panelH)
      gradient.setAttribute('d', d)
      solid.setAttribute('d', d)
      const q = Math.max(0, p)
      const shown = q > 0.002
      gradient.style.opacity = shown ? String(Math.max(0, 1 - q * 4)) : '0'
      solid.style.opacity = shown ? String(Math.min(1, q * 4)) : '0'
      const a = contentOpacity(p)
      box.style.opacity = String(a)
      box.style.transform = `translateY(${((1 - a) * -8).toFixed(1)}px)`
      box.style.visibility = a > 0.01 ? 'visible' : 'hidden'
      box.style.pointerEvents = a > 0.9 ? 'auto' : 'none'
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof requestAnimationFrame !== 'function') {
      spring.current = { p: target, v: 0 }
      draw()
      return
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016)
      last = now
      spring.current = stepSpring(spring.current, target, dt)
      if (Math.abs(spring.current.v) < 0.01 && Math.abs(spring.current.p - target) < 0.0008) {
        spring.current = { p: target, v: 0 }
        draw()
        return
      }
      draw()
      raf = requestAnimationFrame(tick)
    }
    draw()
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, active, shape, content])
}

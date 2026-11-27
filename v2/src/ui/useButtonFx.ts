import { useEffect } from 'react'
import './buttonFx.css'

/** Botones secundarios: reciben el ripple. */
export const RIPPLE_SELECTOR = '.btn--ghost'
/** Botones de solo icono: reciben la gelatina (los de la barra lateral de VectoriZr y cualquiera con data-jelly). */
export const JELLY_SELECTOR = '.vz-ib, [data-jelly]'

const PRESS = [{ transform: 'scale(1, 1)' }, { transform: 'scale(1.14, 0.84)' }]
const WOBBLE = [
  { transform: 'scale(1.14, 0.84)' },
  { transform: 'scale(0.88, 1.14)', offset: 0.3 },
  { transform: 'scale(1.07, 0.94)', offset: 0.55 },
  { transform: 'scale(0.97, 1.03)', offset: 0.8 },
  { transform: 'scale(1, 1)' },
]

function isDisabled(el: Element): boolean {
  return el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true'
}

function spawnRipple(el: HTMLElement, clientX: number, clientY: number): void {
  const r = el.getBoundingClientRect()
  const size = Math.max(r.width, r.height) * 2.6
  const dot = document.createElement('span')
  dot.className = 'fx-ripple'
  dot.setAttribute('aria-hidden', 'true')
  dot.style.cssText = `width:${size}px;height:${size}px;left:${clientX - r.left - size / 2}px;top:${clientY - r.top - size / 2}px`
  el.appendChild(dot)
  dot.addEventListener('animationend', () => dot.remove())
  // por si la animación no corre (pestaña oculta): se limpia igual
  setTimeout(() => dot.remove(), 1500)
}

/**
 * Efectos globales de botones por delegación (un solo juego de listeners para toda la app):
 * ripple en los secundarios y gelatina en los de solo icono. Con reduced-motion no hace nada.
 */
export function useButtonFx(): void {
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const squashed = new Set<HTMLElement>()

    const squash = (el: HTMLElement) => {
      el.getAnimations().forEach((a) => a.cancel())
      const press = el.animate(PRESS, { duration: 90, fill: 'forwards', easing: 'ease-out' })
      ;(el as HTMLElement & { __press?: Animation }).__press = press
      squashed.add(el)
    }
    const release = () => {
      squashed.forEach((el) => {
        const holder = el as HTMLElement & { __press?: Animation }
        holder.__press?.cancel()
        holder.__press = undefined
        el.animate(WOBBLE, { duration: 560, easing: 'ease-out' })
      })
      squashed.clear()
    }

    const onDown = (e: PointerEvent) => {
      if (reduced() || !(e.target instanceof Element)) return
      const ripple = e.target.closest<HTMLElement>(RIPPLE_SELECTOR)
      if (ripple && !isDisabled(ripple)) spawnRipple(ripple, e.clientX, e.clientY)
      const jelly = e.target.closest<HTMLElement>(JELLY_SELECTOR)
      if (jelly && !isDisabled(jelly)) squash(jelly)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat || reduced() || !(e.target instanceof Element)) return
      const ripple = e.target.closest<HTMLElement>(RIPPLE_SELECTOR)
      if (ripple && !isDisabled(ripple)) {
        const r = ripple.getBoundingClientRect()
        spawnRipple(ripple, r.left + r.width / 2, r.top + r.height / 2)
      }
      const jelly = e.target.closest<HTMLElement>(JELLY_SELECTOR)
      if (jelly && !isDisabled(jelly)) squash(jelly)
    }

    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', release)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', release)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [])
}

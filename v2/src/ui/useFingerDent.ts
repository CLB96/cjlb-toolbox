import { useEffect, type RefObject } from 'react'
import { dentClipPath, dentPoints, roundRectPoints, type Point } from './dentGeometry'

/** Nivel elegido por el dueño en el mockup (1.0 = base). */
const INTENSITY = 1.6
const POINTS = 96
const SPRING_K = 260
const SPRING_C = 10
/** Qué tan rápido sigue la hendidura al dedo cuando arrastra. */
const FOLLOW = 20

type State = {
  w: number
  h: number
  base: Point[]
  depth: number
  vel: number
  x: number
  y: number
  goalX: number
  goalY: number
  down: boolean
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Finger dent: el contorno del botón se hunde bajo el dedo (con un anillo de contacto), sigue al dedo si arrastra y
 * al soltar vuelve vibrando como goma. Solo mueve `clip-path` y `transform` del botón pulsado y solo mientras dura.
 */
export function useFingerDent(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const el = ref.current
    // sin matchMedia (pruebas) no hay animación
    if (!el || !enabled || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const ring = el.querySelector<HTMLElement>('.btn__ring')
    let state: State | null = null
    let raf = 0
    let last = 0

    const local = (clientX: number, clientY: number): [number, number] => {
      const r = el.getBoundingClientRect()
      return [clientX - r.left, clientY - r.top]
    }

    const render = (s: State) => {
      const amplitude = s.h * 0.34 * INTENSITY * s.depth
      const sigma = Math.max(24, Math.min(64, s.w * 0.2))
      const dented = dentPoints(s.base, [s.x, s.y], amplitude, sigma)
      el.style.clipPath = dentClipPath(s.base, dented, s.w, s.h)
      el.style.transform = `scale(${(1 - 0.035 * INTENSITY * Math.max(0, s.depth)).toFixed(4)})`
      if (ring) {
        const shown = Math.max(0, Math.min(1, s.depth))
        ring.style.opacity = String(Math.min(1, shown * 1.2))
        ring.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) scale(${(0.7 + 0.3 * shown).toFixed(3)})`
      }
    }

    const clear = () => {
      el.style.clipPath = ''
      el.style.transform = ''
      if (ring) ring.style.opacity = '0'
    }

    const tick = (now: number) => {
      const s = state
      if (!s) return
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016)
      last = now
      const target = s.down ? 1 : 0
      s.vel += (-SPRING_K * (s.depth - target) - SPRING_C * s.vel) * dt
      s.depth += s.vel * dt
      const follow = Math.min(1, dt * FOLLOW)
      s.x += (s.goalX - s.x) * follow
      s.y += (s.goalY - s.y) * follow
      render(s)
      if (!s.down && Math.abs(s.depth) < 0.003 && Math.abs(s.vel) < 0.02) {
        clear()
        state = null
        raf = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (!state) return
      const [x, y] = local(e.clientX, e.clientY)
      state.goalX = Math.max(0, Math.min(state.w, x))
      state.goalY = Math.max(0, Math.min(state.h, y))
    }

    const release = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      if (state) state.down = false
    }

    const press = (clientX: number, clientY: number) => {
      if (reducedMotion() || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return
      const w = el.offsetWidth
      const h = el.offsetHeight
      const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12, h / 2, w / 2)
      const [x, y] = local(clientX, clientY)
      state = {
        w,
        h,
        base: roundRectPoints(w, h, radius, POINTS),
        depth: state?.depth ?? 0,
        vel: state?.vel ?? 0,
        x,
        y,
        goalX: x,
        goalY: y,
        down: true,
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', release)
      window.addEventListener('pointercancel', release)
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const onDown = (e: PointerEvent) => press(e.clientX, e.clientY)
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
        const r = el.getBoundingClientRect()
        press(r.left + r.width / 2, r.top + r.height / 2)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') release()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('keydown', onKeyDown)
    el.addEventListener('keyup', onKeyUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('keydown', onKeyDown)
      el.removeEventListener('keyup', onKeyUp)
      release()
      if (raf) cancelAnimationFrame(raf)
      clear()
    }
  }, [ref, enabled])
}

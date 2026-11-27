import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react'

export const ZOOM_MIN = 1
export const ZOOM_MAX = 16
const ZOOM_STEP = 1.25
const DRAG_PX = 5

type View = { scale: number; x: number; y: number }
const HOME: View = { scale: 1, x: 0, y: 0 }

/** Acerca hacia el punto (cx, cy) del contenedor y mantiene la imagen cubriendo todo el marco. */
export function zoomView(v: View, factor: number, cx: number, cy: number, w: number, h: number): View {
  const scale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.scale * factor))
  if (scale === ZOOM_MIN) return HOME
  const k = scale / v.scale
  return panView({ scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }, 0, 0, w, h)
}

export function panView(v: View, dx: number, dy: number, w: number, h: number): View {
  if (v.scale === ZOOM_MIN) return HOME
  const x = Math.min(0, Math.max(w * (1 - v.scale), v.x + dx))
  const y = Math.min(0, Math.max(h * (1 - v.scale), v.y + dy))
  return { scale: v.scale, x, y }
}

/**
 * Zoom y desplazamiento del lienzo del modo manual: rueda hacia el cursor, arrastre para mover, pellizco en pantallas
 * táctiles y botones. El clic que cierra un arrastre no cuenta como punto (consumeDrag).
 */
export function useCanvasZoom(frameRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const [view, setView] = useState<View>(HOME)
  const viewRef = useRef(view)
  viewRef.current = view
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef({ moved: false, startX: 0, startY: 0, dist: 0 })
  const dragged = useRef(false)

  const size = useCallback(() => {
    const r = frameRef.current?.getBoundingClientRect()
    return { w: r?.width ?? 0, h: r?.height ?? 0, left: r?.left ?? 0, top: r?.top ?? 0 }
  }, [frameRef])

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const { w, h } = size()
      setView((v) => zoomView(v, factor, cx ?? w / 2, cy ?? h / 2, w, h))
    },
    [size],
  )

  const reset = useCallback(() => setView(HOME), [])

  useEffect(() => {
    if (!enabled) setView(HOME)
  }, [enabled])

  // Rueda no pasiva: zoom hacia el cursor
  useEffect(() => {
    const el = frameRef.current
    if (!el || !enabled) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { left, top } = size()
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - left, e.clientY - top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [frameRef, enabled, size, zoomAt])

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (!enabled) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current = { moved: false, startX: e.clientX, startY: e.clientY, dist: 0 }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current.dist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
      gesture.current.moved = true
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!enabled || !prev) return
    const { w, h, left, top } = size()
    const next = { x: e.clientX, y: e.clientY }
    if (pointers.current.size === 2) {
      const others = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)![1]
      const dist = Math.hypot(next.x - others.x, next.y - others.y)
      const cx = (next.x + others.x) / 2 - left
      const cy = (next.y + others.y) / 2 - top
      const factor = gesture.current.dist > 0 ? dist / gesture.current.dist : 1
      gesture.current.dist = dist
      pointers.current.set(e.pointerId, next)
      setView((v) => zoomView(v, factor, cx, cy, w, h))
      return
    }
    pointers.current.set(e.pointerId, next)
    const g = gesture.current
    if (!g.moved && Math.hypot(next.x - g.startX, next.y - g.startY) < DRAG_PX) return
    g.moved = true
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    setView((v) => panView(v, dx, dy, w, h))
  }

  const endPointer = (e: PointerEvent<HTMLElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.delete(e.pointerId)
    if (gesture.current.moved) dragged.current = true
    if (pointers.current.size === 0) gesture.current.moved = false
  }

  /** true si el gesto que acaba de terminar fue un arrastre o pellizco (y por tanto no debe agregar un punto). */
  const consumeDrag = () => {
    const was = dragged.current
    dragged.current = false
    return was
  }

  const style: CSSProperties = {
    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
    transformOrigin: '0 0',
    touchAction: enabled ? 'none' : undefined,
  }

  return {
    scale: view.scale,
    style,
    zoomIn: () => zoomAt(ZOOM_STEP),
    zoomOut: () => zoomAt(1 / ZOOM_STEP),
    reset,
    consumeDrag,
    handlers: { onPointerDown, onPointerMove, onPointerUp: endPointer, onPointerCancel: endPointer },
  }
}

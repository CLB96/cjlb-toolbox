// Zoom y paneo de un SVG cambiando su viewBox. La vista inicial muestra todo el dibujo.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

export interface View {
  x: number
  y: number
  w: number
  h: number
}

/** Hasta 40× de acercamiento y 2× de alejamiento respecto a la vista completa. */
const MIN_SCALE = 1 / 40
const MAX_SCALE = 2
const STEP = 1.25

export function zoomView(view: View, base: View, factor: number, cx: number, cy: number): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (view.w * factor) / base.w))
  const w = base.w * scale
  const h = base.h * scale
  const k = w / view.w
  return { x: cx - (cx - view.x) * k, y: cy - (cy - view.y) * k, w, h }
}

export function panView(view: View, dx: number, dy: number): View {
  return { ...view, x: view.x - dx, y: view.y - dy }
}

/** Punto de pantalla a coordenadas del SVG; sin matriz (jsdom) usa el centro de la vista. */
function toSvg(svg: SVGSVGElement | null, view: View, clientX: number, clientY: number): [number, number] {
  const ctm = svg?.getScreenCTM?.()
  if (!svg || !ctm) return [view.x + view.w / 2, view.y + view.h / 2]
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
  return [p.x, p.y]
}

export function usePanZoom(base: View) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [view, setView] = useState<View>(base)
  const drag = useRef<{ x: number; y: number; id: number } | null>(null)

  const zoomBy = useCallback((factor: number, clientX?: number, clientY?: number) => {
    setView((v) => {
      const [cx, cy] = clientX === undefined || clientY === undefined
        ? [v.x + v.w / 2, v.y + v.h / 2]
        : toSvg(svgRef.current, v, clientX, clientY)
      return zoomView(v, base, factor, cx, cy)
    })
  }, [base])

  const reset = useCallback(() => setView(base), [base])

  // La rueda necesita un listener no pasivo para que la página no se desplace mientras se acerca.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomBy(e.deltaY < 0 ? 1 / STEP : STEP, e.clientX, e.clientY)
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [zoomBy])

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const start = drag.current
    if (!start || start.id !== e.pointerId) return
    const ctm = svgRef.current?.getScreenCTM?.()
    const unit = ctm && ctm.a ? 1 / ctm.a : 1
    drag.current = { ...start, x: e.clientX, y: e.clientY }
    setView((v) => panView(v, (e.clientX - start.x) * unit, (e.clientY - start.y) * unit))
  }
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const move = (dx: number, dy: number) => setView((v) => panView(v, dx * v.w * 0.1, dy * v.h * 0.1))
    const actions: Record<string, () => void> = {
      '+': () => zoomBy(1 / STEP), '=': () => zoomBy(1 / STEP), '-': () => zoomBy(STEP), '0': reset,
      ArrowLeft: () => move(1, 0), ArrowRight: () => move(-1, 0), ArrowUp: () => move(0, 1), ArrowDown: () => move(0, -1),
    }
    const action = actions[e.key]
    if (!action) return
    e.preventDefault()
    action()
  }

  return {
    svgRef, view, zoomIn: () => zoomBy(1 / STEP), zoomOut: () => zoomBy(STEP), reset,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDoubleClick: reset, onKeyDown },
  }
}

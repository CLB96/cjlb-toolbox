import { useRef, type PointerEvent } from 'react'

type Handlers = {
  onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerCancel: (e: PointerEvent<HTMLCanvasElement>) => void
}

type ZoomHandlers = {
  [K in keyof Handlers]: (e: PointerEvent<HTMLElement>) => void
}

/**
 * Reparte el puntero del canvas entre la herramienta de edición y el zoom: con una herramienta activa se edita,
 * y con Mayús o el botón del medio se mueve la foto; sin herramienta, arrastrar mueve la foto.
 */
export function useRoutedPointer(edit: Handlers & { onPointerLeave: () => void }, zoom: ZoomHandlers, toolActive: boolean) {
  const route = useRef<'edit' | 'zoom' | null>(null)
  const pick = () => (route.current === 'zoom' ? zoom : edit)
  return {
    onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => {
      route.current = !toolActive || e.shiftKey || e.button === 1 ? 'zoom' : 'edit'
      pick().onPointerDown(e)
    },
    onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => pick().onPointerMove(e),
    onPointerUp: (e: PointerEvent<HTMLCanvasElement>) => {
      const h = pick()
      route.current = null
      h.onPointerUp(e)
    },
    onPointerCancel: (e: PointerEvent<HTMLCanvasElement>) => {
      const h = pick()
      route.current = null
      h.onPointerCancel(e)
    },
    onPointerLeave: edit.onPointerLeave,
  }
}

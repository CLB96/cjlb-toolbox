import { useEffect, useState, type RefObject } from 'react'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { nearestOnContour, notchGeometry } from '../../logic/notches'
import { activeNotches } from '../../store'
import type { ImagePoint } from '../../types'

export type NotchMenuState =
  | { kind: 'add'; x: number; y: number; at: ImagePoint; segmentIndex: number }
  | { kind: 'notch'; x: number; y: number; id: string }

/** Alcance del clic en píxeles de pantalla. */
const REACH_PX = 10

/**
 * Clic derecho en el lienzo: sobre un notch abre su menú; sobre el contorno, el de añadir; en otro sitio no
 * hace nada (queda el menú normal del navegador). Escape o un clic fuera lo cierran.
 */
export function useNotchMenu(
  containerRef: RefObject<HTMLDivElement | null>,
  toImage: (ev: MouseEvent) => ImagePoint,
  onSelectNotch: (id: string | null) => void,
) {
  const api = useVectorizrApi()
  const [menu, setMenu] = useState<NotchMenuState | null>(null)
  const activePieceId = useVectorizr((s) => s.activePieceId)

  // un menú abierto no debe sobrevivir a un cambio de pieza (su posición o su notch serían de otra)
  useEffect(() => setMenu(null), [activePieceId])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handler = (ev: MouseEvent) => {
      // el clic derecho sobre el propio menú no se trata como un clic sobre el lienzo
      if ((ev.target as Element | null)?.closest?.('.vz-notch-menu')) {
        ev.preventDefault()
        return
      }
      const s = api.getState()
      const p = toImage(ev)
      const reach = REACH_PX / s.zoom
      const rect = container.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      for (const n of activeNotches(s)) {
        const g = notchGeometry(n, s.contourPoints, s.scaleFactor)
        if (!g) continue
        const mid = { x: (g.base.x + g.tip.x) / 2, y: (g.base.y + g.tip.y) / 2 }
        if ([g.base, mid, g.tip].some((q) => Math.hypot(q.x - p.x, q.y - p.y) <= reach)) {
          ev.preventDefault()
          onSelectNotch(n.id)
          setMenu({ kind: 'notch', x, y, id: n.id })
          return
        }
      }
      const hit = nearestOnContour(s.contourPoints, p.x, p.y)
      if (hit && hit.dist <= reach) {
        ev.preventDefault()
        setMenu({ kind: 'add', x, y, at: { x: hit.x, y: hit.y }, segmentIndex: hit.segmentIndex })
        return
      }
      setMenu(null)
    }
    container.addEventListener('contextmenu', handler)
    return () => container.removeEventListener('contextmenu', handler)
  }, [api, containerRef, toImage, onSelectNotch])

  useEffect(() => {
    if (!menu) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setMenu(null)
    }
    const onDown = (ev: MouseEvent) => {
      if (!(ev.target as Element | null)?.closest?.('.vz-notch-menu')) setMenu(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [menu])

  return { menu, closeMenu: () => setMenu(null) }
}

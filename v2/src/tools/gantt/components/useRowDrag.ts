import { useEffect, useRef } from 'react'

const ROW_SELECTOR = 'tr[data-id]'
const INDICATORS = ['gt-drag-over-top', 'gt-drag-over-bot', 'gt-dragging']

interface RowDragState {
  id: number
  clone: HTMLElement
  offX: number
  offY: number
}

/**
 * Reordenar filas con el asa ⠿ (startDrag/moveDrag/endDrag del original): copia flotante de la fila,
 * indicador arriba/abajo y `onDrop(src, tgt, after)` al soltar. Touch incluido.
 */
export function useRowDrag(tableRef: React.RefObject<HTMLElement>, onDrop: (src: number, tgt: number, after: boolean) => void) {
  const state = useRef<RowDragState | null>(null)
  const dropRef = useRef(onDrop)
  dropRef.current = onDrop

  useEffect(() => {
    const clearIndicators = () =>
      tableRef.current?.querySelectorAll(INDICATORS.map((c) => `.${c}`).join(',')).forEach((r) => r.classList.remove(...INDICATORS))
    const getRowAt = (x: number, y: number): HTMLElement | null => {
      const s = state.current
      if (s) s.clone.style.display = 'none'
      const el = document.elementFromPoint(x, y)
      if (s) s.clone.style.display = ''
      return (el?.closest(ROW_SELECTOR) as HTMLElement | null) ?? null
    }
    const cleanup = () => {
      state.current?.clone.remove()
      state.current = null
      clearIndicators()
      document.body.style.userSelect = ''
      delete document.body.dataset.gtBusy
    }
    const move = (x: number, y: number) => {
      const s = state.current
      if (!s) return
      s.clone.style.left = `${x - s.offX}px`
      s.clone.style.top = `${y - s.offY}px`
      clearIndicators()
      const tr = getRowAt(x, y)
      if (!tr || Number(tr.dataset.id) === s.id) return
      const r = tr.getBoundingClientRect()
      tr.classList.add(y < r.top + r.height / 2 ? 'gt-drag-over-top' : 'gt-drag-over-bot')
    }
    const end = (x: number, y: number) => {
      const s = state.current
      if (!s) return
      const tr = getRowAt(x, y)
      cleanup()
      if (!tr) return
      const tid = Number(tr.dataset.id)
      if (tid === s.id) return
      const r = tr.getBoundingClientRect()
      dropRef.current(s.id, tid, y > r.top + r.height / 2)
    }
    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY)
    const onMouseUp = (e: MouseEvent) => end(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (!state.current) return
      e.preventDefault()
      move(e.touches[0]!.clientX, e.touches[0]!.clientY)
    }
    const onTouchEnd = (e: TouchEvent) => end(e.changedTouches[0]!.clientX, e.changedTouches[0]!.clientY)
    const cancel = () => {
      if (state.current) cleanup()
    }
    const onVisibility = () => {
      if (document.hidden) cancel()
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchcancel', cancel)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', cancel)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', cancel)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', cancel)
      cancel()
    }
  }, [tableRef])

  /** Inicia el arrastre desde el asa de la fila `id`. */
  const start = (id: number, x: number, y: number) => {
    if (state.current || document.body.dataset.gtBusy) return
    const tr = tableRef.current?.querySelector<HTMLElement>(`tr[data-id="${id}"]`)
    if (!tr) return
    const r = tr.getBoundingClientRect()
    const clone = tr.cloneNode(true) as HTMLElement
    clone.className = 'gt-drag-clone'
    clone.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;`
    document.body.appendChild(clone)
    tr.classList.add('gt-dragging')
    document.body.style.userSelect = 'none'
    document.body.dataset.gtBusy = 'row'
    state.current = { id, clone, offX: x - r.left, offY: y - r.top }
  }

  return { start }
}

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useGanttApi } from '../GanttStoreProvider'
import { dragDates, detectMode, pxToDays, type DragMode } from '../logic/barDrag'
import { fmtDate } from '../logic/dates'
import type { Task } from '../logic/types'

export interface LiveDrag {
  id: number
  mode: DragMode
  start: Date
  end: Date
  delta: number
  /** El tooltip aparece con el primer movimiento (showBarTip en mousemove). */
  tip: boolean
}

export interface CommittedDrag {
  id: number
  origStart: Date
  origEnd: Date
  start: Date
  end: Date
}

interface DragState {
  id: number
  mode: DragMode
  origStart: Date
  origEnd: Date
  startX: number
  cellWidth: number
}

const CURSOR_ATTR = 'data-cursor'

/** Ancho de una celda-día: primera td de barra de la tabla, 32 si no hay (getCellWidth). */
function cellWidthOf(table: HTMLElement | null): number {
  const cell = table?.querySelector('td.gt-bar-cell')
  return cell ? cell.getBoundingClientRect().width : 32
}

/**
 * Arrastre de barras del original (solo vista Días, ratón): bordes de 8 px redimensionan,
 * Ctrl/Alt + centro mueve; Escape, blur o pestaña oculta cancelan.
 */
export function useBarDrag(
  tableRef: React.RefObject<HTMLElement>,
  tasks: Task[],
  enabled: boolean,
  onCommit: (c: CommittedDrag) => void,
) {
  const api = useGanttApi()
  const drag = useRef<DragState | null>(null)
  const [live, setLive] = useState<LiveDrag | null>(null)
  const liveRef = useRef<LiveDrag | null>(null)
  const commitRef = useRef(onCommit)
  commitRef.current = onCommit

  const setLiveBoth = (v: LiveDrag | null) => {
    liveRef.current = v
    setLive(v)
  }

  useEffect(() => {
    const cleanup = () => {
      drag.current = null
      setLiveBoth(null)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    const onMove = (e: MouseEvent) => {
      const d = drag.current
      if (!d) return
      const deltaDays = pxToDays(e.clientX - d.startX, d.cellWidth)
      const r = dragDates(d.mode, d.origStart, d.origEnd, deltaDays)
      setLiveBoth({ id: d.id, mode: d.mode, start: r.start, end: r.end, delta: r.tooltipDelta, tip: true })
    }
    const onUp = () => {
      const d = drag.current
      if (!d) return
      const l = liveRef.current
      cleanup()
      if (!l) return
      const changed = fmtDate(l.start) !== fmtDate(d.origStart) || fmtDate(l.end) !== fmtDate(d.origEnd)
      if (changed) {
        api.getState().setTaskDates(d.id, l.start, l.end)
        commitRef.current({ id: d.id, origStart: d.origStart, origEnd: d.origEnd, start: l.start, end: l.end })
      }
    }
    const cancel = () => {
      if (drag.current) cleanup()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel()
    }
    const onVisibility = () => {
      if (document.hidden) cancel()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', cancel)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', cancel)
      cancel()
    }
  }, [api])

  const modeAt = (e: ReactMouseEvent<HTMLElement>): DragMode | null => {
    const r = e.currentTarget.getBoundingClientRect()
    return detectMode(e.clientX - r.left, r.width, e.ctrlKey || e.altKey)
  }

  /** Props para la barra interactiva de una tarea sin hijas. */
  const barProps = (id: number) => ({
    onMouseMove: (e: ReactMouseEvent<HTMLElement>) => {
      if (drag.current) return
      const mode = modeAt(e)
      if (mode) e.currentTarget.setAttribute(CURSOR_ATTR, mode)
      else e.currentTarget.removeAttribute(CURSOR_ATTR)
    },
    onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => {
      if (!drag.current) e.currentTarget.removeAttribute(CURSOR_ATTR)
    },
    onMouseDown: (e: ReactMouseEvent<HTMLElement>) => {
      if (e.button !== 0 || !enabled || drag.current) return
      if (document.body.dataset.gtBusy) return
      const mode = modeAt(e)
      if (!mode) return
      const t = tasks.find((x) => x.id === id)
      if (!t) return
      e.preventDefault()
      e.stopPropagation()
      drag.current = {
        id,
        mode,
        origStart: new Date(t.start),
        origEnd: new Date(t.end),
        startX: e.clientX,
        cellWidth: cellWidthOf(tableRef.current),
      }
      setLiveBoth({ id, mode, start: new Date(t.start), end: new Date(t.end), delta: 0, tip: false })
      document.body.style.userSelect = 'none'
      document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ew-resize'
    },
  })

  return { live, barProps }
}

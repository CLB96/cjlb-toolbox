import { useEffect } from 'react'
import { usePersistentTool } from '../../persistence/usePersistentTool'
import { useGanttApi } from './GanttStoreProvider'
import { resetInto, restoreInto, snapshotOf, type GanttState } from './store'

/** Conecta el store de esta instancia con el guardado; marca dirty solo si cambian datos persistibles. */
export function useGanttPersistence() {
  const api = useGanttApi()
  const tool = usePersistentTool<GanttState>('gantt', {
    getSnapshot: () => snapshotOf(api.getState()),
    restore: (s) => restoreInto(api, s),
    reset: () => resetInto(api),
  })
  const { markDirty, restored } = tool

  useEffect(() => {
    if (!restored) return
    return api.subscribe((s, prev) => {
      if (s.charts !== prev.charts || s.activeId !== prev.activeId || s.prefs !== prev.prefs) markDirty()
    })
  }, [api, restored, markDirty])

  return tool
}

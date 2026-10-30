import { useEffect } from 'react'
import { usePersistentTool } from '../../persistence/usePersistentTool'
import { useGapcheckApi } from './GapcheckStoreProvider'
import { initialData, restoreInto, snapshotOf, type GapcheckState } from './store'

/** Conecta el store de esta instancia con el guardado; marca dirty en cada cambio tras restaurar. */
export function useGapcheckPersistence() {
  const api = useGapcheckApi()
  const tool = usePersistentTool<GapcheckState>('gapcheck', {
    getSnapshot: () => snapshotOf(api.getState()),
    restore: (s) => restoreInto(api, s),
    reset: () => api.setState(initialData()),
  })
  const { markDirty, restored } = tool

  useEffect(() => {
    if (!restored) return
    return api.subscribe(() => markDirty())
  }, [api, restored, markDirty])

  return tool
}

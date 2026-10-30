import { useEffect } from 'react'
import { usePersistentTool } from '../../persistence/usePersistentTool'
import {
  getGapcheckSnapshot,
  initialData,
  restoreGapcheck,
  useGapcheckStore,
  type GapcheckState,
} from './store'

/** Conecta el store con el guardado automático; marca dirty en cada cambio tras restaurar. */
export function useGapcheckPersistence() {
  const tool = usePersistentTool<GapcheckState>('gapcheck', {
    getSnapshot: getGapcheckSnapshot,
    restore: restoreGapcheck,
    reset: () => useGapcheckStore.setState(initialData()),
  })
  const { markDirty, restored } = tool

  useEffect(() => {
    if (!restored) return
    return useGapcheckStore.subscribe(() => markDirty())
  }, [restored, markDirty])

  return tool
}

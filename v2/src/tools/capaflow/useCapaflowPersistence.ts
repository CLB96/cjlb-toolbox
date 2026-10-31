import { useEffect } from 'react'
import { usePersistentTool } from '../../persistence/usePersistentTool'
import { useCapaApi } from './CapaflowStoreProvider'
import { resetInto, restoreInto, snapshotOf, type CapaState } from './store'

/** Conecta el store de esta instancia con el guardado; marca dirty en cada cambio tras restaurar. */
export function useCapaflowPersistence() {
  const api = useCapaApi()
  const tool = usePersistentTool<CapaState>('capaflow', {
    getSnapshot: () => snapshotOf(api.getState()),
    restore: (s) => restoreInto(api, s),
    reset: () => resetInto(api),
  })
  const { markDirty, restored } = tool

  useEffect(() => {
    if (!restored) return
    return api.subscribe(() => markDirty())
  }, [api, restored, markDirty])

  return tool
}

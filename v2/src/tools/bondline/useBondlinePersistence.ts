import { useEffect } from 'react'
import { usePersistentTool } from '../../persistence/usePersistentTool'
import { useBondlineApi } from './BondlineStoreProvider'
import { initialData, restoreInto, snapshotOf, type BondlineState } from './store'

/** Conecta el store de esta instancia con el guardado; marca dirty en cada cambio tras restaurar. */
export function useBondlinePersistence() {
  const api = useBondlineApi()
  const tool = usePersistentTool<BondlineState>('bondline', {
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

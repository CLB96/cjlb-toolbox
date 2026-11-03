import { useMemo } from 'react'
import type { ToolId } from '../../app/routes'
import { usePersistentTool } from '../../persistence/usePersistentTool'
import { useGageflowApi } from './GageflowStoreProvider'
import { crearAdaptadorGageflow, type GageflowSnapshot } from './store'

/** Persistencia por usuario con el contrato de `usePersistentTool`. */
export function useGageflowPersistence(toolId: ToolId) {
  const api = useGageflowApi()
  const adaptador = useMemo(() => crearAdaptadorGageflow(api), [api])
  return usePersistentTool<GageflowSnapshot>(toolId, adaptador)
}

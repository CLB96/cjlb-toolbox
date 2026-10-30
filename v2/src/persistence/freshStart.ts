import type { ToolId } from '../app/routes'
import { getRegisteredTool } from './flushRegistry'
import { markFreshStart } from './snapshotStore'

/**
 * "Empezar de cero". Si la herramienta está montada (keep-alive) bajo este uid, guarda su
 * estado actual en el historial y la resetea en memoria; si no, deja un flag que el próximo
 * montaje consume para no restaurar. El historial se conserva en ambos casos.
 */
export async function startFresh(uid: string, toolId: ToolId): Promise<void> {
  const handle = getRegisteredTool(toolId)
  if (handle && handle.uid === uid) {
    await handle.startFresh()
    return
  }
  await markFreshStart(uid, toolId)
}

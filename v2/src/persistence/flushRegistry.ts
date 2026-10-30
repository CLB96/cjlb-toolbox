import type { ToolId } from '../app/routes'

const registry = new Map<ToolId, () => Promise<void>>()

/** Registra el flush de una herramienta; devuelve la función para desregistrarlo. */
export function registerFlush(toolId: ToolId, fn: () => Promise<void>): () => void {
  registry.set(toolId, fn)
  return () => {
    if (registry.get(toolId) === fn) registry.delete(toolId)
  }
}

export async function flushTool(toolId: ToolId): Promise<void> {
  await registry.get(toolId)?.()
}

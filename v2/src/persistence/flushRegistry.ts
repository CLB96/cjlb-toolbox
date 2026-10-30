import type { ToolId } from '../app/routes'

/** Lo que una herramienta montada (usePersistentTool) expone al resto de la app. */
export interface ToolHandle {
  /** uid bajo el que guarda la herramienta. */
  uid: string
  /** Guarda de inmediato lo pendiente. */
  flush(): Promise<void>
  /** Guarda el estado actual en el historial, vuelve al estado inicial y guarda ese estado. */
  startFresh(): Promise<void>
}

const registry = new Map<ToolId, ToolHandle>()

/** Registra una herramienta montada; devuelve la función para desregistrarla. */
export function registerTool(toolId: ToolId, handle: ToolHandle): () => void {
  registry.set(toolId, handle)
  return () => {
    if (registry.get(toolId) === handle) registry.delete(toolId)
  }
}

export function getRegisteredTool(toolId: ToolId): ToolHandle | undefined {
  return registry.get(toolId)
}

export async function flushTool(toolId: ToolId): Promise<void> {
  await registry.get(toolId)?.flush()
}

/** Guarda lo pendiente de todas las herramientas montadas (p. ej. antes de leer "Volver"). */
export async function flushAll(): Promise<void> {
  await Promise.all([...registry.values()].map((h) => h.flush()))
}

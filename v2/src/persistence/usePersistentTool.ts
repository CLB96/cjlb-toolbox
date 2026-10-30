import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import type { ToolId } from '../app/routes'
import { toast } from '../ui/toastStore'
import { createAutosave, type Autosave } from './autosave'
import { registerTool } from './flushRegistry'
import {
  consumeFreshStart,
  listSnapshots,
  loadSnapshot,
  markFreshStart,
  saveSnapshot,
} from './snapshotStore'
import { useUid } from './uidContext'

export const AUTOSAVE_INTERVAL_MS = 60_000

const inFlightFresh = new Map<string, Promise<boolean>>()

/** Comparte el consumo del flag entre los dos efectos de StrictMode. */
function consumeFreshOnce(uid: string, toolId: ToolId): Promise<boolean> {
  const key = `${uid}:${toolId}`
  const existing = inFlightFresh.get(key)
  if (existing) return existing
  const p = consumeFreshStart(uid, toolId).finally(() => inFlightFresh.delete(key))
  inFlightFresh.set(key, p)
  return p
}

/**
 * Adaptador entre la herramienta y la persistencia.
 * - `getSnapshot()` devuelve el estado actual y debe ser apto para structured clone (objetos
 *   planos, arrays, Map, Set, Date, Blob/File, ArrayBuffer/typed arrays; sin funciones ni
 *   instancias de clases propias). Debe leer de refs, no de variables capturadas en un render
 *   anterior: se llama desde temporizadores y eventos fuera del ciclo de render.
 * - `restore(s)` aplica un snapshot guardado.
 * - `reset()` vuelve al estado inicial ("Empezar de cero" con la herramienta ya abierta). Debe
 *   actualizar también la ref que lee `getSnapshot()`, porque se guarda justo después.
 */
export interface PersistAdapter<S> {
  getSnapshot(): S
  restore(s: S): void
  reset(): void
}

export interface PersistentTool {
  markDirty(): void
  flush(): Promise<void>
  lastSavedAt: number | null
  /** Aplica una versión del historial y la guarda como la más reciente. */
  restoreVersion(id: string): Promise<void>
  /**
   * false hasta que termina la restauración inicial. Mientras sea false no se guarda nada, así
   * que la herramienta debe ignorar ediciones (o no ofrecerlas) hasta que sea true.
   */
  restored: boolean
}

/**
 * Contrato de persistencia de cada herramienta. El estado se guarda bajo el uid vigente;
 * AuthGate monta el árbol de herramientas con `key={uid}` para que un cambio de usuario
 * desmonte el estado keep-alive del anterior.
 *
 * Cada ejecución del efecto (también las dobles de StrictMode) lleva su propio flag
 * `restored`: solo guarda si su restauración terminó estando activa, de modo que un efecto
 * desechado nunca sobrescribe el último snapshot con el estado inicial en blanco.
 */
export function usePersistentTool<S>(toolId: ToolId, adapter: PersistAdapter<S>): PersistentTool {
  const uid = useUid()
  const { t } = useI18n()
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [restoredState, setRestoredState] = useState(false)
  const adapterRef = useRef(adapter)
  adapterRef.current = adapter
  const tRef = useRef(t)
  tRef.current = t
  const autosaveRef = useRef<Autosave | null>(null)
  const pendingDirty = useRef(false)

  useEffect(() => {
    let active = true
    let restored = false
    setRestoredState(false)

    const ready = (async () => {
      try {
        if (!(await consumeFreshOnce(uid, toolId))) {
          const [latest] = await listSnapshots(uid, toolId)
          const snap = latest ? await loadSnapshot<S>(uid, toolId, latest.id) : null
          if (snap && active) {
            adapterRef.current.restore(snap.data)
            setLastSavedAt(snap.savedAt)
          }
        }
      } catch {
        toast('error', tRef.current('persist.restoreFailed'))
      }
      // tras un fallo también se permite guardar: las versiones anteriores siguen en el historial
      if (active) {
        restored = true
        setRestoredState(true)
      }
    })()

    // avisa una vez por estado con archivos omitidos; se rearma cuando un guardado ya no omite nada
    let warnedLargeFiles = false
    const persist = async (data: S) => {
      const meta = await saveSnapshot(uid, toolId, data)
      if (!meta.skippedLargeFiles) warnedLargeFiles = false
      else if (!warnedLargeFiles) {
        warnedLargeFiles = true
        toast('warn', tRef.current('persist.largeFilesSkipped'))
      }
      if (active) setLastSavedAt(meta.savedAt)
    }

    const autosave = createAutosave({
      intervalMs: AUTOSAVE_INTERVAL_MS,
      save: async () => {
        await ready
        if (restored) await persist(adapterRef.current.getSnapshot())
      },
      onError: () => toast('error', tRef.current('persist.saveFailed')),
    })
    autosaveRef.current = autosave
    if (pendingDirty.current) {
      pendingDirty.current = false
      autosave.markDirty()
    }

    const startFresh = async () => {
      await ready
      if (!restored) {
        await markFreshStart(uid, toolId)
        return
      }
      // si este guardado falla se propaga y no se resetea: no se pierde nada
      await persist(adapterRef.current.getSnapshot())
      adapterRef.current.reset()
      autosave.markDirty()
      await autosave.flush()
    }
    const unregister = registerTool(toolId, { uid, flush: () => autosave.flush(), startFresh })

    return () => {
      active = false
      unregister()
      // guarda lo pendiente bajo el uid saliente (la cadena de flush sobrevive al dispose)
      if (restored) void autosave.flush()
      autosave.dispose()
      autosaveRef.current = null
    }
  }, [uid, toolId])

  const markDirty = useCallback(() => {
    if (autosaveRef.current) autosaveRef.current.markDirty()
    else pendingDirty.current = true
  }, [])
  const flush = useCallback(async () => {
    await autosaveRef.current?.flush()
  }, [])
  const restoreVersion = useCallback(
    async (id: string) => {
      try {
        const snap = await loadSnapshot<S>(uid, toolId, id)
        if (!snap) return
        adapterRef.current.restore(snap.data)
      } catch {
        toast('error', tRef.current('persist.restoreFailed'))
        return
      }
      markDirty()
      await flush()
    },
    [uid, toolId, markDirty, flush],
  )

  return { markDirty, flush, lastSavedAt, restoreVersion, restored: restoredState }
}

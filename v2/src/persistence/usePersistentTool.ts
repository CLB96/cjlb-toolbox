import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import type { ToolId } from '../app/routes'
import { toast } from '../ui/toastStore'
import { createAutosave, type Autosave } from './autosave'
import { registerFlush } from './flushRegistry'
import {
  consumeFreshStart,
  listSnapshots,
  loadSnapshot,
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

export interface PersistAdapter<S> {
  getSnapshot(): S
  restore(s: S): void
}

export interface PersistentTool {
  markDirty(): void
  flush(): Promise<void>
  lastSavedAt: number | null
  restoreVersion(id: string): Promise<void>
}

/**
 * Contrato de persistencia de cada herramienta. El estado se guarda bajo el uid vigente;
 * Task 7 debe montar el árbol de herramientas con `key={uid}` para que un cambio de
 * usuario desmonte el estado keep-alive del anterior.
 */
export function usePersistentTool<S>(toolId: ToolId, adapter: PersistAdapter<S>): PersistentTool {
  const uid = useUid()
  const { t } = useI18n()
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const adapterRef = useRef(adapter)
  adapterRef.current = adapter
  const tRef = useRef(t)
  tRef.current = t
  const autosaveRef = useRef<Autosave | null>(null)
  const pendingDirty = useRef(false)

  useEffect(() => {
    let active = true
    const ready = (async () => {
      try {
        if (await consumeFreshOnce(uid, toolId)) return
        const [latest] = await listSnapshots(uid, toolId)
        if (!latest) return
        const snap = await loadSnapshot<S>(uid, toolId, latest.id)
        if (snap && active) adapterRef.current.restore(snap.data)
        if (snap && active) setLastSavedAt(snap.savedAt)
      } catch {
        toast('error', tRef.current('persist.restoreFailed'))
      }
    })()

    const autosave = createAutosave({
      intervalMs: AUTOSAVE_INTERVAL_MS,
      save: async () => {
        await ready
        const meta = await saveSnapshot(uid, toolId, adapterRef.current.getSnapshot())
        if (meta.skippedLargeFiles) toast('warn', tRef.current('persist.largeFilesSkipped'))
        if (active) setLastSavedAt(meta.savedAt)
      },
      onError: () => toast('error', tRef.current('persist.saveFailed')),
    })
    autosaveRef.current = autosave
    if (pendingDirty.current) {
      pendingDirty.current = false
      autosave.markDirty()
    }
    const unregister = registerFlush(toolId, () => autosave.flush())

    return () => {
      active = false
      unregister()
      // guarda lo pendiente bajo el uid saliente (la cadena de flush sobrevive al dispose)
      void autosave.flush()
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
        if (snap) adapterRef.current.restore(snap.data)
      } catch {
        toast('error', tRef.current('persist.restoreFailed'))
      }
    },
    [uid, toolId],
  )

  return { markDirty, flush, lastSavedAt, restoreVersion }
}

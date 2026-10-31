import { useEffect } from 'react'
import { usePersistentTool, type PersistentTool } from '../../persistence/usePersistentTool'
import { useVectorizrApi } from './VectorizrStoreProvider'
import { resetInto, restoreInto, snapshotOf, type VectorizrData, type VectorizrSnapshot } from './store'

const blobOf = (s: VectorizrData) => s.image?.blob ?? s.restoringBlob

/** Campos persistidos: un cambio en cualquiera marca dirty (zoom, pan, herramienta e historial no). */
export function persistedChanged(s: VectorizrData, prev: VectorizrData): boolean {
  return (
    s.step !== prev.step ||
    blobOf(s) !== blobOf(prev) ||
    s.imageWidth !== prev.imageWidth ||
    s.imageHeight !== prev.imageHeight ||
    s.scaleRef !== prev.scaleRef ||
    s.scaleFactor !== prev.scaleFactor ||
    s.contourPoints !== prev.contourPoints ||
    s.paths !== prev.paths ||
    s.imageRotation !== prev.imageRotation ||
    s.detectionMethod !== prev.detectionMethod ||
    s.threshold1 !== prev.threshold1 ||
    s.threshold2 !== prev.threshold2
  )
}

/** Conecta el store de esta instancia con el guardado automático. */
export function useVectorizrPersistence(): PersistentTool {
  const api = useVectorizrApi()
  const tool = usePersistentTool<VectorizrSnapshot>('vectorizr', {
    getSnapshot: () => snapshotOf(api.getState()),
    restore: (s) => restoreInto(api, s),
    reset: () => resetInto(api),
  })
  const { markDirty, restored } = tool

  useEffect(() => {
    if (!restored) return
    return api.subscribe((s, prev) => {
      if (persistedChanged(s, prev)) markDirty()
    })
  }, [api, restored, markDirty])

  return tool
}

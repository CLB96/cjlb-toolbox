import { useEffect, useState } from 'react'
import { parseBadge, type Badge, type BadgeOverrides } from './customize'

/** Un documento por herramienta: `toolBadges/{toolId}` con `{ badge }`. Solo el admin escribe. */
export const BADGES_COLLECTION = 'toolBadges'

/** Firebase se carga al usarse: el inicio no lo inicializa solo por importarse. */
async function firestore() {
  const [fs, { db }] = await Promise.all([import('firebase/firestore'), import('../auth/firebase')])
  return { fs, db }
}

export function subscribeBadges(
  onChange: (overrides: BadgeOverrides) => void,
  onError: (e: unknown) => void,
): () => void {
  let cancelled = false
  let stop: (() => void) | null = null
  firestore()
    .then(({ fs, db }) => {
      if (cancelled) return
      stop = fs.onSnapshot(
        fs.collection(db, BADGES_COLLECTION),
        (snap) => {
          const out: Record<string, Badge> = {}
          for (const d of snap.docs) {
            const badge = parseBadge(d.data().badge)
            if (badge !== undefined) out[d.id] = badge
          }
          onChange(out)
        },
        onError,
      )
    })
    .catch(onError)
  return () => {
    cancelled = true
    stop?.()
  }
}

export async function saveBadge(toolId: string, badge: Badge): Promise<void> {
  const { fs, db } = await firestore()
  await fs.setDoc(fs.doc(db, BADGES_COLLECTION, toolId), { badge })
}

/** Insignias guardadas en vivo; si no se pueden leer se usan las de tools.json. */
export function useToolBadges(enabled: boolean): BadgeOverrides {
  const [overrides, setOverrides] = useState<BadgeOverrides>({})
  useEffect(() => {
    if (!enabled) {
      setOverrides({})
      return
    }
    return subscribeBadges(setOverrides, () => setOverrides({}))
  }, [enabled])
  return overrides
}

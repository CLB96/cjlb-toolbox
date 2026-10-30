import { get, set } from 'idb-keyval'
import { snapshotIdbStore } from './snapshotStore'

/** Preferencias por usuario en el mismo object store; el prefijo `~pref~:` las separa de snapshots. */
const PREF_PREFIX = '~pref~:'
const prefKey = (uid: string, key: string) => `${PREF_PREFIX}${uid}:${key}`

export function loadPreference<T>(uid: string, key: string): Promise<T | undefined> {
  return get<T>(prefKey(uid, key), snapshotIdbStore)
}

export async function savePreference<T>(uid: string, key: string, value: T): Promise<void> {
  await set(prefKey(uid, key), value, snapshotIdbStore)
}

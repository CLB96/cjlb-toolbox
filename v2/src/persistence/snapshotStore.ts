import { createStore, del, delMany, get, getMany, keys, set, setMany } from 'idb-keyval'
import { TOOL_IDS, type ToolId } from '../app/routes'
import { MAX_FILE_BYTES, stripLargeFiles } from './stripLargeFiles'

export { MAX_FILE_BYTES, stripLargeFiles }

export interface SnapshotMeta {
  id: string
  uid: string
  toolId: ToolId
  savedAt: number
  label?: string
  skippedLargeFiles?: boolean
}

export interface Snapshot<S> extends SnapshotMeta {
  data: S
}

export const MAX_SNAPSHOTS = 10

/**
 * Un mismo object store guarda, por cada versión, dos registros escritos en una transacción:
 * - datos: `uid:toolId:savedAt` → `Snapshot` completo (solo lo lee `loadSnapshot`);
 * - meta:  `~meta~:uid:toolId:savedAt` → `SnapshotMeta` (listar y podar leen solo estos).
 */
const META_PREFIX = '~meta~:'
const FRESH_PREFIX = '~fresh~:'
const store = createStore('cjlb-toolbox', 'snapshots')

const keyOf = (uid: string, toolId: ToolId, savedAt: number) => `${uid}:${toolId}:${savedAt}`
const metaKeyOf = (id: string) => `${META_PREFIX}${id}`
const prefixOf = (uid: string, toolId: ToolId) => `${uid}:${toolId}:`
const freshKey = (uid: string, toolId: ToolId) => `${FRESH_PREFIX}${uid}:${toolId}`

async function uniqueSavedAt(uid: string, toolId: ToolId): Promise<number> {
  let at = Date.now()
  while ((await get(metaKeyOf(keyOf(uid, toolId, at)), store)) !== undefined) at += 1
  return at
}

const byNewest = (a: SnapshotMeta, b: SnapshotMeta) => b.savedAt - a.savedAt

async function metaKeys(): Promise<string[]> {
  const all = await keys(store)
  return all.filter((k): k is string => typeof k === 'string' && k.startsWith(META_PREFIX))
}

async function readMetas(metaKeyList: string[]): Promise<SnapshotMeta[]> {
  if (metaKeyList.length === 0) return []
  const records = await getMany<SnapshotMeta | undefined>(metaKeyList, store)
  return records.filter((r): r is SnapshotMeta => r !== undefined).sort(byNewest)
}

const metaPrefixOf = (uid: string, toolId: ToolId) => metaKeyOf(prefixOf(uid, toolId))

export async function listSnapshots(uid: string, toolId: ToolId): Promise<SnapshotMeta[]> {
  const prefix = metaPrefixOf(uid, toolId)
  return readMetas((await metaKeys()).filter((k) => k.startsWith(prefix)))
}

export async function saveSnapshot<S>(
  uid: string,
  toolId: ToolId,
  data: S,
  label?: string,
): Promise<SnapshotMeta> {
  const { value, skipped } = stripLargeFiles(data)
  const savedAt = await uniqueSavedAt(uid, toolId)
  const id = keyOf(uid, toolId, savedAt)
  const meta: SnapshotMeta = {
    id,
    uid,
    toolId,
    savedAt,
    ...(label !== undefined ? { label } : {}),
    ...(skipped ? { skippedLargeFiles: true } : {}),
  }
  await setMany(
    [
      [id, { ...meta, data: value }],
      [metaKeyOf(id), meta],
    ],
    store,
  )
  const all = await listSnapshots(uid, toolId)
  const stale = all.slice(MAX_SNAPSHOTS).flatMap((m) => [m.id, metaKeyOf(m.id)])
  if (stale.length > 0) await delMany(stale, store)
  return meta
}

export async function loadSnapshot<S>(
  uid: string,
  toolId: ToolId,
  id: string,
): Promise<Snapshot<S> | null> {
  if (!id.startsWith(prefixOf(uid, toolId))) return null
  return (await get<Snapshot<S>>(id, store)) ?? null
}

export async function latestPerTool(uid: string, limit = 3): Promise<SnapshotMeta[]> {
  const all = await metaKeys()
  const lists = await Promise.all(
    TOOL_IDS.map((t) => readMetas(all.filter((k) => k.startsWith(metaPrefixOf(uid, t))))),
  )
  return lists
    .flatMap((l) => (l[0] ? [l[0]] : []))
    .sort(byNewest)
    .slice(0, limit)
}

export async function markFreshStart(uid: string, toolId: ToolId): Promise<void> {
  await set(freshKey(uid, toolId), true, store)
}

export async function consumeFreshStart(uid: string, toolId: ToolId): Promise<boolean> {
  const k = freshKey(uid, toolId)
  const flagged = (await get(k, store)) === true
  if (flagged) await del(k, store)
  return flagged
}

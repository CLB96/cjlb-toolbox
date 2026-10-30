import { createStore, del, get, keys, set } from 'idb-keyval'
import { TOOL_IDS, type ToolId } from '../app/routes'

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
export const MAX_FILE_BYTES = 20 * 1024 * 1024

const FRESH_PREFIX = '~fresh~:'
const store = createStore('cjlb-toolbox', 'snapshots')

const keyOf = (uid: string, toolId: ToolId, savedAt: number) => `${uid}:${toolId}:${savedAt}`
const prefixOf = (uid: string, toolId: ToolId) => `${uid}:${toolId}:`
const freshKey = (uid: string, toolId: ToolId) => `${FRESH_PREFIX}${uid}:${toolId}`

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

/** Copia inmutable de `value` sustituyendo por null todo Blob/File > 20 MB. */
export function stripLargeFiles<T>(value: T): { value: T; skipped: boolean } {
  let skipped = false
  const walk = (v: unknown): unknown => {
    if (typeof Blob !== 'undefined' && v instanceof Blob) {
      if (v.size > MAX_FILE_BYTES) {
        skipped = true
        return null
      }
      return v
    }
    if (Array.isArray(v)) return v.map(walk)
    if (isPlainObject(v)) {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    }
    return v
  }
  const out = walk(value) as T
  return { value: out, skipped }
}

async function uniqueSavedAt(uid: string, toolId: ToolId): Promise<number> {
  let at = Date.now()
  while ((await get(keyOf(uid, toolId, at), store)) !== undefined) at += 1
  return at
}

export async function listSnapshots(uid: string, toolId: ToolId): Promise<SnapshotMeta[]> {
  const prefix = prefixOf(uid, toolId)
  const all = await keys(store)
  const mine = all.filter((k): k is string => typeof k === 'string' && k.startsWith(prefix))
  const records = await Promise.all(mine.map((k) => get<Snapshot<unknown>>(k, store)))
  return records
    .filter((r): r is Snapshot<unknown> => r !== undefined)
    .map(({ data: _data, ...meta }) => meta)
    .sort((a, b) => b.savedAt - a.savedAt)
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
  await set(id, { ...meta, data: value }, store)
  const all = await listSnapshots(uid, toolId)
  await Promise.all(all.slice(MAX_SNAPSHOTS).map((m) => del(m.id, store)))
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
  const lists = await Promise.all(TOOL_IDS.map((t) => listSnapshots(uid, t)))
  return lists
    .flatMap((l) => (l[0] ? [l[0]] : []))
    .sort((a, b) => b.savedAt - a.savedAt)
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

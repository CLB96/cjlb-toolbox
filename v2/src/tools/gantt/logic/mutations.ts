// Cambios sobre la lista de tareas (normalizeTask, delTask, duplicateTask, moveTask: 1675-1724).
// Devuelven listas nuevas; los textos de error/aviso son claves del diccionario o literales del original.
import type { GanttKey } from '../i18n'
import { parseLocal } from './dates'
import { getAllDescendants, getDepth, validateParentAssignment } from './tree'
import type { Status, Task } from './types'

export type NormalizeResult = { ok: true; task: Task } | { ok: false; error: GanttKey }

export function normalizeTask(
  tasks: Task[],
  name: string,
  ss: string,
  es: string,
  status: Status,
  id: number,
  comment = '',
  parentId: string | number | null = null,
): NormalizeResult {
  const n = name.trim()
  if (!n) return { ok: false, error: 'errName' }
  if (!ss || !es) return { ok: false, error: 'errDates' }
  const rs = parseLocal(ss)
  const re = parseLocal(es)
  if (isNaN(rs.getTime()) || isNaN(re.getTime())) return { ok: false, error: 'errInvalidDates' }
  if (re < rs) return { ok: false, error: 'errDateOrder' }
  const normalizedParentId = parentId == null || parentId === '' ? null : parseInt(String(parentId), 10)
  const parentError = validateParentAssignment(tasks, id, normalizedParentId)
  if (parentError) return { ok: false, error: parentError }
  return { ok: true, task: { id, name: n, start: rs, end: re, status, comment: comment.trim(), parentId: normalizedParentId } }
}

export interface DeleteResult {
  tasks: Task[]
  removed: Set<number>
}

/** delTask sin el confirm: borra la tarea y toda su descendencia. */
export function deleteSubtree(tasks: Task[], id: number): DeleteResult | null {
  const root = tasks.find((t) => t.id === id)
  if (!root) return null
  const removed = new Set([id, ...getAllDescendants(tasks, root.id).map((t) => t.id)])
  return { tasks: tasks.filter((t) => !removed.has(t.id)), removed }
}

export interface DuplicateResult {
  tasks: Task[]
  nextId: number
  idMap: Map<number, number>
}

export function duplicateSubtree(tasks: Task[], id: number, nextId: number, suffix: string): DuplicateResult | null {
  const base = tasks.find((t) => t.id === id)
  if (!base) return null
  const descendants = getAllDescendants(tasks, id)
  const sourceIds = [id, ...descendants.map((t) => t.id)]
  const idMap = new Map<number, number>()
  let n = nextId
  sourceIds.forEach((sourceId) => idMap.set(sourceId, n++))
  const clones = sourceIds.map((sourceId) => {
    const source = tasks.find((t) => t.id === sourceId)!
    const cloneId = idMap.get(sourceId)!
    const cloneParent = source.parentId && idMap.has(source.parentId) ? idMap.get(source.parentId)! : source.parentId
    return {
      id: cloneId,
      name: sourceId === id ? source.name + suffix : source.name,
      start: new Date(source.start),
      end: new Date(source.end),
      status: source.status,
      comment: source.comment || '',
      parentId: cloneParent || null,
    }
  })
  return { tasks: [...tasks, ...clones], nextId: n, idMap }
}

export type MoveError = 'onlySubtasks' | 'onlySiblings' | 'ownDescendants'
export type MoveResult = { ok: true; tasks: Task[] } | { ok: false; error: MoveError | null }

export function moveTask(tasks: Task[], srcId: number, tgtId: number, after: boolean): MoveResult {
  const src = tasks.find((t) => t.id === srcId)
  const tgt = tasks.find((t) => t.id === tgtId)
  if (!src || !tgt) return { ok: false, error: null }
  // Solo subtareas pueden moverse manualmente
  if (getDepth(tasks, src) === 0) return { ok: false, error: 'onlySubtasks' }
  // Solo se puede reordenar entre hermanos (mismo padre)
  if (src.parentId !== tgt.parentId) return { ok: false, error: 'onlySiblings' }
  const srcDescIds = new Set(getAllDescendants(tasks, srcId).map((t) => t.id))
  if (srcId === tgtId || srcDescIds.has(tgtId)) return { ok: false, error: 'ownDescendants' }
  const srcFamily = [src, ...getAllDescendants(tasks, srcId)]
  const srcFamilyIds = new Set(srcFamily.map((t) => t.id))
  const rest = tasks.filter((t) => !srcFamilyIds.has(t.id))
  const tgtIdx = rest.findIndex((t) => t.id === tgtId)
  if (tgtIdx < 0) return { ok: false, error: null }
  if (after) {
    const tgtDescIds = getAllDescendants(rest, tgtId).map((t) => t.id)
    const lastId = tgtDescIds.length ? tgtDescIds[tgtDescIds.length - 1] : tgtId
    const insertAt = rest.findIndex((t) => t.id === lastId) + 1
    rest.splice(insertAt > 0 ? insertAt : tgtIdx + 1, 0, ...srcFamily)
  } else {
    rest.splice(tgtIdx, 0, ...srcFamily)
  }
  return { ok: true, tasks: rest }
}

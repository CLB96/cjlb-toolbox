// Lógica pura del original (gantt/index.html 1033-1106, 1446-1479), con `tasks` y `today` como parámetros.
// Las expresiones se conservan tal cual; la referencia literal está en legacy-fixtures/gantt.
import type { Lang } from '../i18n'
import { addDays, dayDiff, fmtDate, getMonths, getWeekStart, parseLocal } from './dates'
import type {
  EffectiveDates,
  FilterValue,
  SortValue,
  Status,
  StoredTask,
  Task,
  TaskStateMeta,
  ViewMode,
} from './types'

export const statusRank: Record<Status, number> = { bloc: 0, late: 1, prog: 2, pend: 3, done: 4 }

export function deserializeTask(t: StoredTask): Task {
  return {
    id: t.id,
    name: t.name,
    start: parseLocal(t.start),
    end: parseLocal(t.end),
    status: t.status,
    comment: t.comment || '',
    parentId: t.parentId || null,
  }
}
export function serializeTask(t: Task): StoredTask {
  return {
    id: t.id,
    name: t.name,
    start: fmtDate(t.start),
    end: fmtDate(t.end),
    status: t.status,
    comment: t.comment || '',
    parentId: t.parentId || null,
  }
}

export function durationDays(t: Task): number {
  return dayDiff(t.start, t.end) + 1
}

export function getChildren(tasks: Task[], id: number): Task[] {
  return tasks.filter((t) => t.parentId === id)
}
export function getAllDescendants(tasks: Task[], id: number): Task[] {
  const res: Task[] = []
  const q = [...getChildren(tasks, id)]
  while (q.length) {
    const c = q.shift()!
    res.push(c)
    q.push(...getChildren(tasks, c.id))
  }
  return res
}
export function getDepth(tasks: Task[], t: Task): number {
  let d = 0
  let cur: Pick<Task, 'id' | 'parentId'> = t
  const seen = new Set<number>()
  while (cur.parentId) {
    if (seen.has(cur.id)) break
    seen.add(cur.id)
    const parentId: number = cur.parentId
    cur = tasks.find((x) => x.id === parentId) || { id: NaN, parentId: null }
    d++
  }
  return d
}
export function getEffectiveDates(tasks: Task[], t: Task): EffectiveDates {
  const children = getAllDescendants(tasks, t.id)
  if (!children.length) return { start: t.start, end: t.end }
  const allStarts = [t.start, ...children.map((c) => c.start)].map((d) => d.getTime())
  const allEnds = [t.end, ...children.map((c) => c.end)].map((d) => d.getTime())
  return { start: new Date(Math.min(...allStarts)), end: new Date(Math.max(...allEnds)) }
}
export function computeParentStatus(tasks: Task[], t: Task): Status {
  const children = getChildren(tasks, t.id)
  if (!children.length) return t.status
  const statuses = children.map((c) => computeParentStatus(tasks, c))
  if (statuses.every((s) => s === 'done')) return 'done'
  if (statuses.some((s) => s === 'bloc')) return 'bloc'
  if (statuses.some((s) => s === 'prog')) return 'prog'
  return 'pend'
}
export function getBaseStatus(tasks: Task[], t: Task): Status {
  return getChildren(tasks, t.id).length ? computeParentStatus(tasks, t) : t.status
}
export function getTaskStateMeta(tasks: Task[], t: Task, today: Date): TaskStateMeta {
  const effectiveDates = getEffectiveDates(tasks, t)
  const baseStatus = getBaseStatus(tasks, t)
  const overdue = baseStatus !== 'done' && effectiveDates.end < today
  const late =
    !overdue &&
    baseStatus !== 'done' &&
    baseStatus !== 'prog' &&
    baseStatus !== 'bloc' &&
    effectiveDates.start <= today
  return { baseStatus, effectiveDates, overdue, displayStatus: late ? 'late' : baseStatus }
}
export function isOverdue(tasks: Task[], t: Task, today: Date): boolean {
  return getTaskStateMeta(tasks, t, today).overdue
}
export function getDisplayStatus(tasks: Task[], t: Task, today: Date): Status {
  return getTaskStateMeta(tasks, t, today).displayStatus
}
export function isActiveToday(tasks: Task[], t: Task, today: Date): boolean {
  const { effectiveDates } = getTaskStateMeta(tasks, t, today)
  return effectiveDates.start <= today && effectiveDates.end >= today
}
export function isDescendantTask(tasks: Task[], taskId: number | null, maybeDescendantId: number | null): boolean {
  if (taskId == null || maybeDescendantId == null) return false
  return getAllDescendants(tasks, taskId).some((t) => t.id === maybeDescendantId)
}

export type ParentError = 'errParentMissing' | 'errParentDesc'

/** validateParentAssignment: devuelve la clave del error en vez de lanzar con texto. */
export function validateParentAssignment(tasks: Task[], taskId: number | null, parentId: number | null): ParentError | null {
  if (parentId == null) return null
  if (!tasks.some((t) => t.id === parentId)) return 'errParentMissing'
  if (taskId != null && parentId === taskId) return 'errParentDesc'
  if (taskId != null && isDescendantTask(tasks, taskId, parentId)) return 'errParentDesc'
  return null
}

export interface ParentOption {
  id: number
  label: string
}
/** getParentOptions: opciones con '·' por nivel + espacio + nombre (texto plano; React escapa). */
export function getParentOptions(tasks: Task[], excludeId: number | null = null): ParentOption[] {
  return tasks
    .filter((t) => t.id !== excludeId && !isDescendantTask(tasks, excludeId, t.id))
    .map((t) => ({ id: t.id, label: `${'·'.repeat(getDepth(tasks, t))} ${t.name}` }))
}

export function buildTreeList(tasks: Task[], filtered: Task[], collapsedIds: ReadonlySet<number>): Task[] {
  // Raíces: tareas en filtered sin padre visible, en el orden elegido (mejora A2: el original
  // las ordenaba siempre por inicio efectivo). Las hijas conservan su orden manual.
  const filteredIds = new Set(filtered.map((t) => t.id))
  const roots = filtered.filter((t) => !t.parentId || !filteredIds.has(t.parentId))
  const result: Task[] = []
  function walk(t: Task) {
    result.push(t)
    if (!collapsedIds.has(t.id)) {
      const kids = tasks.filter((c) => c.parentId === t.id && filteredIds.has(c.id))
      kids.forEach(walk)
    }
  }
  roots.forEach(walk)
  return result
}

export interface FilterOpts {
  search: string
  filter: FilterValue
  sort: SortValue
}

export function filteredTasks(tasks: Task[], opts: FilterOpts, today: Date, lang: Lang): Task[] {
  const q = opts.search.trim().toLowerCase()
  const st = opts.filter
  const mode = opts.sort
  const list = tasks.filter((t) => {
    const meta = getTaskStateMeta(tasks, t, today)
    if (q && !t.name.toLowerCase().includes(q)) return false
    if (st === 'all') return true
    if (st === 'over') return meta.overdue
    return meta.displayStatus === st
  })
  const ms = (d: Date) => d.getTime()
  return list.slice().sort((a, b) => {
    const aE = getTaskStateMeta(tasks, a, today).effectiveDates
    const bE = getTaskStateMeta(tasks, b, today).effectiveDates
    if (mode === 'startAsc') return ms(aE.start) - ms(bE.start) || ms(aE.end) - ms(bE.end)
    if (mode === 'startDesc') return ms(bE.start) - ms(aE.start) || ms(bE.end) - ms(aE.end)
    if (mode === 'endAsc') return ms(aE.end) - ms(bE.end) || ms(aE.start) - ms(bE.start)
    if (mode === 'endDesc') return ms(bE.end) - ms(aE.end) || ms(bE.start) - ms(aE.start)
    if (mode === 'status')
      return (
        statusRank[getDisplayStatus(tasks, a, today)] - statusRank[getDisplayStatus(tasks, b, today)] ||
        ms(a.start) - ms(b.start)
      )
    return a.name.localeCompare(b.name, lang, { sensitivity: 'base' })
  })
}

export function getRange(tasks: Task[], list: Task[], today: Date): EffectiveDates {
  if (!list.length) return { start: addDays(today, -7), end: addDays(today, 14) }
  const mn = new Date(Math.min(...list.map((t) => getTaskStateMeta(tasks, t, today).effectiveDates.start.getTime())))
  const mx = new Date(Math.max(...list.map((t) => getTaskStateMeta(tasks, t, today).effectiveDates.end.getTime())))
  return { start: addDays(mn, -2), end: addDays(mx, 3) }
}

export interface MonthCell {
  label: string
  span: number
}

export function buildMonthCells(start: Date, end: Date, mode: ViewMode, lang: Lang): MonthCell[] {
  const MONTHS = getMonths(lang)
  const cells: MonthCell[] = []
  if (mode === 'day') {
    let c = new Date(start)
    while (c <= end) {
      const mo = c.getMonth()
      const yr = c.getFullYear()
      let sp = 0
      let p = new Date(c)
      while (p <= end && p.getMonth() === mo && p.getFullYear() === yr) {
        sp++
        p = addDays(p, 1)
      }
      cells.push({ label: `${MONTHS[mo]} ${yr}`, span: sp })
      c = p
    }
  } else {
    const weeks = buildWeeks(start, end)
    let i = 0
    while (i < weeks.length) {
      const mo = weeks[i]!.getMonth()
      const yr = weeks[i]!.getFullYear()
      let sp = 1
      while (i + sp < weeks.length && weeks[i + sp]!.getMonth() === mo && weeks[i + sp]!.getFullYear() === yr) sp++
      cells.push({ label: `${MONTHS[mo]} ${yr}`, span: sp })
      i += sp
    }
  }
  return cells
}

/** Lunes de cada semana del rango (render 1650 y buildMonthCells). */
export function buildWeeks(start: Date, end: Date): Date[] {
  const weeks: Date[] = []
  let c = getWeekStart(start)
  while (c <= end) {
    weeks.push(new Date(c))
    c = addDays(c, 7)
  }
  return weeks
}

export interface TimelineCell {
  i: number
  span: number
  bar: boolean
  today: boolean
  weekend?: boolean
}

/** dayCols (1597-1622): celdas de una fila en vista Días. */
export function dayCells(tasks: Task[], t: Task, start: Date, total: number, today: Date): TimelineCell[] {
  const eff = getEffectiveDates(tasks, t)
  const out: TimelineCell[] = []
  let i = 0
  while (i < total) {
    const d = addDays(start, i)
    const isT = dayDiff(today, d) === 0
    const inR = d >= eff.start && d <= eff.end
    const weekend = d.getDay() === 0 || d.getDay() === 6
    if (inR && dayDiff(eff.start, d) === 0) {
      const sp = dayDiff(eff.start, eff.end) + 1
      out.push({ i, span: sp, bar: true, today: isT, weekend })
      i += sp
      continue
    }
    out.push({ i, span: 1, bar: false, today: isT, weekend })
    i++
  }
  return out
}

/** weekCols (1623-1636): celdas de una fila en vista Semanas. */
export function weekCells(tasks: Task[], t: Task, weeks: Date[], today: Date): TimelineCell[] {
  const eff = getEffectiveDates(tasks, t)
  const out: TimelineCell[] = []
  let i = 0
  while (i < weeks.length) {
    const w = weeks[i]!
    const we = addDays(w, 6)
    const isCur = today >= w && today <= we
    const ov = eff.start <= we && eff.end >= w
    if (ov) {
      let sp = 1
      while (i + sp < weeks.length) {
        const nw = weeks[i + sp]!
        const nwe = addDays(nw, 6)
        if (eff.start <= nwe && eff.end >= nw) sp++
        else break
      }
      out.push({ i, span: sp, bar: true, today: isCur })
      i += sp
      continue
    }
    out.push({ i, span: 1, bar: false, today: isCur })
    i++
  }
  return out
}

/** Opacidad de barra por nivel (dayCols/weekCols). */
export function barOpacity(depth: number): number {
  return Math.max(0.45, 1 - depth * 0.18)
}

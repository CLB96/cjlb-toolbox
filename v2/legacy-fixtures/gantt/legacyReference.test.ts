// Diferencial: la lógica nueva (src/tools/gantt/logic) contra la copia literal del original.
import { describe, expect, it } from 'vitest'
import { translate, type Lang } from '../../src/tools/gantt/i18n'
import { addDays, formatHuman, getWeekNum } from '../../src/tools/gantt/logic/dates'
import { deleteSubtree, duplicateSubtree, moveTask, normalizeTask } from '../../src/tools/gantt/logic/mutations'
import { computePie, computeStats } from '../../src/tools/gantt/logic/stats'
import {
  buildMonthCells,
  buildTreeList,
  buildWeeks,
  dayCells,
  deserializeTask,
  filteredTasks,
  getDepth,
  getParentOptions,
  getRange,
  getTaskStateMeta,
  isActiveToday,
  isOverdue,
  serializeTask,
  weekCells,
} from '../../src/tools/gantt/logic/tree'
import type { FilterValue, SortValue, StoredTask } from '../../src/tools/gantt/logic/types'
import { FIXTURES, TODAY } from './fixtures'
import { createLegacy } from './legacyReference'

const NAMES = Object.keys(FIXTURES)
const SORTS: SortValue[] = ['startAsc', 'startDesc', 'endAsc', 'endDesc', 'status', 'name']
const FILTERS: FilterValue[] = ['all', 'prog', 'done', 'pend', 'bloc', 'late', 'over']
const LANGS: Lang[] = ['es', 'en']

const tasksOf = (stored: StoredTask[]) => stored.map(deserializeTask)
const ids = (list: { id: number }[]) => list.map((t) => t.id)

function viewOf(stored: StoredTask[], opts: { search?: string; filter?: FilterValue; sort?: SortValue; lang?: Lang; collapsed?: number[] } = {}) {
  const lang = opts.lang ?? 'es'
  const tasks = tasksOf(stored)
  const filtered = filteredTasks(tasks, { search: opts.search ?? '', filter: opts.filter ?? 'all', sort: opts.sort ?? 'startAsc' }, TODAY, lang)
  const list = buildTreeList(tasks, filtered, new Set(opts.collapsed ?? []))
  const range = getRange(tasks, list.length ? list : tasks, TODAY)
  return { tasks, filtered, list, range, lang }
}

describe.each(NAMES)('fixture %s', (name) => {
  const stored = FIXTURES[name]!

  it('estado por tarea: fechas efectivas, estado base/visible, vencida, profundidad, hoy', () => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    const tasks = tasksOf(stored)
    tasks.forEach((t, i) => {
      const lt = L.tasks[i]
      const meta = getTaskStateMeta(tasks, t, TODAY)
      const lmeta = L.getTaskStateMeta(lt)
      expect(meta.effectiveDates.start.getTime()).toBe(lmeta.effectiveDates.start.getTime())
      expect(meta.effectiveDates.end.getTime()).toBe(lmeta.effectiveDates.end.getTime())
      expect([meta.baseStatus, meta.displayStatus, meta.overdue]).toEqual([lmeta.baseStatus, lmeta.displayStatus, lmeta.overdue])
      expect(getDepth(tasks, t)).toBe(L.getDepth(lt))
      expect(isActiveToday(tasks, t, TODAY)).toBe(L.isActiveToday(lt))
    })
  })

  it('filtros y órdenes: lista filtrada y orden del árbol visible (ES/EN)', () => {
    for (const lang of LANGS)
      for (const filter of FILTERS)
        for (const sort of SORTS) {
          const L = createLegacy({ tasks: stored, today: TODAY, lang, filter, sort })
          const v = viewOf(stored, { filter, sort, lang })
          expect(ids(v.filtered), `${lang}/${filter}/${sort}`).toEqual(ids(L.filteredTasks()))
          expect(ids(v.list), `${lang}/${filter}/${sort}`).toEqual(L.legacyHeader().ids)
        }
  })

  it('búsqueda sin distinguir mayúsculas', () => {
    for (const search of ['  PRUEBA ', 'a', 'xyz', 'fixture']) {
      const L = createLegacy({ tasks: stored, today: TODAY, search })
      expect(ids(viewOf(stored, { search }).filtered)).toEqual(ids(L.filteredTasks()))
    }
  })

  it('rango, etiqueta de rango, resultInfo y meses (días y semanas)', () => {
    for (const lang of LANGS) {
      const L = createLegacy({ tasks: stored, today: TODAY, lang })
      const h = L.legacyHeader()
      const v = viewOf(stored, { lang })
      expect(v.range.start.getTime()).toBe(h.start.getTime())
      expect(v.range.end.getTime()).toBe(h.end.getTime())
      expect(`${formatHuman(v.range.start, lang)} — ${formatHuman(v.range.end, lang)}`).toBe(h.range)
      const ov = v.filtered.filter((t) => isOverdue(v.tasks, t, TODAY)).length
      const td = v.filtered.filter((t) => isActiveToday(v.tasks, t, TODAY)).length
      expect(translate(lang, 'resultInfo', v.filtered.length, v.tasks.length, ov, td)).toBe(h.resultInfo)
      expect(buildMonthCells(v.range.start, v.range.end, 'day', lang)).toEqual(h.months)
      expect(buildMonthCells(v.range.start, v.range.end, 'week', lang)).toEqual(h.weekMonths)
    }
  })

  it('overview y dona', () => {
    for (const lang of LANGS) {
      const L = createLegacy({ tasks: stored, today: TODAY, lang })
      const v = viewOf(stored, { lang })
      const s = computeStats(v.tasks, v.filtered, TODAY)
      const ls = L.legacyStats()
      expect([s.visible, s.prog, s.done, s.pend, s.bloc, s.late, s.over, s.pct]).toEqual([
        ls.visible, ls.prog, ls.done, ls.pend, ls.bloc, ls.late, ls.over, ls.pct,
      ])
      expect(translate(lang, 'pctBadge', s.pct)).toBe(ls.pctBadge)
      expect(translate(lang, 'progressCopy', s.done, s.prog, s.over)).toBe(ls.progressCopy)
      expect(translate(lang, 'pulseToday', s.activeToday)).toBe(ls.pulseToday)
      expect(translate(lang, 'pulseNext', s.upcoming)).toBe(ls.pulseNext)
      expect(translate(lang, 'pulseDays', s.plannedDays)).toBe(ls.pulseDays)
      for (const sel of ['done', 'prog', 'late', 'pend', 'bloc'] as const) {
        const p = computePie(v.tasks, v.filtered, TODAY, sel)
        const lp = L.legacyPie(sel)
        expect({ ...p, taskCount: translate(lang, 'taskCount', p.total) }).toEqual(lp)
      }
    }
  })

  it('celdas del timeline por fila (días y semanas)', () => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    const v = viewOf(stored)
    const total = Math.round((v.range.end.getTime() - v.range.start.getTime()) / 86400000) + 1
    const weeks = buildWeeks(v.range.start, v.range.end)
    v.tasks.forEach((t, i) => {
      expect(dayCells(v.tasks, t, v.range.start, total, TODAY)).toEqual(L.legacyDayCells(L.tasks[i], v.range.start, total))
      expect(weekCells(v.tasks, t, weeks, TODAY)).toEqual(L.legacyWeekCells(L.tasks[i], weeks))
    })
  })

  it('opciones de padre (excluye la tarea y su descendencia)', () => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    for (const exclude of [null, ...stored.map((t) => t.id)]) {
      const html = getParentOptions(tasksOf(stored), exclude)
        .map((o) => `<option value="${o.id}">${o.label}</option>`)
        .join('')
      expect(html).toBe(L.getParentOptions(exclude, null).replace(/&amp;/g, '&'))
    }
  })

  it('serializa igual que serializeTasks', () => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    expect(tasksOf(stored).map(serializeTask)).toEqual(L.serializeTasks())
  })
})

describe('árbol', () => {
  it('padre plegado oculta su descendencia y sigue en la lista', () => {
    const stored = FIXTURES.tree!
    for (const collapsed of [[1], [3], [1, 3]]) {
      const L = createLegacy({ tasks: stored, today: TODAY, collapsed })
      expect(ids(viewOf(stored, { collapsed }).list)).toEqual(L.legacyHeader().ids)
    }
  })

  it('hija cuyo padre no pasa el filtro se muestra como raíz', () => {
    const stored = FIXTURES.tree!
    const L = createLegacy({ tasks: stored, today: TODAY, filter: 'bloc' })
    const v = viewOf(stored, { filter: 'bloc' })
    expect(ids(v.list)).toEqual(L.legacyHeader().ids)
    expect(ids(v.list)).toContain(5)
  })

  it('estado del padre: bloqueada gana a en progreso; todas completadas = completado', () => {
    const v = viewOf(FIXTURES.tree!)
    const meta = (id: number) => getTaskStateMeta(v.tasks, v.tasks.find((t) => t.id === id)!, TODAY)
    expect(meta(3).baseStatus).toBe('bloc')
    expect(meta(1).baseStatus).toBe('bloc')
    expect(meta(1).effectiveDates.end.getTime()).toBe(new Date(2026, 10, 12).getTime())
  })
})

describe('cambios de tareas', () => {
  const stored = FIXTURES.tree!

  it.each([
    ['', '2026-10-01', '2026-10-02', null, 'errName'],
    ['A', '', '2026-10-02', null, 'errDates'],
    ['A', '2026-13-45', '2026-10-02', null, 'errInvalidDates'],
    ['A', '2026-10-05', '2026-10-02', null, 'errDateOrder'],
    ['A', '2026-10-01', '2026-10-02', '99', 'errParentMissing'],
  ])('normalizeTask rechaza %j/%s/%s/%s → %s', (n, s, e, parent, key) => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    let legacyMsg = ''
    try {
      L.normalizeTask(n, s, e, 'pend', 50, '', parent)
    } catch (err) {
      legacyMsg = (err as Error).message
    }
    const r = normalizeTask(tasksOf(stored), n, s, e, 'pend', 50, '', parent)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(translate('es', r.error)).toBe(legacyMsg)
    expect(legacyMsg).toBe(translate('es', key as never))
  })

  it('normalizeTask: padre no puede ser la misma tarea ni una descendiente', () => {
    for (const parent of [3, 4, 5]) {
      const r = normalizeTask(tasksOf(stored), 'Herramental', '2026-10-26', '2026-11-12', 'pend', 3, '', parent)
      expect(r).toEqual({ ok: false, error: 'errParentDesc' })
    }
  })

  it('normalizeTask válido recorta nombre y nota igual que el original', () => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    const r = normalizeTask(tasksOf(stored), '  Nueva  ', '2026-10-01', '2026-10-03', 'prog', 8, '  nota ', '4')
    const l = L.normalizeTask('  Nueva  ', '2026-10-01', '2026-10-03', 'prog', 8, '  nota ', '4')
    expect(r.ok && r.task).toEqual(l)
  })

  it('borrar elimina la descendencia completa', () => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    L.delTask(3)
    expect(ids(deleteSubtree(tasksOf(stored), 3)!.tasks)).toEqual(ids(L.tasks))
  })

  it('duplicar copia la descendencia con ids nuevos y sufijo solo en la raíz', () => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    L.duplicateTask(3)
    const r = duplicateSubtree(tasksOf(stored), 3, 8, translate('es', 'duplicateSuffix'))!
    expect(r.tasks.map(serializeTask)).toEqual(L.serializeTasks())
    expect(r.nextId).toBe(L.nextId)
  })

  it.each([
    [4, 5, true],
    [5, 4, false],
    [2, 3, true],
    [3, 2, false],
  ])('mover %i junto a %i (después=%s) reordena como el original', (src, tgt, after) => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    expect(L.moveTask(src, tgt, after)).toBe(true)
    const r = moveTask(tasksOf(stored), src, tgt, after)
    expect(r.ok && ids(r.tasks)).toEqual(ids(L.tasks))
  })

  it.each([
    [1, 6, 'onlySubtasks'],
    [4, 2, 'onlySiblings'],
    [2, 2, 'ownDescendants'],
  ])('mover %i sobre %i se rechaza (%s)', (src, tgt, error) => {
    const L = createLegacy({ tasks: stored, today: TODAY })
    expect(L.moveTask(src, tgt, true)).toBe(false)
    expect(moveTask(tasksOf(stored), src, tgt, true)).toEqual({ ok: false, error })
  })
})

describe('fechas', () => {
  it('semana ISO y lunes de semana como el original durante dos años', () => {
    const L = createLegacy({ tasks: [], today: TODAY })
    for (let i = 0; i < 730; i += 3) {
      const d = addDays(new Date(2026, 0, 1), i)
      expect(getWeekNum(d)).toBe(L.getWeekNum(d))
    }
  })

  it('fecha legible en ES y EN', () => {
    expect(formatHuman(new Date(2026, 0, 5), 'es')).toBe(createLegacy({ tasks: [], today: TODAY }).formatHuman(new Date(2026, 0, 5)))
    expect(formatHuman(new Date(2026, 0, 5), 'en')).toBe(createLegacy({ tasks: [], today: TODAY, lang: 'en' }).formatHuman(new Date(2026, 0, 5)))
  })

  it('Gantt vacío: rango hoy-7 a hoy+14', () => {
    const v = viewOf([])
    expect(v.range.start.getTime()).toBe(addDays(TODAY, -7).getTime())
    expect(v.range.end.getTime()).toBe(addDays(TODAY, 14).getTime())
  })
})

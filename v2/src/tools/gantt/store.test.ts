import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../../../legacy-fixtures/gantt/fixtures'
import { activeTasks, createGanttStore, DEFAULT_VIEW, initialData, MAX_CHARTS, restoreInto, snapshotOf, type GanttState } from './store'

const fields = (name: string, parentId: string | null = null) => ({
  name,
  start: '2026-10-01',
  end: '2026-10-03',
  status: 'pend' as const,
  comment: '',
  parentId,
})

function withTree() {
  const api = createGanttStore()
  api.setState({ charts: [{ id: 'c1', name: 'Gantt 1', tasks: FIXTURES.tree!, nextId: 8, collapsed: [], view: { ...DEFAULT_VIEW } }] })
  return api
}

describe('Gantts por usuario', () => {
  it('empieza con un Gantt vacío (sin demo)', () => {
    const s = createGanttStore().getState()
    expect(s.charts).toEqual([{ id: 'c1', name: 'Gantt 1', tasks: [], nextId: 1, collapsed: [], view: DEFAULT_VIEW }])
    expect(s.activeId).toBe('c1')
  })

  it('crea hasta 5 Gantts, el nuevo queda activo y vacío; el sexto se rechaza', () => {
    const api = withTree()
    for (let i = 2; i <= MAX_CHARTS; i++) expect(api.getState().createChart(`G${i}`)).toEqual({ ok: true })
    expect(api.getState().charts).toHaveLength(5)
    expect(api.getState().activeId).toBe('c5')
    expect(activeTasks(api.getState())).toEqual([])
    expect(api.getState().createChart('G6')).toEqual({ ok: false, error: 'chartsMax' })
    expect(api.getState().charts).toHaveLength(5)
  })

  it('cada Gantt guarda sus tareas por separado', () => {
    const api = withTree()
    api.getState().createChart('Otro')
    api.getState().addTask(fields('Solo en Otro'))
    api.getState().selectChart('c1')
    expect(activeTasks(api.getState())).toHaveLength(7)
    api.getState().selectChart('c2')
    expect(activeTasks(api.getState()).map((t) => t.name)).toEqual(['Solo en Otro'])
  })

  it('renombrar ignora nombres vacíos', () => {
    const api = withTree()
    api.getState().renameChart('c1', '  Plan Q4 ')
    api.getState().renameChart('c1', '   ')
    expect(api.getState().charts[0]!.name).toBe('Plan Q4')
  })

  it('eliminar: no permite borrar el último; al borrar el activo pasa al primero', () => {
    const api = withTree()
    expect(api.getState().deleteChart('c1')).toEqual({ ok: false, error: 'chartsLastOne' })
    api.getState().createChart('B')
    expect(api.getState().deleteChart('c2')).toEqual({ ok: true })
    expect(api.getState().activeId).toBe('c1')
    expect(api.getState().charts.map((c) => c.id)).toEqual(['c1'])
  })
})

describe('tareas', () => {
  it('agrega con id consecutivo y reporta errores con clave del diccionario', () => {
    const api = withTree()
    expect(api.getState().addTask(fields('Nueva', '3'))).toEqual({ ok: true })
    const all = activeTasks(api.getState())
    const added = all[all.length - 1]!
    expect([added.id, added.parentId]).toEqual([8, 3])
    expect(api.getState().charts[0]!.nextId).toBe(9)
    expect(api.getState().addTask(fields(' '))).toEqual({ ok: false, error: 'errName' })
    expect(api.getState().charts[0]!.nextId).toBe(9)
  })

  it('guardar edición cambia la tarea y cierra el editor', () => {
    const api = withTree()
    api.getState().setEditing(4)
    expect(api.getState().saveEdit(4, { ...fields('Fixture A2'), status: 'done' })).toEqual({ ok: true })
    const t = activeTasks(api.getState()).find((x) => x.id === 4)!
    expect([t.name, t.status, t.parentId]).toEqual(['Fixture A2', 'done', null])
    expect(api.getState().editingId).toBeNull()
  })

  it('borrar quita la descendencia, sus plegados y la edición en curso', () => {
    const api = withTree()
    api.getState().toggleCollapse(3)
    api.getState().toggleCollapse(1)
    api.getState().setEditing(5)
    api.getState().deleteTask(3)
    expect(activeTasks(api.getState()).map((t) => t.id)).toEqual([1, 2, 6, 7])
    expect(api.getState().charts[0]!.collapsed).toEqual([1])
    expect(api.getState().editingId).toBeNull()
  })

  it('duplicar conserva el plegado en las copias', () => {
    const api = withTree()
    api.getState().toggleCollapse(3)
    api.getState().duplicateTask(3, ' (copia)')
    expect(api.getState().charts[0]!.collapsed).toEqual([3, 8])
    expect(api.getState().charts[0]!.nextId).toBe(11)
  })

  it('mover devuelve el motivo del rechazo', () => {
    const api = withTree()
    expect(api.getState().moveTask(1, 6, true)).toEqual({ ok: false, error: 'onlySubtasks' })
    expect(api.getState().moveTask(4, 5, true)).toEqual({ ok: true, error: null })
  })
})

describe('guardado', () => {
  it('el snapshot no incluye edición ni segmento de la dona', () => {
    const api = withTree()
    api.getState().setEditing(2)
    expect(Object.keys(snapshotOf(api.getState())).sort()).toEqual(['activeId', 'chartSeq', 'charts', 'prefs'])
  })

  it('los plegados se guardan y se restauran con su Gantt (mejora B1)', () => {
    const api = withTree()
    api.getState().toggleCollapse(3)
    const other = createGanttStore()
    restoreInto(other, structuredClone(snapshotOf(api.getState())))
    expect(other.getState().charts[0]!.collapsed).toEqual([3])
  })

  it('cada Gantt recuerda su búsqueda, filtro y orden; Limpiar solo afecta al activo (mejora B3)', () => {
    const api = withTree()
    api.getState().setView('sort', 'name')
    api.getState().setView('search', 'fix')
    api.getState().createChart('Otro')
    expect(api.getState().charts[1]!.view).toEqual(DEFAULT_VIEW)
    api.getState().setView('filter', 'late')
    api.getState().clearFilters()
    api.getState().selectChart('c1')
    expect(api.getState().charts[0]!.view).toEqual({ search: 'fix', filter: 'all', sort: 'name' })
  })

  it('un guardado anterior pasa buscar/filtrar/ordenar de prefs a cada Gantt', () => {
    const api = createGanttStore()
    const old = {
      charts: [{ id: 'c1', name: 'A', tasks: [], nextId: 1 }, { id: 'c2', name: 'B', tasks: [], nextId: 1 }],
      activeId: 'c1',
      chartSeq: 2,
      prefs: { ...initialData().prefs, search: 'x', filter: 'done', sort: 'name' },
    } as unknown as GanttState
    restoreInto(api, old)
    const s = api.getState()
    for (const c of s.charts) expect([c.view, c.collapsed]).toEqual([{ search: 'x', filter: 'done', sort: 'name' }, []])
    expect(s.prefs).toEqual(initialData().prefs)
  })

  it('restaurar completa preferencias, limita el ancho 80-520 y corrige el activo', () => {
    const api = createGanttStore()
    const snap = {
      charts: [{ id: 'c3', name: 'X', tasks: FIXTURES.flat!, nextId: 7 }],
      activeId: 'zz',
      chartSeq: 3,
      prefs: { viewMode: 'week', taskColWidth: 9999 },
    } as unknown as GanttState
    restoreInto(api, snap)
    const s = api.getState()
    expect(s.activeId).toBe('c3')
    expect(s.prefs).toEqual({ ...initialData().prefs, viewMode: 'week', taskColWidth: 520 })
    expect(s.charts[0]!.collapsed).toEqual([])
  })

  it('restaurar sin Gantts vuelve a un Gantt vacío', () => {
    const api = createGanttStore()
    restoreInto(api, { charts: [], activeId: 'c1', chartSeq: 0, prefs: initialData().prefs })
    expect(api.getState().charts).toEqual(initialData().charts)
  })

  it('un Gantt sin tareas se guarda y se restaura vacío', () => {
    const api = withTree()
    for (const id of [1, 6, 7]) api.getState().deleteTask(id)
    const other = createGanttStore()
    restoreInto(other, structuredClone(snapshotOf(api.getState())))
    expect(activeTasks(other.getState())).toEqual([])
  })
})

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { clear, createStore } from 'idb-keyval'
import { FIXTURES } from '../../../legacy-fixtures/gantt/fixtures'
import { __resetI18nForTests, useI18n } from '../../i18n/useI18n'
import { saveSnapshot } from '../../persistence/snapshotStore'
import { UidProvider } from '../../persistence/uidContext'
import { useToasts } from '../../ui/toastStore'
import GanttTool from './GanttTool'
import { initialData, type GanttState } from './store'

function LangGrab() {
  useI18n()
  return null
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 30, 10, 0, 0))
  await clear(createStore('cjlb-toolbox', 'snapshots'))
  localStorage.clear()
  __resetI18nForTests()
  useToasts.setState({ toasts: [] })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const renderTool = () =>
  render(
    <UidProvider uid="u1">
      <LangGrab />
      <GanttTool toolId="gantt" active />
    </UidProvider>,
  )

async function seed(tasks = FIXTURES.tree!, extra: Partial<GanttState> = {}) {
  const base = initialData()
  await saveSnapshot('u1', 'gantt', { ...base, charts: [{ id: 'c1', name: 'Plan', tasks, nextId: 50 }], ...extra })
}

/** Celdas de 32 px y barras de 100 px (jsdom no calcula layout). */
function mockRects() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const w = this.tagName === 'TD' ? 32 : 100
    return { left: 0, top: 0, right: w, bottom: 28, width: w, height: 28, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
  })
}

const toasts = () => useToasts.getState().toasts.map((t) => t.message)
const rows = () => screen.getAllByRole('row').filter((r) => r.hasAttribute('data-id'))
const rowNames = () => rows().map((r) => r.querySelector('.gt-task-name')!.textContent)
const ready = () => waitFor(() => expect(screen.getByLabelText('Nombre de nueva tarea')).toBeEnabled())

describe('GanttTool', () => {
  it('un Gantt nuevo está vacío: sin demo, tabla vacía y conteos en cero', async () => {
    renderTool()
    await ready()
    expect(screen.getByText('No hay tareas.')).toBeInTheDocument()
    expect(screen.getByText('Hoy · 30 Oct 2026')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 0 de 0 tareas · 0 vencidas · 0 tocando hoy')).toBeInTheDocument()
    expect(screen.getByText('0 tareas', { selector: '.gt-ph .gt-chip' })).toBeInTheDocument()
  })

  it('agrega una tarea con Enter y limpia el formulario', async () => {
    renderTool()
    await ready()
    const name = screen.getByLabelText('Nombre de nueva tarea')
    fireEvent.change(name, { target: { value: 'Prueba piloto' } })
    fireEvent.change(screen.getByLabelText('Comentario'), { target: { value: 'nota' } })
    fireEvent.keyDown(name, { key: 'Enter' })
    expect(rowNames()).toEqual(['Prueba piloto'])
    expect(screen.getByText('2026-10-30 → 2026-11-04 · 6d')).toBeInTheDocument()
    expect(toasts()).toContain('Tarea agregada ✓')
    expect(name).toHaveValue('')
    expect(screen.getByLabelText('Comentario')).toHaveValue('')
  })

  it('rechaza nombre vacío y fechas al revés con los textos del original', async () => {
    renderTool()
    await ready()
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar' }))
    fireEvent.change(screen.getByLabelText('Nombre de nueva tarea'), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText('Fecha de fin'), { target: { value: '2026-10-01' } })
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar' }))
    expect(toasts()).toEqual(['Escribe un nombre.', 'La fecha de fin no puede ser anterior al inicio.'])
    expect(rows()).toHaveLength(0)
  })

  it('restaura el árbol, ordena raíces por inicio efectivo y pliega hijos', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    expect(rowNames()).toEqual(['Proyecto línea 3', '↳ Moldes', '↳ Herramental', '↳ Fixture A', '↳ Fixture B', 'Zeta independiente', 'alfa independiente'])
    const herramental = rows()[2]!
    fireEvent.click(within(herramental).getByRole('button', { name: '▼' }))
    expect(rowNames()).not.toContain('↳ Fixture A')
    fireEvent.click(within(rows()[2]!).getByRole('button', { name: '▶' }))
    expect(rowNames()).toContain('↳ Fixture A')
  })

  it('edita en línea y guarda', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    fireEvent.click(screen.getByRole('button', { name: '✎ Zeta independiente' }))
    const input = screen.getByDisplayValue('Zeta independiente')
    fireEvent.change(input, { target: { value: 'Zeta editada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(rowNames()).toContain('Zeta editada')
    expect(toasts()).toContain('Cambios guardados ✓')
  })

  it('Escape cancela la edición', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    fireEvent.click(screen.getByRole('button', { name: '✎ Moldes' }))
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
  })

  it('borrar pide confirmación y elimina la descendencia', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    fireEvent.click(screen.getByRole('button', { name: '× Herramental' }))
    expect(rows()).toHaveLength(7)
    fireEvent.click(screen.getByRole('button', { name: '× Herramental' }))
    expect(confirm).toHaveBeenCalledWith('¿Eliminar tarea y sus subtareas?')
    expect(rowNames()).toEqual(['Proyecto línea 3', '↳ Moldes', 'Zeta independiente', 'alfa independiente'])
    expect(toasts()).toContain('Tarea eliminada.')
  })

  it('duplicar agrega la copia con sufijo', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    fireEvent.click(screen.getByRole('button', { name: '⧉ Zeta independiente' }))
    expect(rowNames()).toContain('Zeta independiente (copia)')
    expect(toasts()).toContain('Tarea duplicada ✓')
  })

  it('filtro Vencidas y Limpiar', async () => {
    await seed(FIXTURES.overdue)
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target: { value: 'over' } })
    expect(screen.getByText('Mostrando 4 de 7 tareas · 4 vencidas · 0 tocando hoy')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(screen.getByText(/^Mostrando 7 de 7 tareas/)).toBeInTheDocument()
  })

  it('vista Semanas muestra semanas ISO', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    fireEvent.click(screen.getByRole('button', { name: 'Semanas' }))
    expect(screen.getByRole('button', { name: 'Semanas' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('columnheader', { name: /W44/ })).toHaveClass('gt-today-head')
  })

  it('en inglés traduce como el original y el botón dice "+ Add"', async () => {
    localStorage.setItem('cjlb.lang', 'en')
    __resetI18nForTests()
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    expect(screen.getByText('Visible tasks')).toBeInTheDocument()
    expect(screen.getByText('Today · 30 Oct 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument()
    expect(screen.getByText('New task')).toBeInTheDocument()
  })

  it('clic en un segmento de la dona cambia el estado seleccionado', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    const card = document.querySelector('.gt-legend-card') as HTMLElement
    expect(within(card).getByText('Completado')).toBeInTheDocument()
    fireEvent.click(document.querySelector('path[data-key="bloc"]')!)
    expect(within(card).getByText('Bloqueado')).toBeInTheDocument()
    expect(within(card).getByText('Detenidas por riesgo o dependencia externa.')).toBeInTheDocument()
  })

  it('selector: crear un Gantt nuevo vacío, renombrar y eliminar', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    fireEvent.click(screen.getByRole('button', { name: 'Gantt: Plan' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Nuevo Gantt/ }))
    const dialog = screen.getByRole('dialog', { name: 'Nuevo Gantt' })
    fireEvent.change(within(dialog).getByLabelText('Nombre del Gantt'), { target: { value: 'Moldes 2027' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('No hay tareas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gantt: Moldes 2027' })).toHaveTextContent('2/5')

    fireEvent.click(screen.getByRole('button', { name: 'Gantt: Moldes 2027' }))
    fireEvent.click(screen.getByRole('button', { name: 'Renombrar Moldes 2027' }))
    fireEvent.change(screen.getByLabelText('Nombre del Gantt'), { target: { value: 'Moldes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByRole('button', { name: 'Gantt: Moldes' })).toBeInTheDocument()

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Gantt: Moldes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Moldes' }))
    expect(screen.getByRole('button', { name: 'Gantt: Plan' })).toHaveTextContent('1/5')
    expect(rows()).toHaveLength(7)
  })

  it('arrastrar el borde derecho alarga la tarea y "Deshacer" la restaura', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    mockRects()
    const bar = document.querySelector('[data-bar-id="6"]') as HTMLElement
    fireEvent.mouseDown(bar, { button: 0, clientX: 96 })
    fireEvent.mouseMove(document, { clientX: 160 })
    expect(screen.getByText('+2 días')).toBeInTheDocument()
    fireEvent.mouseUp(document, { clientX: 160 })
    expect(screen.getByText('2026-10-21 → 2026-10-25 · 5d')).toBeInTheDocument()
    expect(screen.getByText('Duración +2d —')).toBeInTheDocument()
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Deshacer ↩' })))
    expect(screen.getByText('2026-10-21 → 2026-10-23 · 3d')).toBeInTheDocument()
    expect(toasts()).toContain('Deshecho ↩')
  })

  it('Escape durante el arrastre cancela sin cambiar fechas', async () => {
    await seed()
    renderTool()
    await waitFor(() => expect(rows()).toHaveLength(7))
    mockRects()
    const bar = document.querySelector('[data-bar-id="6"]') as HTMLElement
    fireEvent.mouseDown(bar, { button: 0, clientX: 0 })
    fireEvent.mouseMove(document, { clientX: -64 })
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.mouseUp(document, { clientX: -64 })
    expect(screen.getByText('2026-10-21 → 2026-10-23 · 3d')).toBeInTheDocument()
    expect(screen.queryByText(/Deshacer/)).toBeNull()
  })

  it('"hoy" se recalcula al cambiar de día (mejora A4)', async () => {
    renderTool()
    await ready()
    vi.setSystemTime(new Date(2026, 9, 31, 0, 5, 0))
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(screen.getByText('Hoy · 31 Oct 2026')).toBeInTheDocument()
  })

  it('Ctrl+K enfoca la búsqueda', async () => {
    renderTool()
    await ready()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.getByLabelText('Buscar tarea')).toHaveFocus()
  })
})

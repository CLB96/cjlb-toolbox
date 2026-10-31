import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { FIXTURES, TODAY } from '../../../../legacy-fixtures/gantt/fixtures'
import { dayDiff } from '../logic/dates'
import { buildTreeList, buildWeeks, deserializeTask, filteredTasks, getRange } from '../logic/tree'
import type { StoredTask } from '../logic/types'
import type { GanttView } from '../useGanttView'
import { buildExportModel } from './exportModel'
import { fillWorkbook } from './exportExcel'

function viewOf(stored: StoredTask[]): GanttView {
  const tasks = stored.map(deserializeTask)
  const filtered = filteredTasks(tasks, { search: '', filter: 'all', sort: 'startAsc' }, TODAY, 'es')
  const list = buildTreeList(tasks, filtered, new Set())
  const range = getRange(tasks, list, TODAY)
  return { today: TODAY, tasks, filtered, list, range, totalDays: dayDiff(range.start, range.end) + 1, weeks: buildWeeks(range.start, range.end) } as GanttView
}

function book(stored: StoredTask[], dark = true, lang: 'es' | 'en' = 'es') {
  const wb = new ExcelJS.Workbook()
  const model = buildExportModel(viewOf(stored), lang)
  fillWorkbook(wb, model, dark, lang)
  return { ws: wb.getWorksheet('Gantt')!, model }
}

describe('Excel', () => {
  it('título, columnas, meses combinados y días con hoy resaltado', () => {
    const { ws, model } = book(FIXTURES.overdue!)
    expect(ws.getCell('A1').value).toBe('GANTT TRACKER — R&D Process Engineering')
    expect([ws.getCell('A2').value, ws.getCell('B2').value, ws.getCell('C2').value]).toEqual(['Tarea', 'Estado', 'Comentario'])
    expect(ws.getCell(2, 4).value).toBe(model.months[0]!.label)
    const todayIdx = model.days.findIndex((d) => d.isToday)
    const todayCell = ws.getCell(3, 4 + todayIdx)
    expect(todayCell.value).toBe(30)
    expect((todayCell.fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFEF5B67')
    expect(ws.views[0]).toMatchObject({ state: 'frozen', xSplit: 3, ySplit: 3 })
  })

  it('filas: prefijo de subtarea, ⚠ vencida, 💬 comentario, estado visible y barra con fechas efectivas', () => {
    const { ws, model } = book(FIXTURES.tree!)
    const names = model.rows.map((_, i) => ws.getCell(4 + i, 1).value)
    expect(names).toEqual(['Proyecto línea 3', '↳ Moldes', '↳ Herramental', '↳ Fixture A', '↳ Fixture B', 'Zeta independiente', 'alfa independiente'])
    expect(ws.getCell(4, 2).value).toBe('Bloqueado')
    const parent = model.rows[0]!
    const first = model.days.findIndex((d) => d.date.getTime() === parent.eff.start.getTime())
    const last = model.days.findIndex((d) => d.date.getTime() === parent.eff.end.getTime())
    expect((ws.getCell(4, 4 + first).fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFEF5B67')
    expect((ws.getCell(4, 4 + last).fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFEF5B67')
    const { ws: ws2 } = book([{ id: 1, name: 'Vieja', start: '2026-10-01', end: '2026-10-02', status: 'pend', comment: 'ojo', parentId: null }])
    expect(ws2.getCell('A4').value).toBe('Vieja ⚠ 💬')
    expect(ws2.getCell('C4').value).toBe('ojo')
  })

  it('lista desplegable de estados y formato condicional por fila (EN)', () => {
    const { ws } = book(FIXTURES.flat!, false, 'en')
    expect(ws.getCell('B4').dataValidation).toMatchObject({
      type: 'list',
      formulae: ['"In progress,Completed,Pending,Blocked,Late"'],
    })
    const refs = (ws as unknown as { conditionalFormattings: { ref: string }[] }).conditionalFormattings.map((c) => c.ref)
    expect(refs.filter((r) => r === 'B4')).toHaveLength(5)
    expect(ws.getCell('A1').value).toBe('GANTT TRACKER — R&D Process Engineering')
  })
})

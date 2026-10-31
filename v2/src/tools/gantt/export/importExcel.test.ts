import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { FIXTURES, TODAY } from '../../../../legacy-fixtures/gantt/fixtures'
import { dayDiff, fmtDate } from '../logic/dates'
import { buildTreeList, buildWeeks, deserializeTask, filteredTasks, getEffectiveDates, getRange } from '../logic/tree'
import type { StoredTask } from '../logic/types'
import type { GanttView } from '../useGanttView'
import { fillWorkbook } from './exportExcel'
import { buildExportModel } from './exportModel'
import { readGanttWorkbook } from './importExcel'

/** Exporta como el Gantt, escribe el .xlsx y lo vuelve a leer. */
async function roundTrip(stored: StoredTask[], lang: 'es' | 'en', dark: boolean) {
  const tasks = stored.map(deserializeTask)
  const filtered = filteredTasks(tasks, { search: '', filter: 'all', sort: 'startAsc' }, TODAY, lang)
  const list = buildTreeList(tasks, filtered, new Set())
  const range = getRange(tasks, list, TODAY)
  const view = { today: TODAY, tasks, filtered, list, range, totalDays: dayDiff(range.start, range.end) + 1, weeks: buildWeeks(range.start, range.end) } as GanttView
  const wb = new ExcelJS.Workbook()
  fillWorkbook(wb, buildExportModel(view, lang), dark, lang)
  const back = new ExcelJS.Workbook()
  await back.xlsx.load(await wb.xlsx.writeBuffer())
  return { imported: readGanttWorkbook(back)!, tasks, list }
}

describe('importar Excel (mejora B4)', () => {
  it('recupera nombres, jerarquía, fechas efectivas, estado y comentario (ES, tema Noche)', async () => {
    const { imported, tasks, list } = await roundTrip(FIXTURES.tree!, 'es', true)
    expect(imported.tasks.map((t) => t.name)).toEqual(list.map((t) => t.name))
    expect(imported.nextId).toBe(list.length + 1)
    const byName = new Map(imported.tasks.map((t) => [t.name, t]))
    for (const src of list) {
      const got = byName.get(src.name)!
      const eff = getEffectiveDates(tasks, src)
      expect([got.start, got.end], src.name).toEqual([fmtDate(eff.start), fmtDate(eff.end)])
      expect(got.comment).toBe(src.comment)
      const parent = tasks.find((t) => t.id === src.parentId)
      expect(parent ? imported.tasks.find((t) => t.id === got.parentId)?.name : null, src.name).toBe(parent?.name ?? null)
    }
    const leaf = list.find((t) => t.name === 'Fixture A')!
    expect(byName.get('Fixture A')!.status).toBe(leaf.status)
  })

  it('lee un Excel en inglés y tema Día, y quita ⚠ y 💬 del nombre', async () => {
    const stored: StoredTask[] = [
      { id: 1, name: 'Old one', start: '2026-10-01', end: '2026-10-02', status: 'prog', comment: 'note', parentId: null },
      { id: 2, name: 'Done', start: '2026-10-28', end: '2026-11-03', status: 'done', comment: '', parentId: null },
    ]
    const { imported } = await roundTrip(stored, 'en', false)
    expect(imported.tasks).toEqual([
      { id: 1, name: 'Old one', start: '2026-10-01', end: '2026-10-02', status: 'prog', comment: 'note', parentId: null },
      { id: 2, name: 'Done', start: '2026-10-28', end: '2026-11-03', status: 'done', comment: '', parentId: null },
    ])
  })

  it('un libro sin el formato del Gantt no se importa', () => {
    const wb = new ExcelJS.Workbook()
    wb.addWorksheet('Hoja1').getCell('A2').value = 'Otra cosa'
    expect(readGanttWorkbook(wb)).toBeNull()
  })
})

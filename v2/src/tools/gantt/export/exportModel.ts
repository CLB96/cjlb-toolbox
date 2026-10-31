// Filas comunes del Excel y el PNG: la lista visible (buildTreeList(filteredTasks())) con lo que cada
// exportación necesita por tarea.
import { addDays, dayDiff, fmtDate, getMonths, isWeekend } from '../logic/dates'
import { getChildren, getDepth, getDisplayStatus, getEffectiveDates, isOverdue } from '../logic/tree'
import type { EffectiveDates, Status, Task } from '../logic/types'
import type { Lang } from '../i18n'
import type { GanttView } from '../useGanttView'

export interface ExportRow {
  task: Task
  depth: number
  hasKids: boolean
  status: Status
  overdue: boolean
  eff: EffectiveDates
}

export interface ExportDay {
  date: Date
  isToday: boolean
  isWeekend: boolean
}

export interface ExportModel {
  rows: ExportRow[]
  start: Date
  end: Date
  days: ExportDay[]
  months: { label: string; span: number }[]
  today: Date
  fileDate: string
}

export function buildExportModel(view: GanttView, lang: Lang): ExportModel {
  const { tasks, list, range, today, totalDays } = view
  const rows = list.map((task) => ({
    task,
    depth: getDepth(tasks, task),
    hasKids: getChildren(tasks, task.id).length > 0,
    status: getDisplayStatus(tasks, task, today),
    overdue: isOverdue(tasks, task, today),
    eff: getEffectiveDates(tasks, task),
  }))
  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = addDays(range.start, i)
    return { date, isToday: dayDiff(today, date) === 0, isWeekend: isWeekend(date) }
  })
  // meses por días (buildExcel y exportPNG recorren los días, no buildMonthCells)
  const MONTHS = getMonths(lang)
  const months: { label: string; span: number }[] = []
  let cur = new Date(range.start)
  while (cur <= range.end) {
    const mo = cur.getMonth()
    const yr = cur.getFullYear()
    let sp = 0
    let pr = new Date(cur)
    while (pr <= range.end && pr.getMonth() === mo && pr.getFullYear() === yr) {
      sp++
      pr = addDays(pr, 1)
    }
    months.push({ label: `${MONTHS[mo]} ${yr}`, span: sp })
    cur = pr
  }
  return { rows, start: range.start, end: range.end, days, months, today, fileDate: fmtDate(today) }
}

/** Descarga un Blob con el nombre dado. */
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 300)
}

export const isDarkTheme = (): boolean => document.documentElement.dataset.theme !== 'light'

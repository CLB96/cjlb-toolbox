// Mejora B4: lee el Excel que exporta el Gantt (original o v2, ES o EN) para traer sus tareas.
// Del archivo se recuperan nombre, nivel (sangría), estado, comentario y fechas (celdas con color de barra).
import type { Cell, Workbook, Worksheet } from 'exceljs'
import { translate, type Lang } from '../i18n'
import { addDays, fmtDate, getMonths } from '../logic/dates'
import type { Status, StoredTask } from '../logic/types'

export interface ImportedGantt {
  tasks: StoredTask[]
  nextId: number
}

const FIRST_DAY_COL = 4
const FIRST_TASK_ROW = 4
/** Colores de barra de buildExcel (iguales en tema Noche y Día). */
const BAR_COLORS = new Set(['FF4F8CFF', 'FF43B36B', 'FF8A94A6', 'FFEF5B67', 'FFF59E0B'])
const STATUSES: Status[] = ['prog', 'done', 'pend', 'bloc', 'late']
const STATUS_KEYS = { prog: 'statusProg', done: 'statusDone', pend: 'statusPend', bloc: 'statusBloc', late: 'statusLate' } as const
const LANGS: Lang[] = ['es', 'en']
const SUFFIXES = [' 💬', ' ⚠']
const SUBTASK_PREFIX = '↳ '

const text = (c: Cell) => (c.text ?? '').trim()

function statusOf(label: string): Status {
  for (const lang of LANGS) for (const s of STATUSES) if (translate(lang, STATUS_KEYS[s]) === label) return s
  return 'pend'
}

/** "Oct 2026" + día de la primera columna → fecha del primer día del timeline. */
function firstDay(ws: Worksheet): Date | null {
  const [mon, yr] = text(ws.getCell(2, FIRST_DAY_COL)).split(' ')
  const day = Number(ws.getCell(3, FIRST_DAY_COL).value)
  const month = LANGS.map((l) => getMonths(l).indexOf(mon ?? '')).find((i) => i >= 0)
  const year = Number(yr)
  if (month === undefined || !Number.isInteger(year) || !Number.isInteger(day) || day < 1) return null
  return new Date(year, month, day)
}

function cleanName(raw: string): string {
  let name = raw.startsWith(SUBTASK_PREFIX) ? raw.slice(SUBTASK_PREFIX.length) : raw
  for (const s of SUFFIXES) if (name.endsWith(s)) name = name.slice(0, -s.length)
  return name.trim()
}

function isBar(c: Cell): boolean {
  const fill = c.fill
  return fill?.type === 'pattern' && BAR_COLORS.has(String(fill.fgColor?.argb ?? '').toUpperCase())
}

/** Convierte la hoja "Gantt" en tareas; null si no tiene el formato del exporte. */
export function readGanttWorkbook(wb: Workbook): ImportedGantt | null {
  const ws = wb.getWorksheet('Gantt') ?? wb.worksheets[0]
  if (!ws) return null
  const header = text(ws.getCell(2, 1))
  if (!LANGS.some((l) => translate(l, 'excelColTask') === header)) return null
  const start = firstDay(ws)
  if (!start) return null
  let days = 0
  while (typeof ws.getCell(3, FIRST_DAY_COL + days).value === 'number') days++

  const tasks: StoredTask[] = []
  const lastAtDepth: number[] = []
  for (let r = FIRST_TASK_ROW; r <= ws.rowCount; r++) {
    const nameCell = ws.getCell(r, 1)
    const raw = text(nameCell)
    if (!raw) continue
    const bars: number[] = []
    for (let i = 0; i < days; i++) if (isBar(ws.getCell(r, FIRST_DAY_COL + i))) bars.push(i)
    if (!bars.length) continue
    const indent = nameCell.alignment?.indent
    const depth = Number.isInteger(indent) ? (indent as number) : raw.startsWith(SUBTASK_PREFIX) ? 1 : 0
    const id = tasks.length + 1
    const parentId = depth > 0 ? (lastAtDepth[Math.min(depth, lastAtDepth.length) - 1] ?? null) : null
    lastAtDepth.length = Math.min(depth, lastAtDepth.length)
    lastAtDepth.push(id)
    tasks.push({
      id,
      name: cleanName(raw),
      start: fmtDate(addDays(start, bars[0]!)),
      end: fmtDate(addDays(start, bars[bars.length - 1]!)),
      status: statusOf(text(ws.getCell(r, 2))),
      comment: text(ws.getCell(r, 3)),
      parentId,
    })
  }
  return tasks.length ? { tasks, nextId: tasks.length + 1 } : null
}

/** Lee un .xlsx elegido por el usuario. */
export async function importGanttExcel(file: File): Promise<ImportedGantt | null> {
  try {
    const { default: ExcelJS } = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await file.arrayBuffer())
    return readGanttWorkbook(wb)
  } catch {
    return null
  }
}

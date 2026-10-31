// buildExcel del original (gantt/index.html 1830-2022), con ExcelJS incluido en la app (sin CDN).
// Se genera lo que el original descarga en la práctica: su parche de formato condicional por ZIP interno
// nunca se aplica (ExcelJS no expone wb._zip), así que queda la versión de respaldo (mejora A10).
import type { Borders, DataValidation, Fill, Workbook } from 'exceljs'
import { translate, type Lang } from '../i18n'
import { addDays } from '../logic/dates'
import type { Status } from '../logic/types'
import { buildExportModel, downloadBlob, type ExportModel } from './exportModel'
import type { GanttView } from '../useGanttView'

type Pair = [string, string]
interface Palette {
  titleBg: string; titleFg: string; monthBg: string; monthFg: string; dayBg: string; dayFg: string
  todayBg: string; todayFg: string; rowA: string; rowB: string; rowFg: string; border: string; weekend: string
  barProg: string; barDone: string; barPend: string; barBloc: string; barLate: string
  badgeProg: Pair; badgeDone: Pair; badgePend: Pair; badgeBloc: Pair; badgeLate: Pair; badgeOver: Pair
}

const DARK: Palette = {titleBg:'FF0F172A',titleFg:'FFEDF3FF',monthBg:'FF131E35',monthFg:'FF72A8FF',dayBg:'FF1A2742',dayFg:'FFA9B6CD',todayBg:'FFEF5B67',todayFg:'FFFFFFFF',rowA:'FF0F172A',rowB:'FF131E35',rowFg:'FFEDF3FF',border:'FF22304D',weekend:'FF0B1525',barProg:'FF4F8CFF',barDone:'FF43B36B',barPend:'FF8A94A6',barBloc:'FFEF5B67',barLate:'FFF59E0B',badgeProg:['FF11284C','FFA8CBFF'],badgeDone:['FF10281A','FF9AE5B1'],badgePend:['FF1A2437','FFC0CAD8'],badgeBloc:['FF34131A','FFFFB0BA'],badgeLate:['FF322712','FFFFD78F'],badgeOver:['FF322712','FFFFD78F']}
const LIGHT: Palette = {titleBg:'FF142033',titleFg:'FFFFFFFF',monthBg:'FF1E2E45',monthFg:'FFFFFFFF',dayBg:'FFEEF3F9',dayFg:'FF5F6B7D',todayBg:'FFEF5B67',todayFg:'FFFFFFFF',rowA:'FFFFFFFF',rowB:'FFF4F7FB',rowFg:'FF142033',border:'FFD8E4F0',weekend:'FFF0F4FA',barProg:'FF4F8CFF',barDone:'FF43B36B',barPend:'FF8A94A6',barBloc:'FFEF5B67',barLate:'FFF59E0B',badgeProg:['FFE9F1FF','FF235FD2'],badgeDone:['FFEAF9EF','FF217543'],badgePend:['FFEEF1F6','FF5D6778'],badgeBloc:['FFFFECEE','FFB82C3F'],badgeLate:['FFFFF5DF','FF9A6800'],badgeOver:['FFFFF5DF','FF9A6800']}

const f = (a: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: a } })
const th = (a: string) => ({ style: 'thin' as const, color: { argb: a } })
const bord = (a: string): Partial<Borders> => ({ top: th(a), bottom: th(a), left: th(a), right: th(a) })

/** Llena el libro como buildExcel (sin el parche ZIP). Exportado para las pruebas. */
export function fillWorkbook(wb: Workbook, m: ExportModel, isDark: boolean, lang: Lang): void {
  const T = (k: Parameters<typeof translate>[1]) => translate(lang, k)
  const P = isDark ? DARK : LIGHT
  wb.creator = 'Gantt Tracker R&D'
  wb.created = new Date()
  const ws = wb.addWorksheet('Gantt', { views: [{ showGridLines: false }] })
  const total = m.days.length
  ws.getColumn(1).width = 36
  ws.getColumn(2).width = 18
  ws.getColumn(3).width = 28
  for (let i = 0; i < total; i++) ws.getColumn(4 + i).width = 4.2

  const r1 = ws.addRow([])
  r1.height = 28
  ws.mergeCells(1, 1, 1, 3 + total)
  const tc = r1.getCell(1)
  tc.value = T('excelTitle')
  tc.fill = f(P.titleBg)
  tc.font = { name: 'Calibri', size: 13, bold: true, color: { argb: P.titleFg } }
  tc.alignment = { horizontal: 'left', vertical: 'middle' }

  const r2 = ws.addRow([])
  r2.height = 20
  ;[T('excelColTask'), T('excelColStatus'), T('excelColComment')].forEach((v, i) => {
    const c = r2.getCell(i + 1)
    c.value = v
    c.fill = f(P.monthBg)
    c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: P.monthFg } }
    c.alignment = { horizontal: i === 1 ? 'center' : 'left', vertical: 'middle' }
    c.border = bord(P.border)
  })
  let col = 4
  for (const mo of m.months) {
    const c = r2.getCell(col)
    c.value = mo.label
    c.fill = f(P.monthBg)
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: P.monthFg } }
    c.alignment = { horizontal: 'center', vertical: 'middle' }
    c.border = bord(P.border)
    if (mo.span > 1) ws.mergeCells(2, col, 2, col + mo.span - 1)
    col += mo.span
  }

  const r3 = ws.addRow([])
  r3.height = 22
  ;[1, 2, 3].forEach((i) => {
    r3.getCell(i).fill = f(P.dayBg)
    r3.getCell(i).border = bord(P.border)
  })
  m.days.forEach((d, i) => {
    const isT = d.isToday
    const c = r3.getCell(4 + i)
    c.value = d.date.getDate()
    c.fill = f(isT ? P.todayBg : d.isWeekend ? P.weekend : P.dayBg)
    c.font = { name: 'Calibri', size: 9, bold: isT, color: { argb: isT ? P.todayFg : P.dayFg } }
    c.alignment = { horizontal: 'center', vertical: 'middle' }
    c.border = isT
      ? { top: th(P.todayBg), bottom: th(P.todayBg), left: { style: 'medium', color: { argb: P.todayBg } }, right: { style: 'medium', color: { argb: P.todayBg } } }
      : bord(P.border)
  })

  const barMap: Record<Status, string> = { prog: P.barProg, done: P.barDone, pend: P.barPend, bloc: P.barBloc, late: P.barLate }
  const statusText: Record<Status, string> = { prog: T('statusProg'), done: T('statusDone'), pend: T('statusPend'), bloc: T('statusBloc'), late: T('statusLate') }
  const badgeMap: Record<Status, Pair> = { prog: P.badgeProg, done: P.badgeDone, pend: P.badgePend, bloc: P.badgeBloc, late: P.badgeLate }

  m.rows.forEach((r, idx) => {
    const t = r.task
    const row = ws.addRow([])
    row.height = 22
    const ds = r.status
    const depth = r.depth
    const over = r.overdue
    const rowBg = idx % 2 === 0 ? P.rowA : P.rowB
    const bc = over ? P.badgeOver : badgeMap[ds] || badgeMap.pend
    const prefix = depth > 0 ? '↳ ' : ''
    const nc = row.getCell(1)
    nc.value = prefix + t.name + (over ? ' ⚠' : '') + (t.comment ? ' 💬' : '')
    nc.fill = f(rowBg)
    nc.font = { name: 'Calibri', size: 11, italic: over, color: { argb: P.rowFg } }
    nc.alignment = { horizontal: 'left', vertical: 'middle', indent: depth }
    nc.border = bord(P.border)
    const sc = row.getCell(2)
    sc.value = statusText[ds] || statusText[t.status]
    sc.fill = f(bc[0])
    sc.font = { name: 'Calibri', size: 10, bold: true, color: { argb: bc[1] } }
    sc.alignment = { horizontal: 'center', vertical: 'middle' }
    sc.border = bord(P.border)
    const cc = row.getCell(3)
    cc.value = t.comment || ''
    cc.fill = f(rowBg)
    cc.font = { name: 'Calibri', size: 10, color: { argb: P.rowFg } }
    cc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    cc.border = bord(P.border)
    sc.dataValidation = {
      type: 'list',
      allowBlank: false,
      showDropDown: false,
      formulae: [`"${T('statusProg')},${T('statusDone')},${T('statusPend')},${T('statusBloc')},${T('statusLate')}"`],
      showErrorMessage: false,
      // showDropDown no está en los tipos de ExcelJS, pero el original lo pasa
    } as DataValidation
    m.days.forEach((d, i) => {
      const inR = d.date >= r.eff.start && d.date <= r.eff.end
      const c = row.getCell(4 + i)
      c.fill = f(inR ? barMap[ds] || barMap.pend : d.isWeekend ? P.weekend : rowBg)
      c.border = d.isToday
        ? { top: th(P.border), bottom: th(P.border), left: { style: 'medium', color: { argb: P.todayBg } }, right: { style: 'medium', color: { argb: P.todayBg } } }
        : bord(P.border)
    })

    // Formato condicional del estado
    const rowNum = 4 + idx
    ;[
      { txt: T('statusProg'), bg: P.badgeProg[0], fg: P.badgeProg[1] },
      { txt: T('statusDone'), bg: P.badgeDone[0], fg: P.badgeDone[1] },
      { txt: T('statusPend'), bg: P.badgePend[0], fg: P.badgePend[1] },
      { txt: T('statusBloc'), bg: P.badgeBloc[0], fg: P.badgeBloc[1] },
      { txt: T('statusLate'), bg: P.badgeLate[0], fg: P.badgeLate[1] },
    ].forEach(({ txt, bg, fg }, pri) => {
      ws.addConditionalFormatting({
        ref: `B${rowNum}`,
        rules: [
          {
            type: 'expression',
            priority: pri + 1 + idx * 10,
            formulae: [`B${rowNum}="${txt}"`],
            style: {
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg }, bgColor: { argb: bg } },
              font: { name: 'Calibri', size: 10, bold: true, color: { argb: fg } },
            },
          },
        ],
      })
    })

    // Formato condicional de barras: fechas propias y sin "Tarde" (como el original, mejora A10)
    for (let i = 0; i < total; i++) {
      const d = addDays(m.start, i)
      if (d < t.start || d > t.end) continue
      const cl = ws.getColumn(4 + i).letter
      ;[
        { txt: T('statusProg'), argb: P.barProg },
        { txt: T('statusDone'), argb: P.barDone },
        { txt: T('statusPend'), argb: P.barPend },
        { txt: T('statusBloc'), argb: P.barBloc },
      ].forEach(({ txt, argb }, pri) => {
        ws.addConditionalFormatting({
          ref: `${cl}${rowNum}`,
          rules: [
            {
              type: 'expression',
              priority: 100 + idx * 20 + pri,
              formulae: [`$B${rowNum}="${txt}"`],
              style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb } } },
            },
          ],
        })
      })
    }
  })

  ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 3, showGridLines: false }]
}

/** Exporta el Gantt visible a Excel; devuelve false si algo falló. */
export async function exportGanttExcel(view: GanttView, lang: Lang, isDark: boolean): Promise<boolean> {
  try {
    const { default: ExcelJS } = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    const model = buildExportModel(view, lang)
    fillWorkbook(wb, model, isDark, lang)
    const buf = await wb.xlsx.writeBuffer()
    downloadBlob(
      new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `gantt_${model.fileDate}.xlsx`,
    )
    return true
  } catch {
    return false
  }
}

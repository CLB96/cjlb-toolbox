// exportPNG del original (gantt/index.html 2025-2104): mismo dibujo y medidas; fondos con la paleta
// Nebulosa del toolbox (pendiente de visto bueno del dueño, como en GapCheck/Bondline).
import { STATIC_TEXTS, translate, type Lang } from '../i18n'
import { dayDiff, fmtDate, getWdays } from '../logic/dates'
import type { Status } from '../logic/types'
import { STATUS_KEY } from '../components/Timeline'
import { buildExportModel, downloadBlob, type ExportModel } from './exportModel'
import type { GanttView } from '../useGanttView'

interface Colors {
  bg: string; bg2: string; bg3: string; text: string; text2: string; border: string; today: string; todayBg: string; weekend: string
  blue: string; blueBg: string; blueText: string; green: string; greenBg: string; greenText: string; gray: string; grayBg: string; grayText: string
  red: string; redBg: string; redText: string; amber: string; amberBg: string; amberText: string
}

// Estados del original; fondos y textos neutros cambiados a la paleta Nebulosa.
const DARK: Colors = {bg:'#160c2e',bg2:'#1d1240',bg3:'#2a1a52',text:'#efe9ff',text2:'#b3a6d9',border:'rgba(255,255,255,0.12)',today:'#ff7683',todayBg:'rgba(255,118,131,0.12)',weekend:'#1a1038',blue:'#72a8ff',blueBg:'#11284c',blueText:'#a8cbff',green:'#59c97f',greenBg:'#10281a',greenText:'#9ae5b1',gray:'#91a0b7',grayBg:'#1a2437',grayText:'#c0cad8',red:'#ff7683',redBg:'#34131a',redText:'#ffb0ba',amber:'#f8b84f',amberBg:'#322712',amberText:'#ffd78f'}
const LIGHT: Colors = {bg:'#fbf7ff',bg2:'#f3ecff',bg3:'#e9e2ff',text:'#251a40',text2:'#6d6290',border:'rgba(37,26,64,0.12)',today:'#ef5b67',todayBg:'rgba(239,91,103,0.10)',weekend:'#f1ebfc',blue:'#4f8cff',blueBg:'#e9f1ff',blueText:'#235fd2',green:'#43b36b',greenBg:'#eaf9ef',greenText:'#217543',gray:'#8a94a6',grayBg:'#eef1f6',grayText:'#5d6778',red:'#ef5b67',redBg:'#ffecee',redText:'#b82c3f',amber:'#f59e0b',amberBg:'#fff5df',amberText:'#9a6800'}

const FONT = 'Inter,-apple-system,sans-serif'

/** Dibuja el PNG en un canvas nuevo. Devuelve null si no hay contexto 2D. */
/** Ancho mínimo de la columna de tareas en el PNG (mejora B2: con 80 px los nombres salían cortados). */
const PNG_MIN_TASK_COL = 280
export const pngTaskColWidth = (onScreen: number) => Math.max(onScreen, PNG_MIN_TASK_COL)

export function drawGanttPng(m: ExportModel, taskColWidth: number, isDark: boolean, lang: Lang): HTMLCanvasElement | null {
  const T = (k: Parameters<typeof translate>[1]) => translate(lang, k)
  const WDAYS = getWdays(lang)
  const totalDays = m.days.length
  const DPR = 2, ROW_H = 36, H1 = 22, H2 = 28, TCW = pngTaskColWidth(taskColWidth), DW = 28, PAD = 16
  const TW = TCW + totalDays * DW + PAD * 2
  const TH = H1 + H2 + m.rows.length * ROW_H + PAD * 2
  const cv = document.createElement('canvas')
  cv.width = Math.ceil(TW * DPR)
  cv.height = Math.ceil(TH * DPR)
  const ctx = cv.getContext('2d')
  if (!ctx) return null
  ctx.scale(DPR, DPR)
  const C = isDark ? DARK : LIGHT
  const barC: Record<Status, string> = { prog: C.blue, done: C.green, pend: C.gray, bloc: C.red, late: C.amber }
  const badB: Record<Status, string> = { prog: C.blueBg, done: C.greenBg, pend: C.grayBg, bloc: C.redBg, late: C.amberBg }
  const badT: Record<Status, string> = { prog: C.blueText, done: C.greenText, pend: C.grayText, bloc: C.redText, late: C.amberText }
  const fr = (x: number, y: number, w: number, h: number, c: string | CanvasGradient) => {
    if (w <= 0 || h <= 0) return
    ctx.fillStyle = c
    ctx.fillRect(x, y, w, h)
  }
  const ln = (x1: number, y1: number, x2: number, y2: number, c: string, lw = 0.5) => {
    ctx.strokeStyle = c
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  const tx = (s: string | number, x: number, y: number, c: string, sz = 11, wt = 'normal', al: CanvasTextAlign = 'left') => {
    ctx.fillStyle = c
    ctx.font = `${wt} ${sz}px ${FONT}`
    ctx.textAlign = al
    ctx.textBaseline = 'middle'
    ctx.fillText(String(s), x, y)
  }
  const rr = (x: number, y: number, w: number, h: number, r: number, c: string | CanvasGradient) => {
    if (w <= 0 || h <= 0) return
    ctx.fillStyle = c
    r = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
    ctx.fill()
  }
  const ox = PAD, oy = PAD
  fr(0, 0, TW, TH, C.bg)
  fr(ox, oy, TCW, H1, C.bg3)
  tx(T('pngTimeline'), ox + 8, oy + H1 / 2, C.text2, 9, '700')
  let mx = ox + TCW
  for (const mo of m.months) {
    const cw = mo.span * DW
    fr(mx, oy, cw, H1, C.bg3)
    ln(mx, oy, mx, oy + H1, C.border)
    tx(mo.label, mx + cw / 2, oy + H1 / 2, C.text2, 9, '700', 'center')
    mx += cw
  }
  ln(ox, oy + H1, ox + TW - PAD * 2, oy + H1, C.border)
  const dy2 = oy + H1
  fr(ox, dy2, TCW, H2, C.bg2)
  tx(T('pngTaskCol'), ox + 8, dy2 + H2 / 2, C.text2, 10, '700')
  // Badge % completado
  const done = m.rows.filter((r) => r.status === 'done').length
  const donePct = m.rows.length ? Math.round((done / m.rows.length) * 100) : 0
  const pctLabel = `${donePct}% ${STATIC_TEXTS.pngCompleted[lang]}`
  ctx.font = `800 11px ${FONT}`
  const pctW = ctx.measureText(pctLabel).width + 20, pctH = 20, pctX = ox + TCW - pctW - 8, pctY = dy2 + (H2 - pctH) / 2
  const pctGrad = ctx.createLinearGradient(pctX, 0, pctX + pctW, 0)
  pctGrad.addColorStop(0, C.green)
  pctGrad.addColorStop(1, C.blue)
  rr(pctX, pctY, pctW, pctH, pctH / 2, pctGrad)
  tx(pctLabel, pctX + pctW / 2, pctY + pctH / 2, '#ffffff', 11, '800', 'center')
  m.days.forEach((d, i) => {
    const dx = ox + TCW + i * DW
    fr(dx, dy2, DW, H2, d.isToday ? C.todayBg : d.isWeekend ? C.weekend : C.bg2)
    if (d.isToday) fr(dx, oy, 2, H1 + H2, C.today)
    ln(dx, dy2, dx, dy2 + H2, C.border)
    tx(WDAYS[d.date.getDay()]!, dx + DW / 2, dy2 + 9, d.isToday ? C.today : C.text2, 8, '700', 'center')
    tx(d.date.getDate(), dx + DW / 2, dy2 + 21, d.isToday ? C.today : C.text2, 9, 'normal', 'center')
  })
  ln(ox, dy2 + H2, ox + TW - PAD * 2, dy2 + H2, C.border)
  ln(ox + TCW, dy2, ox + TCW, dy2 + H2, C.border)
  m.rows.forEach((r, idx) => {
    const t = r.task
    const depth = r.depth
    const indent = depth * 14
    const opac = Math.max(0.45, 1 - depth * 0.18)
    const ry = oy + H1 + H2 + idx * ROW_H
    const rowBg = depth > 0 ? C.bg2 : idx % 2 === 0 ? C.bg : C.bg2
    fr(ox, ry, TW - PAD * 2, ROW_H, rowBg)
    if (depth > 0) {
      const depthColors = [C.blue, C.green, '#8b5cf6', '#f59e0b']
      fr(ox, ry, 3, ROW_H, depthColors[Math.min(depth - 1, 3)]!)
    }
    m.days.forEach((d, i) => {
      const dx = ox + TCW + i * DW
      if (d.isWeekend) fr(dx, ry, DW, ROW_H, C.weekend)
      if (d.isToday) {
        fr(dx, ry, DW, ROW_H, C.todayBg)
        fr(dx, ry, 2, ROW_H, C.today)
      }
    })
    ln(ox, ry + ROW_H, ox + TW - PAD * 2, ry + ROW_H, C.border)
    const nameX = ox + 8 + indent
    const prefix = depth > 0 ? '↳ ' : ''
    const commentIconW = t.comment ? 18 : 0
    const nameClipW = TCW - 130 - indent - commentIconW
    ctx.save()
    ctx.beginPath()
    ctx.rect(nameX, ry, nameClipW, ROW_H)
    ctx.clip()
    tx(prefix + t.name, nameX, ry + ROW_H / 2 - 5, C.text, 12, '700')
    ctx.restore()
    if (t.comment) tx('💬', nameX + nameClipW, ry + ROW_H / 2 - 5, C.text2, 11, 'normal')
    tx(`${fmtDate(r.eff.start)} → ${fmtDate(r.eff.end)} · ${dayDiff(r.eff.start, r.eff.end) + 1}d`, nameX, ry + ROW_H / 2 + 8, C.text2, 9, 'normal')
    const chipText = r.overdue ? T('statusOver') : T(STATUS_KEY[r.status])
    ctx.font = `700 9px ${FONT}`
    const bw = ctx.measureText(chipText).width + 14, bh = 16, bx = ox + TCW - bw - 6, by = ry + (ROW_H - bh) / 2
    rr(bx, by, bw, bh, 8, r.overdue ? C.amberBg : badB[r.status])
    tx(chipText, bx + bw / 2, by + bh / 2, r.overdue ? C.amberText : badT[r.status], 9, '700', 'center')
    ln(ox + TCW, ry, ox + TCW, ry + ROW_H, C.border)
    m.days.forEach((d, i) => {
      const dx = ox + TCW + i * DW
      ln(dx, ry, dx, ry + ROW_H, C.border, 0.5)
      if (d.date >= r.eff.start && d.date <= r.eff.end && dayDiff(r.eff.start, d.date) === 0) {
        const sp = dayDiff(r.eff.start, r.eff.end) + 1
        ctx.globalAlpha = opac
        rr(dx + 2, ry + (ROW_H - 20) / 2, Math.max(sp * DW - 4, 4), 20, 6, barC[r.status])
        ctx.globalAlpha = 1
      }
    })
    // mejora A8: la línea de hoy también encima de la barra
    m.days.forEach((d, i) => {
      if (d.isToday) fr(ox + TCW + i * DW, ry, 2, ROW_H, C.today)
    })
  })
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.strokeRect(ox, oy, TW - PAD * 2, TH - PAD * 2)
  return cv
}

export type PngResult = 'ok' | 'canvas' | 'image' | { error: string }

export function exportGanttPng(view: GanttView, taskColWidth: number, isDark: boolean, lang: Lang): Promise<PngResult> {
  try {
    const model = buildExportModel(view, lang)
    const cv = drawGanttPng(model, taskColWidth, isDark, lang)
    if (!cv) return Promise.resolve('canvas')
    return new Promise((resolve) =>
      cv.toBlob((blob) => {
        if (!blob) return resolve('image')
        downloadBlob(blob, `gantt_${model.fileDate}.png`)
        resolve('ok')
      }, 'image/png'),
    )
  } catch (err) {
    return Promise.resolve({ error: err instanceof Error ? err.message : String(err) })
  }
}

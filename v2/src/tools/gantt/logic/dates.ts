// Fechas del original (gantt/index.html 894-899, 1024-1033), sin globales: el idioma se pasa como parámetro.
import type { Lang } from '../i18n'

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WDAYS_ES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const WDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const getMonths = (lang: Lang) => (lang === 'en' ? MONTHS_EN : MONTHS_ES)
export const getWdays = (lang: Lang) => (lang === 'en' ? WDAYS_EN : WDAYS_ES)

/** Serializa con toISOString como el original (mejora A3: en husos positivos puede restar un día). */
export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
export function dayDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
export function formatHuman(d: Date, lang: Lang): string {
  return `${d.getDate()} ${getMonths(lang)[d.getMonth()]} ${d.getFullYear()}`
}
export function getWeekStart(d: Date): Date {
  const r = new Date(d)
  const wd = r.getDay() || 7
  r.setDate(r.getDate() - wd + 1)
  r.setHours(0, 0, 0, 0)
  return r
}
export function getWeekNum(d: Date): number {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dn = dt.getUTCDay() || 7
  dt.setUTCDate(dt.getUTCDate() + 4 - dn)
  const ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
  return Math.ceil(((dt.getTime() - ys.getTime()) / 86400000 + 1) / 7)
}
export function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6
}
/** "Hoy" a medianoche local, calculado una vez como el original (mejora A4). */
export function startOfToday(now = new Date()): Date {
  const t = new Date(now)
  t.setHours(0, 0, 0, 0)
  return t
}
/** `new Date(s+'T00:00:00')` del original (fecha local). */
export function parseLocal(s: string): Date {
  return new Date(s + 'T00:00:00')
}

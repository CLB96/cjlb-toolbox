// Conteos de renderStats (1537-1567) y renderPie (1482-1532) sobre la lista filtrada.
import { durationDays, getDisplayStatus, isActiveToday, isOverdue } from './tree'
import type { Status, Task } from './types'

export interface Stats {
  visible: number
  prog: number
  done: number
  pend: number
  bloc: number
  late: number
  over: number
  pct: number
  activeToday: number
  upcoming: number
  plannedDays: number
}

export function computeStats(tasks: Task[], list: Task[], today: Date): Stats {
  const c: Record<string, number> = { prog: 0, done: 0, pend: 0, bloc: 0, late: 0, over: 0 }
  list.forEach((t) => {
    const ds = getDisplayStatus(tasks, t, today)
    c[ds] = (c[ds] || 0) + 1
    if (isOverdue(tasks, t, today)) c.over!++
  })
  const pct = list.length ? Math.round((c.done! / list.length) * 100) : 0
  return {
    visible: list.length,
    prog: c.prog || 0,
    done: c.done || 0,
    pend: c.pend || 0,
    bloc: c.bloc || 0,
    late: c.late!,
    over: c.over!,
    pct,
    activeToday: list.filter((t) => isActiveToday(tasks, t, today)).length,
    // propias fechas, no efectivas (como el original)
    upcoming: list.filter((t) => t.start > today).length,
    plannedDays: list.reduce((acc, t) => acc + durationDays(t), 0),
  }
}

export const PIE_ORDER: Status[] = ['done', 'prog', 'late', 'pend', 'bloc']

export interface PieData {
  counts: Record<Status, number>
  total: number
  pct: number
  sel: Status
  selCount: number
  selPct: number
  overdueInSel: number
  activeCount: number
  overdueCount: number
  todayCount: number
}

export function computePie(tasks: Task[], list: Task[], today: Date, selection: Status | null): PieData {
  const c: Record<Status, number> = { prog: 0, done: 0, pend: 0, bloc: 0, late: 0 }
  list.forEach((t) => {
    const ds = getDisplayStatus(tasks, t, today)
    if (c[ds] !== undefined) c[ds]++
  })
  const total = list.length
  const overdueCount = list.filter((t) => isOverdue(tasks, t, today)).length
  const activeCount = list.filter((t) => getDisplayStatus(tasks, t, today) === 'prog').length
  const todayCount = list.filter((t) => isActiveToday(tasks, t, today)).length
  let sel = selection
  if (!sel || c[sel] === 0) sel = PIE_ORDER.find((k) => c[k] > 0) || 'done'
  const pct = total ? Math.round((c.done / total) * 100) : 0
  const selCount = c[sel] || 0
  const selPct = total ? Math.round((selCount / total) * 100) : 0
  const overdueInSel = list.filter(
    (t) => getDisplayStatus(tasks, t, today) === sel && isOverdue(tasks, t, today),
  ).length
  return { counts: c, total, pct, sel, selCount, selPct, overdueInSel, activeCount, overdueCount, todayCount }
}

export interface ArcSegment {
  key: Status
  d: string
}

/** Trazos de la dona (renderPie: S=200, R=82, ri=50, GAP=0.04, desplazamiento 7 del seleccionado). */
export function pieArcs(pie: PieData): ArcSegment[] {
  const cx = 100
  const cy = 100
  const R = 82
  const ri = 50
  const GAP = 0.04
  const pt = (a: number, r: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const arc = (sa: number, ea: number, selected: boolean): string => {
    if (ea - sa >= Math.PI * 1.999) ea = sa + Math.PI * 1.999
    const lg = ea - sa > Math.PI ? 1 : 0
    const off = selected ? 7 : 0
    const mid = (sa + ea) / 2
    const ox = Math.cos(mid) * off
    const oy = Math.sin(mid) * off
    const [x1, y1] = pt(sa, R)
    const [x2, y2] = pt(ea, R)
    const [x3, y3] = pt(ea, ri)
    const [x4, y4] = pt(sa, ri)
    return `M${x1 + ox},${y1 + oy} A${R},${R} 0 ${lg} 1 ${x2 + ox},${y2 + oy} L${x3 + ox},${y3 + oy} A${ri},${ri} 0 ${lg} 0 ${x4 + ox},${y4 + oy} Z`
  }
  const out: ArcSegment[] = []
  let sa = -Math.PI / 2
  if (!pie.total) return out
  PIE_ORDER.forEach((key) => {
    const v = pie.counts[key]
    if (!v) return
    const angle = (v / pie.total) * Math.PI * 2
    out.push({ key, d: arc(sa + GAP, sa + angle - GAP, pie.sel === key) })
    sa += angle
  })
  return out
}

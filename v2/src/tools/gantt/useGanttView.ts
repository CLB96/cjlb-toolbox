import { createContext, useContext, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGantt } from './GanttStoreProvider'
import type { Lang } from './i18n'
import { dayDiff } from './logic/dates'
import { computePie, computeStats, type PieData, type Stats } from './logic/stats'
import { buildTreeList, buildWeeks, filteredTasks, getRange, isOverdue, isActiveToday } from './logic/tree'
import type { EffectiveDates, Task } from './logic/types'
import { selectActiveChart } from './store'
import { deserializeTask } from './logic/tree'

export interface GanttView {
  today: Date
  tasks: Task[]
  filtered: Task[]
  list: Task[]
  range: EffectiveDates
  totalDays: number
  weeks: Date[]
  stats: Stats
  pie: PieData
  overdueFiltered: number
  activeTodayFiltered: number
}

/** "Hoy" de esta instancia (calculado al montar, como el original). */
export const TodayContext = createContext<Date>(new Date(0))
export const useToday = () => useContext(TodayContext)

/** Datos derivados del Gantt activo (render, renderStats y renderPie del original). */
export function useGanttView(lang: Lang): GanttView {
  const today = useToday()
  const stored = useGantt((s) => selectActiveChart(s).tasks)
  const { search, filter, sort } = useGantt(useShallow((s) => ({ search: s.prefs.search, filter: s.prefs.filter, sort: s.prefs.sort })))
  const activeId = useGantt((s) => s.activeId)
  const collapsedArr = useGantt((s) => s.collapsed[activeId])
  const pieSelection = useGantt((s) => s.pieSelection)

  return useMemo(() => {
    const tasks = stored.map(deserializeTask)
    const filtered = filteredTasks(tasks, { search, filter, sort }, today, lang)
    const list = buildTreeList(tasks, filtered, new Set(collapsedArr ?? []))
    const range = getRange(tasks, list.length ? list : tasks, today)
    return {
      today,
      tasks,
      filtered,
      list,
      range,
      totalDays: dayDiff(range.start, range.end) + 1,
      weeks: buildWeeks(range.start, range.end),
      stats: computeStats(tasks, filtered, today),
      pie: computePie(tasks, filtered, today, pieSelection),
      overdueFiltered: filtered.filter((t) => isOverdue(tasks, t, today)).length,
      activeTodayFiltered: filtered.filter((t) => isActiveToday(tasks, t, today)).length,
    }
  }, [stored, search, filter, sort, collapsedArr, pieSelection, today, lang])
}

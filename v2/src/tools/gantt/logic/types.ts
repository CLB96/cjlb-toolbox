/** Estados que se pueden asignar (el editor del original también ofrece "late"). */
export type Status = 'prog' | 'done' | 'pend' | 'bloc' | 'late'
export type FilterValue = 'all' | Status | 'over'
export type SortValue = 'startAsc' | 'startDesc' | 'endAsc' | 'endDesc' | 'status' | 'name'
export type ViewMode = 'day' | 'week'

/** Tarea tal como se guarda (serializeTasks del original). */
export interface StoredTask {
  id: number
  name: string
  start: string
  end: string
  status: Status
  comment: string
  parentId: number | null
}

/** Tarea en memoria (deserializeTask del original). */
export interface Task {
  id: number
  name: string
  start: Date
  end: Date
  status: Status
  comment: string
  parentId: number | null
}

export interface EffectiveDates {
  start: Date
  end: Date
}

export interface TaskStateMeta {
  baseStatus: Status
  effectiveDates: EffectiveDates
  overdue: boolean
  displayStatus: Status
}

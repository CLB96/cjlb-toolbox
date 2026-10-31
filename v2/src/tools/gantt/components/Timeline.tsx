import { useEffect, useRef, type ReactNode } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'
import { toast } from '../../../ui/toastStore'
import { useGantt, useGanttApi } from '../GanttStoreProvider'
import { STATIC_TEXTS, useGanttT, type GanttKey } from '../i18n'
import { barTipText } from '../logic/barDrag'
import { addDays, dayDiff, fmtDate, getWdays, getWeekNum, isWeekend } from '../logic/dates'
import {
  barOpacity,
  buildMonthCells,
  dayCells,
  getChildren,
  getDepth,
  getDisplayStatus,
  getEffectiveDates,
  getParentOptions,
  isOverdue,
  weekCells,
  type TimelineCell,
} from '../logic/tree'
import type { Status, Task } from '../logic/types'
import { selectActiveChart, TASK_COL_MAX, TASK_COL_MIN } from '../store'
import type { GanttView } from '../useGanttView'
import { EditRow } from './EditRow'
import { useBarDrag, type CommittedDrag, type LiveDrag } from './useBarDrag'
import { useRowDrag } from './useRowDrag'

export const STATUS_KEY: Record<Status, GanttKey> = {
  prog: 'statusProg',
  done: 'statusDone',
  pend: 'statusPend',
  bloc: 'statusBloc',
  late: 'statusLate',
}

interface Props {
  view: GanttView
  disabled: boolean
  onBarCommit: (c: CommittedDrag) => void
}

/** Tabla del Gantt (render del original): cabecera de meses + días/semanas, filas y leyenda. */
export function Timeline({ view, disabled, onBarCommit }: Props) {
  const { t, lang } = useGanttT()
  const api = useGanttApi()
  const viewMode = useGantt((s) => s.prefs.viewMode)
  const width = useGantt((s) => s.prefs.taskColWidth)
  const editingId = useGantt((s) => s.editingId)
  const collapsed = useGantt((s) => selectActiveChart(s).collapsed)
  const tableRef = useRef<HTMLTableElement>(null)
  const { tasks, list, range, today, totalDays, weeks } = view
  const { live, barProps } = useBarDrag(tableRef, tasks, viewMode === 'day' && !disabled, onBarCommit)
  const rowDrag = useRowDrag(tableRef, (src, tgt, after) => {
    const r = api.getState().moveTask(src, tgt, after)
    if (!r.ok && r.error) toast('error', STATIC_TEXTS[r.error][lang])
  })
  const resizer = useColResize(width, (w) => api.getState().setPref('taskColWidth', w))
  const collapsedSet = new Set(collapsed ?? [])
  const colStyle = { width, minWidth: width, maxWidth: width }
  const WDAYS = getWdays(lang)
  const span = viewMode === 'day' ? totalDays : weeks.length

  const months = buildMonthCells(range.start, range.end, viewMode, lang)
  const head = (
    <thead>
      <tr>
        <th className="gt-task-col gt-month-head" style={colStyle}>
          {t('ganttTimeline')}
          {resizer}
        </th>
        {months.map((m, i) => (
          <th key={i} className="gt-month-head" colSpan={m.span}>
            {m.label}
          </th>
        ))}
      </tr>
      <tr>
        <th className="gt-task-col" style={colStyle}>
          {t('ganttTaskCol')}
          {resizer}
        </th>
        {viewMode === 'day'
          ? Array.from({ length: totalDays }, (_, i) => {
              const d = addDays(range.start, i)
              const isT = dayDiff(today, d) === 0
              return (
                <th key={i} className={`gt-day-head${isT ? ' gt-today-col gt-today-head' : ''}${isWeekend(d) ? ' gt-weekend-col' : ''}`}>
                  {WDAYS[d.getDay()]}
                  <br />
                  <span className="gt-day-num">{d.getDate()}</span>
                </th>
              )
            })
          : weeks.map((w, i) => {
              const isCur = today >= w && today <= addDays(w, 6)
              return (
                <th key={i} className={`gt-day-head${isCur ? ' gt-today-col gt-today-head' : ''}`}>
                  W{getWeekNum(w)}
                  <br />
                  <span className="gt-day-num">{`${w.getDate()}/${w.getMonth() + 1}`}</span>
                </th>
              )
            })}
      </tr>
    </thead>
  )

  const rowCells = (task: Task, isParent: boolean, status: Status, depth: number): ReactNode => {
    const cells: TimelineCell[] =
      viewMode === 'day' ? dayCells(tasks, task, range.start, totalDays, today) : weekCells(tasks, task, weeks, today)
    return cells.map((c) => {
      const cls = `gt-bar-cell${c.today ? ' gt-today-col' : ''}${c.weekend ? ' gt-weekend-col' : ''}`
      if (!c.bar) return <td key={c.i} className={cls} />
      const opacity = barOpacity(depth)
      if (viewMode === 'week' || isParent || disabled) {
        return (
          <td key={c.i} className={cls} colSpan={c.span}>
            <div className={`gt-bar gt-bar--${status}`} style={{ opacity }} />
          </td>
        )
      }
      const tip = live && live.id === task.id && live.tip ? live : null
      return (
        <td key={c.i} className={cls} colSpan={c.span}>
          <div className={`gt-bar-wrap${tip ? ' tip-visible' : ''}`} style={{ opacity }}>
            <div className={`gt-bar gt-bar--${status} gt-bar--interactive`} data-bar-id={task.id} {...barProps(task.id)} />
            {tip && <BarTip live={tip} lang={lang} />}
          </div>
        </td>
      )
    })
  }

  const rows = list.length ? (
    list.map((task) => {
      if (editingId === task.id) {
        return <EditRow key={`e${task.id}`} task={task} span={span} width={width} parents={getParentOptions(tasks, task.id)} />
      }
      const depth = getDepth(tasks, task)
      const isParent = getChildren(tasks, task.id).length > 0
      const status = getDisplayStatus(tasks, task, today)
      const overdue = isOverdue(tasks, task, today)
      const liveDates = live && live.id === task.id ? live : null
      const eff = liveDates ?? getEffectiveDates(tasks, task)
      const rangeText = `${fmtDate(eff.start)} → ${fmtDate(eff.end)} · ${dayDiff(eff.start, eff.end) + 1}d`
      return (
        <tr key={task.id} data-id={task.id} data-depth={depth} className={liveDates ? 'gt-bar-live' : undefined}>
          <td className="gt-task-col" style={colStyle}>
            <div className="gt-task-info" style={{ paddingLeft: 4 + depth * 18 }}>
              {isParent ? (
                <button type="button" className="gt-action-btn gt-collapse-btn" aria-expanded={!collapsedSet.has(task.id)} onClick={() => api.getState().toggleCollapse(task.id)}>
                  {collapsedSet.has(task.id) ? '▶' : '▼'}
                </button>
              ) : (
                <span className="gt-collapse-spacer" />
              )}
              {depth > 0 && (
                <span
                  className="gt-drag-handle"
                  aria-hidden="true"
                  onMouseDown={(e) => {
                    if (disabled) return
                    e.preventDefault()
                    rowDrag.start(task.id, e.clientX, e.clientY)
                  }}
                  onTouchStart={(e) => {
                    if (disabled) return
                    rowDrag.start(task.id, e.touches[0]!.clientX, e.touches[0]!.clientY)
                  }}
                >
                  ⠿
                </span>
              )}
              <button type="button" className="gt-action-btn" aria-label={`✎ ${task.name}`} disabled={disabled} onClick={() => api.getState().setEditing(task.id)}>
                ✎
              </button>
              <button type="button" className="gt-action-btn" aria-label={`⧉ ${task.name}`} disabled={disabled} onClick={() => duplicate(task.id)}>
                ⧉
              </button>
              <div className="gt-task-main">
                <span className="gt-task-name" title={task.name}>
                  {depth > 0 ? '↳ ' : ''}
                  {task.name}
                </span>
                <span className="gt-task-dates">{rangeText}</span>
              </div>
              {task.comment && (
                <span className="gt-comment" title={task.comment} aria-label={STATIC_TEXTS.commentAria + task.comment}>
                  💬
                </span>
              )}
              {overdue && <span className="gt-badge gt-badge--over">{t('statusOver')}</span>}
              <span className={`gt-badge gt-badge--${status}`}>{t(STATUS_KEY[status])}</span>
              <button type="button" className="gt-action-btn gt-del-btn" aria-label={`× ${task.name}`} disabled={disabled} onClick={() => remove(task.id)}>
                ×
              </button>
            </div>
          </td>
          {rowCells(task, isParent, status, depth)}
        </tr>
      )
    })
  ) : (
    <tr>
      <td className="gt-empty" colSpan={span + 1}>
        {t('ganttEmpty')}
      </td>
    </tr>
  )

  function duplicate(id: number) {
    if (api.getState().duplicateTask(id, t('duplicateSuffix'))) toast('ok', t('toastDuplicated'))
  }
  function remove(id: number) {
    if (!window.confirm(t('confirmDelete'))) return
    if (api.getState().deleteTask(id)) toast('info', t('toastDeleted'))
  }

  return (
    <GlassPanel as="section" className="gt-card">
      <div className="gt-gantt-wrap">
        <table ref={tableRef} className="gt-table">
          {head}
          <tbody>{rows}</tbody>
        </table>
      </div>
      <div className="gt-legend">
        <span><i className="gt-dot gt-dot--prog" />{t('legendProg')}</span>
        <span><i className="gt-dot gt-dot--done" />{t('legendDone')}</span>
        <span><i className="gt-dot gt-dot--pend" />{t('legendPend')}</span>
        <span><i className="gt-dot gt-dot--bloc" />{t('legendBloc')}</span>
        <span><i className="gt-dot gt-dot--late" />{t('legendLate')}</span>
        <span><i className="gt-dot gt-dot--over" />{t('legendOver')}</span>
        <span><i className="gt-dot gt-dot--today" />{t('legendToday')}</span>
      </div>
    </GlassPanel>
  )
}

function BarTip({ live, lang }: { live: LiveDrag; lang: 'es' | 'en' }) {
  const cls = live.delta > 0 ? 'pos' : live.delta < 0 ? 'neg' : 'neu'
  return (
    <div className={`gt-bar-tip ${cls}`} role="status">
      {barTipText(live.delta, live.mode === 'move' ? 'move' : 'resize', lang)}
    </div>
  )
}

/** Asa para cambiar el ancho de la columna de tareas (80-520 px, initColResize). */
function useColResize(width: number, setWidth: (w: number) => void): ReactNode {
  const widthRef = useRef(width)
  widthRef.current = width
  const setRef = useRef(setWidth)
  setRef.current = setWidth
  const cleanupRef = useRef<() => void>()
  useEffect(() => () => cleanupRef.current?.(), [])

  const begin = (startX: number, touch: boolean) => {
    const startW = widthRef.current
    const clamp = (x: number) => Math.min(TASK_COL_MAX, Math.max(TASK_COL_MIN, startW + (x - startX)))
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0]!.clientX : e.clientX
      if ('touches' in e) e.preventDefault()
      setRef.current(clamp(x))
    }
    const end = () => {
      document.removeEventListener(touch ? 'touchmove' : 'mousemove', onMove)
      document.removeEventListener(touch ? 'touchend' : 'mouseup', end)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      delete document.body.dataset.gtBusy
      cleanupRef.current = undefined
    }
    document.addEventListener(touch ? 'touchmove' : 'mousemove', onMove, { passive: false })
    document.addEventListener(touch ? 'touchend' : 'mouseup', end)
    if (!touch) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    document.body.dataset.gtBusy = 'col'
    cleanupRef.current = end
  }

  return (
    <div
      className="gt-col-resizer"
      aria-hidden="true"
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        begin(e.clientX, false)
      }}
      onTouchStart={(e) => begin(e.touches[0]!.clientX, true)}
    />
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { HistoryPanel } from '../../persistence/HistoryPanel'
import { Dialog } from '../../ui/Dialog'
import { toast } from '../../ui/toastStore'
import type { ToolProps } from '../types'
import { GanttStoreProvider, useGantt, useGanttApi } from './GanttStoreProvider'
import { STATIC_TEXTS, useGanttT } from './i18n'
import { undoMessage } from './logic/barDrag'
import { formatHuman, startOfToday } from './logic/dates'
import { getParentOptions } from './logic/tree'
import { exportGanttExcel } from './export/exportExcel'
import { isDarkTheme } from './export/exportModel'
import { exportGanttPng } from './export/exportPng'
import { useGanttPersistence } from './useGanttPersistence'
import { TodayContext, useGanttView } from './useGanttView'
import { FilterPanel } from './components/FilterPanel'
import { Header } from './components/Header'
import { Health } from './components/Health'
import { NewTaskForm } from './components/NewTaskForm'
import { Overview } from './components/Overview'
import { Timeline } from './components/Timeline'
import { UndoToast, type PendingUndo } from './components/UndoToast'
import type { CommittedDrag } from './components/useBarDrag'
import './gantt.css'

const UNDO_MS = 5000

function GanttBody({ toolId, active }: ToolProps) {
  const { t: tApp } = useI18n()
  const { t, lang } = useGanttT()
  const api = useGanttApi()
  const view = useGanttView(lang)
  const { lastSavedAt, restoreVersion, restored } = useGanttPersistence()
  const width = useGantt((s) => s.prefs.taskColWidth)
  const activeId = useGantt((s) => s.activeId)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [undo, setUndo] = useState<PendingUndo | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout>>()
  const searchRef = useRef<HTMLInputElement>(null)
  const disabled = !restored
  const parents = useMemo(() => getParentOptions(view.tasks), [view.tasks])

  // Ctrl+K enfoca la búsqueda; Escape cierra la edición en curso (solo con la pestaña visible)
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && api.getState().editingId !== null) api.getState().setEditing(null)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, api])

  useEffect(() => () => clearTimeout(undoTimer.current), [])
  // un deshacer pendiente no aplica a otro Gantt
  useEffect(() => setUndo(null), [activeId])

  const onBarCommit = (c: CommittedDrag) => {
    clearTimeout(undoTimer.current)
    setUndo({ id: c.id, start: c.origStart, end: c.origEnd, message: undoMessage(c.origStart, c.origEnd, c.start, c.end, lang) })
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS)
  }
  const onUndo = () => {
    if (!undo) return
    clearTimeout(undoTimer.current)
    if (api.getState().charts.some((c) => c.id === activeId)) api.getState().setTaskDates(undo.id, undo.start, undo.end)
    setUndo(null)
    toast('info', STATIC_TEXTS.undone[lang])
  }

  const onExcel = async () => {
    if (await exportGanttExcel(view, lang, isDarkTheme())) toast('ok', t('toastExcelOk'))
    else toast('error', t('toastExcelError'))
  }
  const onPng = async () => {
    const r = await exportGanttPng(view, width, isDarkTheme(), lang)
    if (r === 'ok') toast('ok', t('toastPngOk'))
    else if (r === 'canvas') toast('error', t('toastCanvasError'))
    else if (r === 'image') toast('error', t('toastImgError'))
    else toast('error', t('toastShareError') + r.error)
  }
  const onRestore = async (id: string) => {
    await restoreVersion(id)
    setHistoryOpen(false)
  }

  const footer = t('footer').split('CJLB')
  return (
    <div className="gt">
      <Header
        today={view.today}
        pct={view.stats.pct}
        lastSavedAt={lastSavedAt}
        disabled={disabled}
        onHistory={() => setHistoryOpen(true)}
        onExcel={() => void onExcel()}
        onPng={() => void onPng()}
      />
      <Overview stats={view.stats} />
      <div className="gt-split">
        <NewTaskForm key={activeId} today={view.today} parents={parents} disabled={disabled} />
        <FilterPanel
          ref={searchRef}
          disabled={disabled}
          rangeLabel={`${formatHuman(view.range.start, lang)} — ${formatHuman(view.range.end, lang)}`}
          resultInfo={t('resultInfo', view.filtered.length, view.tasks.length, view.overdueFiltered, view.activeTodayFiltered)}
        />
      </div>
      <Timeline view={view} disabled={disabled} onBarCommit={onBarCommit} />
      <Health pie={view.pie} />
      <footer className="gt-footer">
        {footer[0]}
        {footer.length > 1 && <strong>CJLB</strong>}
        {footer.slice(1).join('CJLB')}
      </footer>
      <UndoToast pending={undo} lang={lang} onUndo={onUndo} />
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} title={tApp('persist.history')}>
        <HistoryPanel toolId={toolId} onRestore={onRestore} lastSavedAt={lastSavedAt} />
      </Dialog>
    </div>
  )
}

export default function GanttTool(props: ToolProps) {
  const [today] = useState(() => startOfToday())
  return (
    <GanttStoreProvider>
      <TodayContext.Provider value={today}>
        <GanttBody {...props} />
      </TodayContext.Provider>
    </GanttStoreProvider>
  )
}

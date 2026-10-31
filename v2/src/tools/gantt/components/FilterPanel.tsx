import { forwardRef, useEffect, useRef, useState } from 'react'
import { Button } from '../../../ui/Button'
import { useGantt, useGanttApi } from '../GanttStoreProvider'
import { selectActiveChart } from '../store'
import { useGanttT, type GanttKey } from '../i18n'
import type { FilterValue, SortValue } from '../logic/types'
import { Panel } from './Panel'

const FILTERS: [FilterValue, GanttKey][] = [
  ['all', 'filterAll'],
  ['prog', 'filterProg'],
  ['done', 'filterDone'],
  ['pend', 'filterPend'],
  ['bloc', 'filterBloc'],
  ['late', 'filterLate'],
  ['over', 'filterOver'],
]
const SORTS: [SortValue, GanttKey][] = [
  ['startAsc', 'sortStartAsc'],
  ['startDesc', 'sortStartDesc'],
  ['endAsc', 'sortEndAsc'],
  ['endDesc', 'sortEndDesc'],
  ['status', 'sortStatus'],
  ['name', 'sortName'],
]
const SEARCH_DEBOUNCE_MS = 120

interface Props {
  rangeLabel: string
  resultInfo: string
  disabled: boolean
}

/** Vista general: búsqueda (debounce 120 ms), filtro, orden, Limpiar y selector Días/Semanas. */
export const FilterPanel = forwardRef<HTMLInputElement, Props>(function FilterPanel(
  { rangeLabel, resultInfo, disabled },
  searchRef,
) {
  const { t } = useGanttT()
  const api = useGanttApi()
  const activeId = useGantt((s) => s.activeId)
  const search = useGantt((s) => selectActiveChart(s).view.search)
  const filter = useGantt((s) => selectActiveChart(s).view.filter)
  const sort = useGantt((s) => selectActiveChart(s).view.sort)
  const viewMode = useGantt((s) => s.prefs.viewMode)
  const [draft, setDraft] = useState(search)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  // refleja cambios externos (Limpiar, restaurar versión)
  useEffect(() => setDraft(search), [search])
  // una búsqueda pendiente no pasa a otro Gantt
  useEffect(() => () => clearTimeout(timer.current), [activeId])
  useEffect(() => () => clearTimeout(timer.current), [])

  const onSearch = (v: string) => {
    setDraft(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => api.getState().setView('search', v), SEARCH_DEBOUNCE_MS)
  }

  return (
    <Panel title={t('filterTitle')} subtitle={t('filterSubtitle')} aside={<span className="gt-chip">{rangeLabel}</span>}>
      <input
        ref={searchRef}
        className="gt-input"
        type="text"
        placeholder={t('filterPlaceholder')}
        aria-label="Buscar tarea"
        value={draft}
        disabled={disabled}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="gt-row">
        <select className="gt-input" aria-label="Filtrar por estado" value={filter} disabled={disabled} onChange={(e) => api.getState().setView('filter', e.target.value as FilterValue)}>
          {FILTERS.map(([v, k]) => (
            <option key={v} value={v}>
              {t(k)}
            </option>
          ))}
        </select>
        <select className="gt-input" aria-label="Ordenar tareas" value={sort} disabled={disabled} onChange={(e) => api.getState().setView('sort', e.target.value as SortValue)}>
          {SORTS.map(([v, k]) => (
            <option key={v} value={v}>
              {t(k)}
            </option>
          ))}
        </select>
        <Button variant="ghost" className="gt-row__fixed" disabled={disabled} onClick={() => api.getState().clearFilters()}>
          {t('btnClear')}
        </Button>
      </div>
      <div className="gt-row gt-row--between">
        <div className="gt-helper" aria-live="polite">
          {resultInfo}
        </div>
        <div className="gt-seg" role="group" aria-label="Vista">
          {(['day', 'week'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={viewMode === v ? 'is-on' : ''}
              aria-pressed={viewMode === v}
              disabled={disabled}
              onClick={() => api.getState().setPref('viewMode', v)}
            >
              {t(v === 'day' ? 'formViewDay' : 'formViewWeek')}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
})

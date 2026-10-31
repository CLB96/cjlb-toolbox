import { useGantt, useGanttApi } from '../GanttStoreProvider'
import { translateMap, useGanttT } from '../i18n'
import { pieArcs, type PieData } from '../logic/stats'
import { Panel } from './Panel'
import { STATUS_KEY } from './Timeline'

/** Health snapshot (renderPie): dona con segmento seleccionable y detalle del estado. */
export function Health({ pie }: { pie: PieData }) {
  const { t, lang } = useGanttT()
  const api = useGanttApi()
  const open = useGantt((s) => s.prefs.insightOpen)
  const desc = translateMap(lang, 'pieDesc')
  const arcs = pieArcs(pie)
  return (
    <Panel
      title={t('healthTitle')}
      subtitle={t('healthSubtitle')}
      aside={<span className="gt-chip">{t('taskCount', pie.total)}</span>}
      open={open}
      toggleLabel="Minimizar health snapshot"
      onToggle={() => api.getState().setPref('insightOpen', !open)}
    >
      <div className="gt-health">
        <svg className="gt-donut" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label={`${pie.pct}% ${t('pieCompleted')}`}>
          {pie.total ? (
            arcs.map((a) => (
              <path
                key={a.key}
                d={a.d}
                className={`gt-arc gt-arc--${a.key}`}
                data-key={a.key}
                onClick={() => api.getState().setPieSelection(a.key)}
              />
            ))
          ) : (
            <circle cx="100" cy="100" r="82" className="gt-arc--empty" />
          )}
          <circle cx="100" cy="100" r="50" className="gt-donut__hole" />
          <text x="100" y="91" textAnchor="middle" dominantBaseline="middle" className="gt-donut__pct">
            {pie.pct}%
          </text>
          <text x="100" y="112" textAnchor="middle" dominantBaseline="middle" className="gt-donut__label">
            {t('pieCompleted')}
          </text>
        </svg>
        <div className="gt-legend-card">
          <div className="gt-legend-card__kicker">{t('pieSelected')}</div>
          <div className="gt-legend-card__title">
            <i className={`gt-dot gt-dot--${pie.sel}`} />
            {t(STATUS_KEY[pie.sel])}
          </div>
          <div className="gt-legend-card__copy">{desc[pie.sel]}</div>
          <div className="gt-pulses">
            <span className="gt-chip">{t('pieTasks', pie.selCount)}</span>
            <span className="gt-chip">{t('pieOfTotal', pie.selPct)}</span>
            <span className="gt-chip">{t('pieOverdue', pie.overdueInSel)}</span>
          </div>
          <div className="gt-pulses gt-pulses--micro">
            <span className="gt-chip">{t('pieActive', pie.activeCount)}</span>
            <span className="gt-chip">{t('pieOverdueTotal', pie.overdueCount)}</span>
            <span className="gt-chip">{t('pieToday', pie.todayCount)}</span>
          </div>
        </div>
      </div>
    </Panel>
  )
}

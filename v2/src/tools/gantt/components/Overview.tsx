import { useGantt, useGanttApi } from '../GanttStoreProvider'
import { STATIC_TEXTS, useGanttT } from '../i18n'
import type { Stats } from '../logic/stats'
import { Panel } from './Panel'

/** Overview rápido (renderStats): 6 tarjetas y la banda de progreso. */
export function Overview({ stats }: { stats: Stats }) {
  const { t, lang } = useGanttT()
  const api = useGanttApi()
  const open = useGantt((s) => s.prefs.statsOpen)
  const cards = [
    { chip: t('statOverview'), icon: '📌', value: stats.visible, label: STATIC_TEXTS.visibleTasks[lang], tone: '' },
    { chip: t('statDoing'), icon: '⚡', value: stats.prog, label: t('statProgLabel'), tone: 'prog' },
    { chip: t('statDone'), icon: '✅', value: stats.done, label: t('statDoneLabel'), tone: 'done' },
    { chip: t('statFocus'), icon: '🕓', value: stats.pend, label: t('statPendLabel'), tone: 'pend' },
    { chip: t('statRisk'), icon: '⛔', value: stats.bloc, label: t('statBlocLabel'), tone: 'bloc' },
    { chip: t('statLate'), icon: '⏰', value: stats.late, label: t('statLateLabel'), tone: 'late' },
  ]
  return (
    <Panel
      title={t('overviewTitle')}
      subtitle={t('overviewSubtitle')}
      open={open}
      toggleLabel="Minimizar overview"
      onToggle={() => api.getState().setPref('statsOpen', !open)}
    >
      <div className="gt-stats">
        {cards.map((c) => (
          <div key={c.chip + c.icon} className="gt-stat">
            <div className="gt-stat__top">
              <span className="gt-stat__chip">{c.chip}</span>
              <span aria-hidden="true">{c.icon}</span>
            </div>
            <div className={`gt-stat__num${c.tone ? ` gt-tone-${c.tone}` : ''}`}>{c.value}</div>
            <div className="gt-stat__label">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="gt-progress">
        <div className="gt-progress__meta">
          <div>
            <div className="gt-progress__title">{t('progressTitle')}</div>
            <div className="gt-progress__copy">{t('progressCopy', stats.done, stats.prog, stats.over)}</div>
          </div>
          <span className="gt-chip">{`${stats.pct}%`}</span>
        </div>
        <div className="gt-progress__rail">
          <div className="gt-progress__fill" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="gt-pulses">
          <span className="gt-chip">{t('pulseToday', stats.activeToday)}</span>
          <span className="gt-chip">{t('pulseNext', stats.upcoming)}</span>
          <span className="gt-chip">{t('pulseDays', stats.plannedDays)}</span>
        </div>
      </div>
    </Panel>
  )
}

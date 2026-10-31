import { Button } from '../../../ui/Button'
import { RichText } from '../../../ui/RichText'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useCapa, useCapaApi } from '../CapaflowStoreProvider'
import { fill, INLINE, useCapaT } from '../i18n'
import { selectActive } from '../store'
import { ChartSections } from './ChartSections'
import { ControlCharts } from './ControlCharts'
import { GaugeCard } from './GaugeCard'
import { HistogramCard } from './HistogramCard'
import { Interpretation, Kpis } from './Kpis'
import { PlanSection } from './PlanSection'
import { StatsCards } from './StatsCards'

/** Columna derecha: el análisis activo del proyecto (o la pista de estado vacío). */
export function Results({ disabled, onExportPlan }: { disabled: boolean; onExportPlan: () => void }) {
  const { t, lang } = useCapaT()
  const api = useCapaApi()
  const point = useCapa(selectActive)
  const count = useCapa((s) => s.points.length)

  if (!point) {
    return (
      <GlassPanel className="cf-card cf-empty" data-testid="cf-empty">
        {t('empty.hint').split('<br>').map((line, i) => (
          <p key={i}>
            <RichText text={line} />
          </p>
        ))}
      </GlassPanel>
    )
  }
  const r = point.result
  const title = r.pointName || INLINE.pointTitle(lang, point.id)
  const time = new Date(point.at).toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="cf-right" data-testid="cf-results">
      <div className="cf-block-head">
        <h2 className="cf-block-title">⬡ {title}</h2>
        <span className="cf-muted">{fill(t('v2.dataCount'), { n: r.N, time })}</span>
        <Button variant="ghost" disabled={disabled} title={INLINE.deleteAnalysis[lang]} aria-label={INLINE.deleteAnalysis[lang]} onClick={() => api.getState().deletePoint(point.id)}>
          ✕
        </Button>
        {count > 1 && <span className="cf-muted">{`${api.getState().points.indexOf(point) + 1} / ${count}`}</span>}
      </div>
      <div className="cf-bento">
        <Kpis r={r} />
        <Interpretation r={r} />
      </div>
      <div className="cf-two">
        <GaugeCard r={r} />
        <HistogramCard r={r} />
      </div>
      <StatsCards r={r} />
      <ControlCharts id={point.id} r={r} choice={point.ccType} />
      <ChartSections r={r} />
      <PlanSection onExport={onExportPlan} />
    </div>
  )
}

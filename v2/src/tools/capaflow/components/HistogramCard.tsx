import { GlassPanel } from '../../../ui/GlassPanel'
import { drawHistogram } from '../draw/drawHistogram'
import { useCapaT } from '../i18n'
import { fmt, type AnalysisResult } from '../logic'
import { CanvasChart } from './CanvasChart'
import { useDrawEnv } from './useDrawEnv'

/** Histograma + distribución y píldora Anderson-Darling (original 3947-3965). */
export function HistogramCard({ r }: { r: AnalysisResult }) {
  const { t } = useCapaT()
  const env = useDrawEnv()
  return (
    <GlassPanel as="section" className="cf-card" aria-labelledby="cf-hist-title">
      <h2 id="cf-hist-title" className="cf-card__title">
        <span className="cf-dot cf-dot--2" aria-hidden="true" />
        {t('results.histTitle')}
      </h2>
      <CanvasChart className="cf-canvas" height={220} label={t('results.histTitle')} deps={[r, env]} draw={(c) => drawHistogram(c, r, env)} />
      <div className={`cf-normality ${r.isNormal ? 'cf-normality--ok' : 'cf-normality--warn'}`} data-testid="cf-normality">
        Anderson-Darling: p={fmt(r.adTest.p, 4)} · {r.isNormal ? t('png.normal') : t('png.notNormal')}
      </div>
    </GlassPanel>
  )
}

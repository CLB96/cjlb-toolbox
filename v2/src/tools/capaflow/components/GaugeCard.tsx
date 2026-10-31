import { useState } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'
import { drawGauge, GAUGE_H, GAUGE_W } from '../draw/drawGauge'
import { INLINE, useCapaT } from '../i18n'
import { colorForCpk, fmt, sigmaBarWidth, sigmaTooltipClass, type AnalysisResult } from '../logic'
import { CanvasChart } from './CanvasChart'
import { useResolveCssColor } from './useDrawEnv'

/** Medidor Cpk, nivel σ y barra sigma con tooltip (original 3925-3945 y 4003-4020). */
export function GaugeCard({ r }: { r: AnalysisResult }) {
  const { t, lang } = useCapaT()
  const resolve = useResolveCssColor()
  const cssColor = r.Cpk !== null ? colorForCpk(r.Cpk) : 'var(--accent)'
  const color = resolve(cssColor)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)

  return (
    <GlassPanel as="section" className="cf-card" aria-labelledby="cf-gauge-title">
      <h2 id="cf-gauge-title" className="cf-card__title">
        <span className="cf-dot" style={{ background: cssColor }} aria-hidden="true" />
        {t('results.cpkTitle')}
      </h2>
      <div className="cf-gauge">
        <CanvasChart
          className="cf-gauge__canvas"
          width={GAUGE_W}
          height={GAUGE_H}
          label={t('results.cpkTitle')}
          responsive={false}
          deps={[r, color, lang]}
          draw={(c) => drawGauge(c, r.Cpk, color, lang)}
        />
        <div className="cf-gauge__value">
          <div className="cf-gauge__num" style={{ color: cssColor }} data-testid="cf-gauge-value">
            {fmt(r.Cpk)}
          </div>
          <div className="cf-muted">
            Cpk · {t('gauge.sigmaLevel')}: {fmt(r.sigLvl, 2)}
          </div>
        </div>
        <div className="cf-sigma">
          <div
            className="cf-sigma__track"
            data-testid="cf-sigma-track"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const sigma = ((e.clientX - rect.left) / rect.width) * 6
              setTip({ text: `${sigma.toFixed(2)}σ\n${sigmaTooltipClass(sigma)}`, x: e.clientX, y: e.clientY })
            }}
            onMouseLeave={() => setTip(null)}
          >
            <div className="cf-sigma__fill" style={{ width: `${sigmaBarWidth(r.sigLvl)}%` }} />
          </div>
          <div className="cf-sigma__labels">
            {INLINE.fixed.sigmaLabels.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          {tip && (
            <div className="cf-tooltip" role="tooltip" style={{ left: tip.x + 15, top: tip.y - 10 }}>
              {tip.text}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  )
}

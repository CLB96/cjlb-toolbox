import { useMemo } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'
import { drawControl } from '../draw/drawControl'
import { useCapaT } from '../i18n'
import { buildControlChartScreen, type AnalysisResult, type CCTypeChoice } from '../logic'
import { useCapaApi } from '../CapaflowStoreProvider'
import { CanvasChart } from './CanvasChart'
import { useDrawEnv } from './useDrawEnv'

interface Props {
  id: number
  r: AnalysisResult
  choice: CCTypeChoice
}

interface HalfProps {
  label: string
  count: number
  ooc: number
  testId: string
  height: number
  legend: { text: string; kind: 'line' | 'dash' | 'dot' }[]
  draw: (c: HTMLCanvasElement) => ReturnType<typeof drawControl>
  deps: unknown[]
}

function Half({ label, count, ooc, testId, height, legend, draw, deps }: HalfProps) {
  const { t } = useCapaT()
  return (
    <div className="cf-cc-card" data-testid={testId}>
      <div className="cf-cc-card__head">
        <span>{label}</span>
        <span className="cf-muted">{count} {t('cc.subgroups')}</span>
        <span className={`cf-ooc ${ooc > 0 ? 'cf-ooc--bad' : 'cf-ooc--ok'}`}>
          {ooc > 0 ? `⚠ ${ooc} ${t('cc.ooc')}` : `✓ ${t('cc.inControl')}`}
        </span>
      </div>
      <CanvasChart className="cf-canvas" height={height} label={label} deps={deps} draw={draw} />
      <div className="cf-legend">
        {legend.map((l) => (
          <span key={l.text} className="cf-legend__item">
            <i className={`cf-legend__${l.kind}`} aria-hidden="true" />
            {l.text}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Gráficas de control con selector auto / I-MR / X̄-R / X̄-S (drawControlCharts, original 6959-7124). */
export function ControlCharts({ id, r, choice }: Props) {
  const { t, lang } = useCapaT()
  const api = useCapaApi()
  const env = useDrawEnv()
  const cc = useMemo(() => buildControlChartScreen(r, choice, lang), [r, choice, lang])
  const pills: { id: CCTypeChoice; text: string }[] = [
    { id: 'auto', text: `${t('cc.imr_full')} / ${t('cc.xbar_r')} / ${t('cc.xbar_s')}` },
    { id: 'imr', text: t('cc.imr_full') },
    { id: 'xr', text: 'X̄-R' },
    { id: 'xs', text: 'X̄-S' },
  ]
  const topCount = cc.topPts.filter((v) => v !== null).length
  const botCount = cc.botPts.filter((v) => v !== null).length

  return (
    <GlassPanel as="section" className="cf-card" aria-labelledby="cf-cc-title">
      <div className="cf-cc-head">
        <h2 id="cf-cc-title" className="cf-card__title">
          <span className="cf-dot cf-dot--orange" aria-hidden="true" />
          {t('cc.title')}
        </h2>
        <div className="cf-seg" role="group" aria-label={t('cc.title')}>
          {pills.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`cf-seg__btn${choice === p.id ? ' is-on' : ''}`}
              aria-pressed={choice === p.id}
              onClick={() => api.getState().setCCType(id, p.id)}
            >
              {p.text}
            </button>
          ))}
        </div>
      </div>
      <div className="cf-cc-pair">
        <Half
          testId="cf-cc-top"
          label={cc.topLabel}
          count={topCount}
          ooc={cc.topOOC}
          height={180}
          legend={[
            { text: 'X̄ / CL', kind: 'line' },
            { text: 'UCL / LCL', kind: 'dash' },
            { text: '±2σ', kind: 'dash' },
            { text: t('cc.ooc'), kind: 'dot' },
          ]}
          deps={[cc, env]}
          draw={(c) => drawControl(c, { pts: cc.topPts, cl: cc.topCL, ucl: cc.topUCL, lcl: cc.topLCL, sigma: cc.topSigma, viol: cc.topViol, isXbar: true }, env)}
        />
        <Half
          testId="cf-cc-bot"
          label={cc.botLabel}
          count={botCount}
          ooc={cc.botOOC}
          height={160}
          legend={[
            { text: 'R̄ / S̄ / MR̄', kind: 'line' },
            { text: 'UCL', kind: 'dash' },
            { text: t('cc.ooc'), kind: 'dot' },
          ]}
          deps={[cc, env]}
          draw={(c) => drawControl(c, { pts: cc.botPts, cl: cc.botCL, ucl: cc.botUCL, lcl: cc.botLCL, sigma: cc.botSigma, viol: cc.botViol, isXbar: false }, env)}
        />
      </div>
      <p className="cf-note" data-testid="cf-cc-note">{cc.noteText}</p>
    </GlassPanel>
  )
}

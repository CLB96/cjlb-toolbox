import type { ReactNode } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useCapa, useCapaApi } from '../CapaflowStoreProvider'
import { boxPlotNote, drawBoxPlot } from '../draw/drawBoxPlot'
import { drawQQ } from '../draw/drawQQ'
import { drawRunChart } from '../draw/drawRunChart'
import { useCapaT } from '../i18n'
import { buildRunChart, runChartNote, type AnalysisResult } from '../logic'
import type { PanelKey } from '../store'
import { CanvasChart } from './CanvasChart'
import { useDrawEnv } from './useDrawEnv'

interface SectionProps {
  panel: PanelKey
  title: string
  children: ReactNode
}

/** Tarjeta plegable; abierta/cerrada se guarda en el proyecto. */
export function Section({ panel, title, children }: SectionProps) {
  const api = useCapaApi()
  const open = useCapa((s) => s.panels[panel])
  const titleId = `cf-${panel}-title`
  return (
    <GlassPanel as="section" className="cf-card cf-collapsible" aria-labelledby={titleId}>
      <h2 id={titleId} className="cf-card__title">
        <button type="button" className="cf-toggle" aria-expanded={open} onClick={() => api.getState().setPanel(panel, !open)}>
          <span aria-hidden="true">{open ? '▾' : '▸'}</span> {title}
        </button>
      </h2>
      {open && <div className="cf-collapsible__body">{children}</div>}
    </GlassPanel>
  )
}

/** Gráfica de corrida, Q-Q y diagrama de caja (original 4047-4090). */
export function ChartSections({ r }: { r: AnalysisResult }) {
  const { t, lang } = useCapaT()
  const env = useDrawEnv()
  const run = buildRunChart(r, 'screen')
  return (
    <>
      <Section panel="run" title={t('results.runChartTitle')}>
        <CanvasChart className="cf-canvas" height={200} label={t('results.runChartTitle')} deps={[r, env]} draw={(c) => drawRunChart(c, r, env)} />
        <p className="cf-note" data-testid="cf-run-note">{runChartNote(run.runs ?? 0, run.expectedRuns ?? 0, lang)}</p>
      </Section>
      <Section panel="qq" title={t('results.qqTitle')}>
        <CanvasChart className="cf-canvas" height={200} label={t('results.qqTitle')} deps={[r, env]} draw={(c) => drawQQ(c, r, env)} />
        <p className="cf-note">{`${t('qq.qqNote')} Anderson-Darling: p=${r.adTest.p.toFixed(4)}`}</p>
      </Section>
      <Section panel="box" title={t('results.boxPlotTitle')}>
        <CanvasChart className="cf-canvas" height={340} label={t('results.boxPlotTitle')} deps={[r, env]} draw={(c) => void drawBoxPlot(c, r, env)} />
        <p className="cf-note">{boxPlotNote(r)}</p>
      </Section>
    </>
  )
}

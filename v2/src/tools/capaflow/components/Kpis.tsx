import { Fragment, type CSSProperties } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'
import { RichText } from '../../../ui/RichText'
import { useCapaT } from '../i18n'
import { buildInterpretation, classifyCpk, colorForCpk, fmt, type AnalysisResult } from '../logic'

interface KpiProps {
  name: string
  tip: string
  value: number | null
  badge: string
  cls: string
  color: string
  testId: string
}

function Kpi({ name, tip, value, badge, cls, color, testId }: KpiProps) {
  return (
    <GlassPanel className="cf-kpi" style={{ '--kpi-color': color } as CSSProperties} data-testid={testId}>
      <span className="cf-kpi__label">
        {name}{' '}
        <span className="cf-info" title={tip} aria-label={tip} tabIndex={0}>
          ?
        </span>
      </span>
      <span className="cf-kpi__value">{fmt(value)}</span>
      <span className={`cf-pill cf-pill--${cls || 'none'}`}>{badge}</span>
    </GlassPanel>
  )
}

/** Tarjetas semáforo Cpk / Cp / Ppk (renderResults, original 3873-3900). */
export function Kpis({ r }: { r: AnalysisResult }) {
  const { t, lang } = useCapaT()
  const cpk = r.Cpk !== null ? classifyCpk(r.Cpk, lang) : { label: '—', cls: '' }
  const ppk = r.Ppk !== null ? classifyCpk(r.Ppk, lang) : { label: '—', cls: '' }
  const cp = r.Cp !== null ? classifyCpk(r.Cp, lang) : { label: t('classify.potential'), cls: '' }
  const col = (v: number | null) => (v !== null ? colorForCpk(v) : 'var(--accent)')
  return (
    <>
      <Kpi name="Cpk" tip={t('tip.cpk')} value={r.Cpk} badge={cpk.label} cls={cpk.cls} color={col(r.Cpk)} testId="cf-kpi-cpk" />
      <Kpi name="Cp" tip={t('tip.cp')} value={r.Cp} badge={t('classify.potential')} cls={cp.cls} color={col(r.Cp)} testId="cf-kpi-cp" />
      <Kpi name="Ppk" tip={t('tip.ppk')} value={r.Ppk} badge={ppk.label} cls={ppk.cls} color={col(r.Ppk)} testId="cf-kpi-ppk" />
    </>
  )
}

/** Caja "Interpretación Automática": párrafos separados por <br><br>, con <strong>. */
export function Interpretation({ r }: { r: AnalysisResult }) {
  const { t, lang } = useCapaT()
  const html = buildInterpretation(r, lang === 'es')
  return (
    <div className="cf-result" data-testid="cf-interpretation">
      <b>{t('results.interpretation')}</b>
      {html.split('<br><br>').map((line, i) => (
        <Fragment key={i}>
          <p>
            <RichText text={line} />
          </p>
        </Fragment>
      ))}
    </div>
  )
}

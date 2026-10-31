import { GlassPanel } from '../../../ui/GlassPanel'
import { useCapaT } from '../i18n'
import { colorForCpk, fmt, fmtN, type AnalysisResult } from '../logic'

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <table className="cf-table">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Estadísticas del proceso y Todos los Índices (original 3967-4045). */
export function StatsCards({ r }: { r: AnalysisResult }) {
  const { t } = useCapaT()
  const stats: [string, string][] = [
    [t('stats.n'), String(r.N)],
    [t('stats.mean'), fmt(r.xBar, 4)],
    [t('stats.median'), fmt(r.med, 4)],
    [t('stats.stdOverall'), fmt(r.sOverall, 4)],
    [t('stats.stdWithin'), fmt(r.sWithin, 4)],
    [t('stats.min'), fmt(r.minV, 4)],
    [t('stats.max'), fmt(r.maxV, 4)],
    [t('stats.range'), fmt(r.range, 4)],
    [t('stats.lsl'), r.hasLSL ? fmt(r.lsl, 3) : '—'],
    [t('stats.usl'), r.hasUSL ? fmt(r.usl, 3) : '—'],
  ]
  if (!isNaN(r.targetVal)) stats.push([t('stats.target'), fmt(r.targetVal, 3)])
  const ppkColor = r.Ppk !== null ? colorForCpk(r.Ppk) : 'var(--accent)'
  const cpkColor = r.Cpk !== null ? colorForCpk(r.Cpk) : 'var(--accent)'

  return (
    <div className="cf-two">
      <GlassPanel as="section" className="cf-card" aria-labelledby="cf-stats-title">
        <h2 id="cf-stats-title" className="cf-card__title">
          <span className="cf-dot" aria-hidden="true" />
          {t('results.statsTitle')}
        </h2>
        <Rows rows={stats} />
      </GlassPanel>
      <GlassPanel as="section" className="cf-card" aria-labelledby="cf-idx-title">
        <h2 id="cf-idx-title" className="cf-card__title">
          <span className="cf-dot cf-dot--warn" aria-hidden="true" />
          {t('results.indicesTitle')}
        </h2>
        <div className="cf-group">{t('results.capacity')}</div>
        <Rows rows={[['Cp', fmt(r.Cp)], ['Cpk', fmt(r.Cpk)], ['Cpu', fmt(r.Cpu)], ['Cpl', fmt(r.Cpl)], [t('idx.cpmLabel'), fmt(r.Cpm)], [t('idx.cmkLabel'), fmt(r.Cmk)]]} />
        <div className="cf-group">{t('results.performance')}</div>
        <Rows rows={[['Pp', fmt(r.Pp)], ['Ppk', fmt(r.Ppk)], ['Ppu', fmt(r.Ppu)], ['Ppl', fmt(r.Ppl)]]} />
        <div className="cf-ppm">
          <span>{t('results.ppmCpk')}</span>
          <strong style={{ color: cpkColor }} data-testid="cf-ppm-cpk">{fmtN(r.ppm)}</strong>
        </div>
        <div className="cf-ppm">
          <span>{t('results.ppmPpk')}</span>
          <strong style={{ color: ppkColor }} data-testid="cf-ppm-ppk">{fmtN(r.ppmOverall)}</strong>
        </div>
      </GlassPanel>
    </div>
  )
}

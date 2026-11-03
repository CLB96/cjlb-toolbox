import { useI18n } from '../../../i18n/useI18n'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useGageflow } from '../GageflowStoreProvider'
import { useGageflowT } from '../i18n'
import { avisoTexto, issueTexto } from '../i18nIssues'

/** Lo que conviene saber del archivo aunque el estudio se haya podido calcular. */
export function AvisosArchivo() {
  const t = useGageflowT()
  const { lang } = useI18n()
  const issues = useGageflow((s) => s.issues)
  const avisos = useGageflow((s) => s.avisos)
  const delLector = issues.filter((i) => i.severidad === 'aviso')
  if (delLector.length === 0 && avisos.length === 0) return null

  return (
    <GlassPanel className="gf-panel">
      <div className="gf-cab"><span className="gf-t">{t('avisos')}</span></div>
      <ul className="gf-issues">
        {delLector.map((i, k) => (
          <li key={`a-${k}`} className="gf-issue gf-issue--avi">
            <b aria-hidden="true">!</b><span>{issueTexto(i, lang)}</span>
          </li>
        ))}
        {avisos.map((a, k) => (
          <li key={`d-${k}`} className="gf-issue gf-issue--avi">
            <b aria-hidden="true">!</b><span>{avisoTexto(a, lang)}</span>
          </li>
        ))}
      </ul>
    </GlassPanel>
  )
}

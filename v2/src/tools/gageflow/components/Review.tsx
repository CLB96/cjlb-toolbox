import { useGageflow, useGageflowApi } from '../GageflowStoreProvider'
import { useGageflowT } from '../i18n'
import { avisoTexto, issueTexto, prefijoFila, totalFilas } from '../i18nIssues'
import { useI18n } from '../../../i18n/useI18n'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { generarPlantilla } from '../export/generarPlantilla'
import { descargarBlob, nombreArchivo } from '../export/descargar'

export function Review({ onCambiar }: { onCambiar: () => void }) {
  const api = useGageflowApi()
  const t = useGageflowT()
  const { lang } = useI18n()
  const archivo = useGageflow((s) => s.archivo)
  const issues = useGageflow((s) => s.issues)
  const avisos = useGageflow((s) => s.avisos)
  const diseno = useGageflow((s) => s.diseno)
  const estudio = useGageflow((s) => s.estudio)

  const errores = issues.filter((i) => i.severidad === 'error')
  const avisosParser = issues.filter((i) => i.severidad === 'aviso')
  const listo = errores.length === 0 && diseno !== null

  const plantilla = async () => {
    const buffer = await generarPlantilla({
      piezas: Array.from({ length: estudio.piezas }, (_, i) => String(i + 1)),
      operadores: estudio.operadores.filter((o) => o.trim() !== ''),
      ensayos: estudio.ensayos,
    })
    descargarBlob(new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }), nombreArchivo(estudio.pieza, 'xlsx'))
  }

  return (
    <>
      <GlassPanel className="gf-panel gf-filebar">
        <span className="gf-filebar__icon" aria-hidden="true">▤</span>
        <div>
          <div className="gf-filebar__n">{archivo?.nombre ?? '—'}</div>
          <div className="gf-n">
            {archivo ? `«${archivo.hoja}» · ${totalFilas(archivo.filas, lang)}` : ''}
          </div>
        </div>
        <span className="gf-spacer" />
        <Button variant="ghost" onClick={onCambiar}>{t('cambiarArchivo')}</Button>
      </GlassPanel>

      <GlassPanel className={`gf-panel gf-verdict gf-verdict--${listo ? 'ok' : 'warn'}`}>
        <span className={`gf-pill gf-pill--${listo ? 'ok' : 'warn'}`}>
          {listo ? t('faltanDatos') : `${errores.length} ${t('errores')}`}
        </span>
        <div>
          <div className="gf-verdict__t">{listo ? t('faltanDatosTitulo') : t('revisionTitulo')}</div>
          <div className="gf-n">{listo ? t('faltanDatosSub') : t('revisionSub')}</div>
        </div>
      </GlassPanel>

      <div className="gf-cols">
        <GlassPanel className="gf-panel">
          <div className="gf-cab"><span className="gf-t">{t('queCorregir')}</span>
            <span className="gf-n">{errores.length} {t('errores')} · {avisosParser.length + avisos.length} {t('avisos')}</span></div>
          {errores.length === 0 && avisosParser.length === 0 && avisos.length === 0 && (
            <p className="gf-n">{t('balanceado')}: {t('si')}</p>
          )}
          <ul className="gf-issues">
            {errores.slice(0, 10).map((i, k) => (
              <li key={`e-${k}`} className="gf-issue gf-issue--mal">
                <b aria-hidden="true">✖</b>
                <span>{i.fila ? prefijoFila(i.fila, lang) : ''}{issueTexto(i, lang)}</span>
              </li>
            ))}
            {avisosParser.map((i, k) => (
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

        <div className="gf-col">
          <GlassPanel className="gf-panel">
            <div className="gf-cab"><span className="gf-t">{t('resumen')}</span></div>
            <dl className="gf-mini">
              <div><dt>{t('formato')}</dt><dd>{archivo?.layout === 'wide' ? t('formatoAiag') : t('formatoLargo')}</dd></div>
              <div><dt>{t('lecturasConValor')}</dt><dd>{archivo?.resumen.lecturas ?? 0}</dd></div>
              <div><dt>{t('piezas')}</dt><dd>{archivo?.resumen.piezas ?? 0}</dd></div>
              <div><dt>{t('operadores')}</dt><dd>{archivo?.resumen.operadores.length ?? 0}</dd></div>
              <div><dt>{t('ensayos')}</dt><dd>{archivo?.resumen.ensayos ?? 0}</dd></div>
              <div><dt>{t('balanceado')}</dt><dd>{listo ? t('si') : t('no')}</dd></div>
            </dl>
          </GlassPanel>
          <GlassPanel className="gf-panel">
            <div className="gf-cab"><span className="gf-t">{t('descargarPlantilla')}</span></div>
            <p className="gf-n">{t('pasoB')}</p>
            <div className="gf-acciones">
              <Button variant="ghost" onClick={() => void plantilla()}>{t('descargarPlantilla')}</Button>
            </div>
          </GlassPanel>
        </div>
      </div>

      <div className="gf-acciones gf-acciones--pie">
        <Button variant="ghost" onClick={() => api.getState().limpiarArchivo()}>{t('nuevoEstudio')}</Button>
      </div>
    </>
  )
}

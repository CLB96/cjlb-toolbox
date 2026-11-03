import { aMatriz } from '../logic/parse'
import { useGageflow, useGageflowApi } from '../GageflowStoreProvider'
import { useGageflowT, type GageflowKey } from '../i18n'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { toast } from '../../../ui/toastStore'
import { useI18n } from '../../../i18n/useI18n'
import { ComponentesChart, InteraccionChart } from './charts'
import { construirModeloPng } from '../export/pngModel'
import { exportarPng } from '../export/exportPng'
import { exportarPdf } from '../export/exportPdf'
import { exportarExcel } from '../export/exportExcel'

const pct = (n: number, d = 1) => `${n.toFixed(d)} %`
const num = (n: number, d = 3) => n.toFixed(d)

function Kpi({ etiqueta, valor, nota, color, ancho }: {
  etiqueta: string; valor: string; nota: string; color: string; ancho: number
}) {
  return (
    <GlassPanel className="gf-kpi">
      <span className="gf-kpi__l">{etiqueta}</span>
      <span className="gf-kpi__v" style={{ color }}>{valor}</span>
      <span className="gf-kpi__b"><i style={{ width: `${Math.min(100, ancho)}%`, background: color }} /></span>
      <span className="gf-kpi__n">{nota}</span>
    </GlassPanel>
  )
}

const COLOR = { ok: '#7cf0c4', warn: '#ffd166', mal: '#ff8a9b' }

export function Results() {
  const api = useGageflowApi()
  const t = useGageflowT()
  const { lang } = useI18n()
  const resultado = useGageflow((s) => s.resultado)
  const diseno = useGageflow((s) => s.diseno)
  const lecturas = useGageflow((s) => s.lecturas)
  const estudio = useGageflow((s) => s.estudio)
  const normalizado = useGageflow((s) => s.validacion.estudio)

  if (!resultado || !resultado.ok || !diseno) {
    return (
      <GlassPanel className="gf-panel">
        <p className="gf-n">
          {resultado?.errores.includes('sinVariacion') ? t('sinVariacionTexto') : t('revisionSub')}
        </p>
        <div className="gf-acciones">
          <Button variant="ghost" onClick={() => api.getState().limpiarArchivo()}>{t('nuevoEstudio')}</Button>
        </div>
      </GlassPanel>
    )
  }

  const matriz = aMatriz(lecturas, diseno) as number[][][]
  const conTol = resultado.pctGrrTolerancia !== null
  const grr = resultado.pctGrrTolerancia ?? resultado.pctGrrVariacion
  const colorV = resultado.veredicto === 'aceptable' ? COLOR.ok
    : resultado.veredicto === 'condicional' ? COLOR.warn : COLOR.mal
  const textoV = resultado.veredicto === 'aceptable' ? t('vAceptable')
    : resultado.veredicto === 'condicional' ? t('vCondicional') : t('vNoAceptable')
  const detalleV = resultado.veredicto === 'aceptable' ? t('vAceptableTexto')
    : resultado.veredicto === 'condicional' ? t('vCondicionalTexto') : t('vNoAceptableTexto')

  const lsl = normalizado?.lsl ?? null
  const usl = normalizado?.usl ?? null
  const nominal = normalizado?.nominal ?? null
  const especificacion = lsl !== null && usl !== null
    ? `${t('tolerancia')} ${lsl} – ${usl}`
    : '—'

  const modelo = () => construirModeloPng(resultado, diseno, matriz, {
    pieza: estudio.pieza,
    caracteristica: estudio.caracteristica,
    especificacion,
    lang,
    nominal: nominal ?? undefined,
  })

  const descargar = async (que: 'png' | 'pdf' | 'xlsx') => {
    try {
      if (que === 'png') await exportarPng(modelo(), estudio.pieza)
      else if (que === 'pdf') exportarPdf(modelo(), estudio.pieza)
      else {
        await exportarExcel(resultado, diseno, lecturas, {
          pieza: estudio.pieza, caracteristica: estudio.caracteristica, especificacion, lang,
        })
      }
    } catch {
      toast('error', t('revisionSub'))
    }
  }

  const nombres: Record<string, string> = {
    pieza: t('filaPieza'), operador: t('filaOperador'),
    interaccion: t('filaInteraccion'), error: t('filaError'),
  }
  const recs: Record<string, GageflowKey> = {
    repetibilidad: 'recRepetibilidad',
    reproducibilidad: 'recReproducibilidad',
    interaccion: 'recInteraccion',
    pocasPiezas: 'recPocasPiezas',
    pocosEnsayos: 'recPocosEnsayos',
    sinLimites: 'recSinLimites',
  }

  const c = resultado.componentes
  const xbar = resultado.xbarR

  return (
    <>
      <div className="gf-top">
        <GlassPanel className="gf-verdict">
          <span className="gf-anillo" style={{ background: `conic-gradient(${colorV} ${Math.min(99, grr)}%, var(--track) 0)` }}>
            <i style={{ color: colorV }}>{pct(grr)}</i>
          </span>
          <div>
            <div className="gf-verdict__t" style={{ color: colorV }}>{textoV}</div>
            <p className="gf-n">{detalleV}</p>
          </div>
        </GlassPanel>
        <GlassPanel className="gf-panel">
          <div className="gf-cab"><span className="gf-t">{t('metodoTitulo')}</span>
            <span className="gf-n">AIAG MSA 4ª ed.</span></div>
          <dl className="gf-mini">
            <div><dt>{t('modelo')}</dt><dd>{t('modeloAnova')}</dd></div>
            <div><dt>GRR</dt><dd>{num(c.grr.seis, 4)} mm (6σ)</dd></div>
            <div><dt>{t('variacionTotal')}</dt><dd>{num(c.total.seis, 4)} mm</dd></div>
            <div><dt>{t('tolerancia')}</dt><dd>{resultado.anchoTolerancia ? `${num(resultado.anchoTolerancia, 2)} mm` : '—'}</dd></div>
          </dl>
        </GlassPanel>
      </div>

      <div className="gf-kpis">
        <Kpi etiqueta={t('kpiGrr')} valor={conTol ? pct(grr) : '—'} nota={t('limite')} color={colorV} ancho={grr} />
        <Kpi etiqueta={t('kpiNdc')} valor={String(resultado.ndc)} nota={t('minimo')} color={COLOR.ok} ancho={resultado.ndc * 10} />
        <Kpi etiqueta={t('kpiEv')} valor={`${num(c.ev.seis)} mm`}
          nota={t('deTolerancia', { pct: pct(c.ev.pctTolerancia ?? 0) })} color="#8fb4ff" ancho={c.ev.pctTolerancia ?? 0} />
        <Kpi etiqueta={t('kpiAv')} valor={`${num(c.av.seis)} mm`}
          nota={t('deTolerancia', { pct: pct(c.av.pctTolerancia ?? 0) })} color="#d16bff" ancho={c.av.pctTolerancia ?? 0} />
      </div>

      <div className="gf-charts">
        <GlassPanel className="gf-panel">
          <div className="gf-cab"><span className="gf-t">{t('componentes')}</span>
            <span className="gf-n">{resultado.anchoTolerancia
              ? t('frenteTolerancia', { ancho: num(resultado.anchoTolerancia, 2) })
              : t('sinLimites')}</span></div>
          <ComponentesChart componentes={c} />
        </GlassPanel>
        <GlassPanel className="gf-panel">
          <div className="gf-cab"><span className="gf-t">{t('interaccion')}</span>
            <span className="gf-n">p = {(resultado.anova.find((f) => f.fuente === 'interaccion')?.p ?? 0).toFixed(2)}</span></div>
          <InteraccionChart diseno={diseno} matriz={matriz} />
        </GlassPanel>
      </div>

      <div className="gf-cols">
        <div className="gf-col">
          <GlassPanel className="gf-panel">
            <div className="gf-cab"><span className="gf-t">{t('anova')}</span>
              <span className="gf-n">{xbar && conTol
                ? t('comprobacion', { grr: num(6 * xbar.grr), pct: pct(xbar.pctTolerancia ?? 0) })
                : ''}</span></div>
            <table className="gf-tabla">
              <thead>
                <tr>
                  <th>{t('fuente')}</th><th className="gf-num">{t('gl')}</th><th className="gf-num">{t('ss')}</th>
                  <th className="gf-num">{t('ms')}</th><th className="gf-num">{t('f')}</th><th className="gf-num">{t('p')}</th>
                </tr>
              </thead>
              <tbody>
                {resultado.anova.map((f) => (
                  <tr key={f.fuente} className={f.fuente === 'error' ? 'gf-fila--error' : ''}>
                    <td>{nombres[f.fuente]}</td>
                    <td className="gf-num">{f.gl}</td>
                    <td className="gf-num">{f.ss.toFixed(6)}</td>
                    <td className="gf-num">{f.ms.toFixed(6)}</td>
                    <td className="gf-num">{f.f === null ? '—' : f.f.toFixed(2)}</td>
                    <td className="gf-num">{f.p === null ? '—' : f.p < 0.0001 ? '< 0.0001' : f.p.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassPanel>

          <GlassPanel className="gf-panel">
            <div className="gf-cab"><span className="gf-t">{t('plan')}</span>
              <span className="gf-n">{t('planNota')}</span></div>
            <ul className="gf-plan">
              {resultado.recomendaciones.length === 0 && <li>{t('sinAcciones')}</li>}
              {resultado.recomendaciones.map((r) => (
                <li key={r}>{t(recs[r] ?? 'recSinLimites', {
                  pct: pct(c.ev.pctTolerancia ?? 0), n: resultado.ndc,
                })}</li>
              ))}
            </ul>
          </GlassPanel>
        </div>

        <div className="gf-col">
          <GlassPanel className="gf-panel">
            <div className="gf-cab"><span className="gf-t">{t('porOperador')}</span>
              <span className="gf-n">{t('sesgoNominal')}</span></div>
            <table className="gf-tabla">
              <thead><tr><th></th><th className="gf-num">{t('media')}</th><th className="gf-num">{t('sesgo')}</th></tr></thead>
              <tbody>
                {diseno.operadores.map((op, j) => {
                  const valores = matriz.map((fila) => fila[j]).flat()
                  const media = valores.reduce((a, b) => a + b, 0) / valores.length
                  const sesgo = nominal !== null ? (media - nominal) * 1000 : null
                  return (
                    <tr key={op}>
                      <td>{op}</td>
                      <td className="gf-num">{media.toFixed(4)}</td>
                      <td className="gf-num">{sesgo === null ? '—' : `${sesgo >= 0 ? '+' : ''}${sesgo.toFixed(1)} µm`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </GlassPanel>
          <GlassPanel className="gf-panel">
            <div className="gf-cab"><span className="gf-t">{t('comoSeCalculo')}</span>
              <span className="gf-n">{t('sinServidores')}</span></div>
            <dl className="gf-mini">
              <div><dt>{t('metodo')}</dt><dd>{t('metodoAnova')}</dd></div>
              <div><dt>{t('lecturas')}</dt><dd>{lecturas.length}</dd></div>
              <div><dt>{t('nivelConfianza')}</dt><dd>{estudio.confianza} %</dd></div>
              <div><dt>ndc</dt><dd>{t('ndcFormula')}</dd></div>
              <div><dt>{t('criterio')}</dt><dd>10 % / 30 %</dd></div>
            </dl>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel className="gf-acciones gf-acciones--pie">
        <Button onClick={() => void descargar('png')}>{t('descargarPng')}</Button>
        <Button variant="ghost" onClick={() => void descargar('pdf')}>{t('descargarPdf')}</Button>
        <Button variant="ghost" onClick={() => void descargar('xlsx')}>{t('exportarExcel')}</Button>
        <span className="gf-spacer" />
        <Button variant="ghost" onClick={() => api.getState().limpiarArchivo()}>{t('nuevoEstudio')}</Button>
      </GlassPanel>
    </>
  )
}

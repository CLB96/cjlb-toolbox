import { useGageflowApi, useGageflow } from '../GageflowStoreProvider'
import { errorFormTexto, useGageflowT, type GageflowKey } from '../i18n'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { LIMITES_FORM, type CampoEstudio } from '../logic/estudioForm'

interface CampoProps {
  etiqueta: string
  valor: string
  onChange: (v: string) => void
  error?: string
  pista?: string
  tipo?: 'text' | 'number'
  id: string
}

function Campo({ etiqueta, valor, onChange, error, pista, tipo = 'text', id }: CampoProps) {
  return (
    <div className="gf-campo">
      <label className="gf-campo__l" htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        className={`gf-input${error ? ' gf-input--mal' : ''}`}
        type={tipo}
        inputMode={tipo === 'number' ? 'decimal' : undefined}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <span className="gf-error" id={`${id}-error`} role="alert">{error}</span>}
      {!error && pista && <span className="gf-pista">{pista}</span>}
    </div>
  )
}

export function SetupForm() {
  const api = useGageflowApi()
  const t = useGageflowT()
  const estudio = useGageflow((s) => s.estudio)
  const validacion = useGageflow((s) => s.validacion)

  const errorDe = (campo: CampoEstudio): string | undefined => {
    const e = validacion.errores.find((x) => x.campo === campo)
    return e ? t(errorFormTexto(e.codigo) as GageflowKey) : undefined
  }

  const lsl = Number(estudio.lsl.replace(',', '.'))
  const usl = Number(estudio.usl.replace(',', '.'))
  const conLimites = estudio.lsl.trim() !== '' && estudio.usl.trim() !== '' && usl > lsl
  const lecturas = estudio.piezas * estudio.operadores.length * estudio.ensayos

  return (
    <GlassPanel className="gf-panel">
      <div className="gf-cab">
        <span className="gf-t">{t('seccionId')}</span>
        <span className="gf-n">{t('seccionIdNota')}</span>
      </div>
      <div className="gf-grid2">
        <Campo id="gf-pieza" etiqueta={t('pieza')} valor={estudio.pieza}
          onChange={(v) => api.getState().setCampo('pieza', v)} error={errorDe('pieza')} />
        <Campo id="gf-car" etiqueta={t('caracteristica')} valor={estudio.caracteristica}
          onChange={(v) => api.getState().setCampo('caracteristica', v)} error={errorDe('caracteristica')} />
        <Campo id="gf-uni" etiqueta={t('unidad')} valor={estudio.unidad}
          onChange={(v) => api.getState().setCampo('unidad', v)} error={errorDe('unidad')} />
        <Campo id="gf-res" etiqueta={t('resolucion')} valor={estudio.resolucion} tipo="number"
          onChange={(v) => api.getState().setCampo('resolucion', v)} error={errorDe('resolucion')}
          pista={conLimites ? t('divisiones', { n: Math.round((usl - lsl) / Number(estudio.resolucion || '1')) }) : undefined} />
      </div>

      <div className="gf-cab gf-cab--sep">
        <span className="gf-t">{t('seccionSpec')}</span>
        <span className="gf-n">{t('seccionSpecNota')}</span>
      </div>
      <div className="gf-grid3">
        <Campo id="gf-nom" etiqueta={t('nominal')} valor={estudio.nominal} tipo="number"
          onChange={(v) => api.getState().setCampo('nominal', v)} error={errorDe('nominal')} />
        <Campo id="gf-lsl" etiqueta={t('lsl')} valor={estudio.lsl} tipo="number"
          onChange={(v) => api.getState().setCampo('lsl', v)} error={errorDe('lsl')} />
        <Campo id="gf-usl" etiqueta={t('usl')} valor={estudio.usl} tipo="number"
          onChange={(v) => api.getState().setCampo('usl', v)} error={errorDe('usl')} />
      </div>

      <div className="gf-cab gf-cab--sep">
        <span className="gf-t">{t('seccionDiseno')}</span>
        <span className="gf-n">{t('lecturasEsperadas')}</span>
      </div>
      <div className="gf-grid2">
        <Campo id="gf-piezas" etiqueta={t('piezas')} valor={String(estudio.piezas)} tipo="number"
          onChange={(v) => api.getState().setCampo('piezas', Number(v) || 0)} error={errorDe('piezas')}
          pista={`${LIMITES_FORM.piezas.min}–${LIMITES_FORM.piezas.max}`} />
        <Campo id="gf-ensayos" etiqueta={t('ensayos')} valor={String(estudio.ensayos)} tipo="number"
          onChange={(v) => api.getState().setCampo('ensayos', Number(v) || 0)} error={errorDe('ensayos')}
          pista={`${LIMITES_FORM.ensayos.min}–${LIMITES_FORM.ensayos.max}`} />
      </div>

      <div className="gf-campo gf-campo--ancho">
        <span className="gf-campo__l">{t('operadores')}</span>
        <div className="gf-ops">
          {estudio.operadores.map((op, i) => (
            <span className="gf-op" key={`op-${i}`}>
              <input
                className="gf-input gf-input--op"
                aria-label={`${t('operadores')} ${i + 1}`}
                value={op}
                onChange={(e) => api.getState().setOperador(i, e.target.value)}
              />
              <Button variant="ghost" aria-label={t('quitarOperador')}
                onClick={() => api.getState().quitarOperador(i)}>×</Button>
            </span>
          ))}
          <Button variant="ghost" onClick={() => api.getState().agregarOperador()}>
            + {t('agregarOperador')}
          </Button>
        </div>
        {errorDe('operadores') && <span className="gf-error" role="alert">{errorDe('operadores')}</span>}
      </div>

      <ul className="gf-checks">
        {conLimites && (
          <li>✓ {t('checkLimites', { lsl: estudio.lsl, usl: estudio.usl })}</li>
        )}
        {validacion.errores.length === 0 && (
          <li>✓ {t('checkOperadores', { n: estudio.operadores.length })}</li>
        )}
        {validacion.ok && (
          <li>✓ {t('checkLecturas', {
            a: estudio.piezas, b: estudio.operadores.length, c: estudio.ensayos, n: lecturas,
          })}</li>
        )}
      </ul>
    </GlassPanel>
  )
}

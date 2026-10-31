import { useShallow } from 'zustand/react/shallow'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useCapa, useCapaApi } from '../CapaflowStoreProvider'
import { INLINE, useCapaT } from '../i18n'

interface Props {
  disabled: boolean
  onNewPoint: () => void
  /** Fase 2b: Generar Resumen comparativo y ZIP del proyecto. */
  onSummary: () => void
  onZip: () => void
}

/** Barra del proyecto: los puntos como pestañas (reemplazan el carrusel ← → del original). */
export function ProjectBar({ disabled, onNewPoint, onSummary, onZip }: Props) {
  const { t, lang } = useCapaT()
  const api = useCapaApi()
  const { points, activeId } = useCapa(useShallow((s) => ({ points: s.points, activeId: s.activeId })))
  const pending = t('v2.pending')
  return (
    <GlassPanel className="cf-project">
      <span className="cf-sub">{t('folder.title')}</span>
      <div className="cf-points" role="group" aria-label={t('folder.title')}>
        {points.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`cf-point${p.id === activeId ? ' is-on' : ''}`}
            aria-pressed={p.id === activeId}
            disabled={disabled}
            onClick={() => api.getState().selectPoint(p.id)}
          >
            {p.result.pointName || INLINE.pointTitle(lang, p.id)}
          </button>
        ))}
        <button type="button" className="cf-point cf-point--new" disabled={disabled} onClick={onNewPoint}>
          {t('v2.newPoint')}
        </button>
      </div>
      <div className="cf-head__actions">
        <Button variant="ghost" title={pending} onClick={onSummary}>{t('summary.genBtn')}</Button>
        <Button variant="ghost" title={pending} onClick={onZip}>{t('folder.downloadZip')}</Button>
      </div>
    </GlassPanel>
  )
}

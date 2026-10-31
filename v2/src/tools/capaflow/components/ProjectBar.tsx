import { useShallow } from 'zustand/react/shallow'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useCapa, useCapaApi } from '../CapaflowStoreProvider'
import { INLINE, useCapaT } from '../i18n'

interface Props {
  disabled: boolean
  onNewPoint: () => void
  onSummary: () => void
  onZip: () => void
  summaryBusy?: boolean
  /** Texto de avance del ZIP mientras se genera (null = en reposo). */
  zipLabel?: string | null
}

/** Barra del proyecto: los puntos como pestañas (reemplazan el carrusel ← → del original). */
export function ProjectBar({ disabled, onNewPoint, onSummary, onZip, summaryBusy = false, zipLabel = null }: Props) {
  const { t, lang } = useCapaT()
  const api = useCapaApi()
  const { points, activeId, projectName } = useCapa(useShallow((s) => ({ points: s.points, activeId: s.activeId, projectName: s.projectName })))
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
        <input
          className="cf-input cf-project__name"
          value={projectName}
          placeholder={t('folder.namePlaceholder')}
          aria-label={t('folder.namePlaceholder')}
          disabled={disabled}
          onChange={(e) => api.getState().setProjectName(e.target.value)}
        />
        <Button variant="ghost" onClick={onSummary} disabled={disabled || summaryBusy || points.length === 0}>
          {summaryBusy ? t('summary.generating') : t('summary.genBtn')}
        </Button>
        <Button variant="ghost" onClick={onZip} disabled={disabled || zipLabel !== null || points.length === 0}>
          {zipLabel ?? t('folder.downloadZip')}
        </Button>
      </div>
    </GlassPanel>
  )
}

import { SavedIndicator } from '../../../persistence/SavedIndicator'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useCapaT } from '../i18n'

interface Props {
  lastSavedAt: number | null
  disabled: boolean
  onHistory: () => void
  /** Fase 2b: Resumen Ejecutivo PNG, Guía de Lectura y Conversor MWX/MWP/MPX. */
  onExport: () => void
  onGuide: () => void
  onConverter: () => void
}

/** Franja superior del mockup: título, guardado y acciones. */
export function Header({ lastSavedAt, disabled, onHistory, onExport, onGuide, onConverter }: Props) {
  const { t } = useCapaT()
  const pending = t('v2.pending')
  return (
    <GlassPanel as="header" className="cf-head">
      <h1 className="cf-head__title">CapaFlow</h1>
      <span className="cf-muted">{t('header.sub')}</span>
      <SavedIndicator lastSavedAt={lastSavedAt} />
      <div className="cf-head__actions">
        <Button variant="ghost" onClick={onHistory} disabled={disabled}>{t('v2.history')}</Button>
        <Button variant="ghost" title={pending} onClick={onGuide}>{`📖 ${t('panel.guideTitle')}`}</Button>
        <Button variant="ghost" title={pending} onClick={onConverter}>{`🔄 ${t('panel.mwxTitle')}`}</Button>
        <Button title={pending} onClick={onExport}>{`⬇ ${t('panel.exportTitle')}`}</Button>
      </div>
    </GlassPanel>
  )
}

import { SavedIndicator } from '../../../persistence/SavedIndicator'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useCapaT } from '../i18n'

interface Props {
  lastSavedAt: number | null
  disabled: boolean
  onHistory: () => void
  onExport: () => void
  exportBusy?: boolean
  onGuide: () => void
  onConverter: () => void
}

/** Franja superior del mockup: título, guardado y acciones. */
export function Header({ lastSavedAt, disabled, onHistory, onExport, onGuide, onConverter, exportBusy = false }: Props) {
  const { t } = useCapaT()
  return (
    <GlassPanel as="header" className="cf-head">
      <h1 className="cf-head__title">CapaFlow</h1>
      <span className="cf-muted">{t('header.sub')}</span>
      <SavedIndicator lastSavedAt={lastSavedAt} />
      <div className="cf-head__actions">
        <Button variant="ghost" onClick={onHistory} disabled={disabled}>{t('v2.history')}</Button>
        <Button variant="ghost" onClick={onGuide}>{`📖 ${t('panel.guideTitle')}`}</Button>
        <Button variant="ghost" onClick={onConverter}>{`🔄 ${t('panel.mwxTitle')}`}</Button>
        <Button onClick={onExport} disabled={exportBusy}>{`⬇ ${t('panel.exportTitle')}`}</Button>
      </div>
    </GlassPanel>
  )
}

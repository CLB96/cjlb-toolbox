import { SavedIndicator } from '../../../persistence/SavedIndicator'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useGanttT } from '../i18n'
import { formatHuman } from '../logic/dates'
import { ChartPicker } from './ChartPicker'

interface Props {
  today: Date
  pct: number
  lastSavedAt: number | null
  disabled: boolean
  onHistory: () => void
  onExcel: () => void
  onPng: () => void
}

/** Franja superior del mockup: título, selector de Gantts, hoy, % completado, guardado y acciones. */
export function Header({ today, pct, lastSavedAt, disabled, onHistory, onExcel, onPng }: Props) {
  const { t, lang } = useGanttT()
  return (
    <GlassPanel as="header" className="gt-head">
      <h1 className="gt-head__title">{t('appTitle')}</h1>
      <ChartPicker disabled={disabled} />
      <span className="gt-chip gt-chip--today">{`${t('todayPrefix')} · ${formatHuman(today, lang)}`}</span>
      <span className="gt-chip gt-chip--pct">{t('pctBadge', pct)}</span>
      <SavedIndicator lastSavedAt={lastSavedAt} />
      <div className="gt-head__actions">
        <Button variant="ghost" onClick={onHistory} disabled={disabled}>
          {t('history')}
        </Button>
        <Button variant="ghost" onClick={onExcel} disabled={disabled}>
          {t('menuExportExcel')}
        </Button>
        <Button onClick={onPng} disabled={disabled}>
          {t('menuExportPNG')}
        </Button>
      </div>
    </GlassPanel>
  )
}

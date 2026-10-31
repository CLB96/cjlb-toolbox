import { SavedIndicator } from '../../../persistence/SavedIndicator'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useGanttT } from '../i18n'
import { useRef } from 'react'
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
  onImport: (file: File) => void
}

/** Franja superior del mockup: título, selector de Gantts, hoy, % completado, guardado y acciones. */
export function Header({ today, pct, lastSavedAt, disabled, onHistory, onExcel, onPng, onImport }: Props) {
  const { t, lang } = useGanttT()
  const fileRef = useRef<HTMLInputElement>(null)
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
        <Button variant="ghost" onClick={() => fileRef.current?.click()} disabled={disabled}>
          {t('importExcel')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          hidden
          aria-label={t('importExcel')}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) onImport(file)
          }}
        />
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

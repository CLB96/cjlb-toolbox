import { useShallow } from 'zustand/react/shallow'
import { SavedIndicator } from '../../../persistence/SavedIndicator'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useBondline, useBondlineApi } from '../BondlineStoreProvider'
import { STATIC_TEXTS, useBondlineT } from '../i18n'
import { selectActiveSheet } from '../store'
import { FileInput } from './EmptyState'

interface Props {
  lastSavedAt: number | null
  disabled: boolean
  onFile: (file: File) => void
  onSelectSheet: (index: number) => void
  onDefaults: () => void
  onHistory: () => void
  /** Descarga PNG (Task 9); sin él no se muestra el botón. */
  onExport?: () => void
}

/** Franja superior (R6): archivo, hoja activa, fecha de prueba, guardado y acciones. */
export function Header({ lastSavedAt, disabled, onFile, onSelectSheet, onDefaults, onHistory, onExport }: Props) {
  const t = useBondlineT()
  const api = useBondlineApi()
  const fileName = useBondline((s) => s.fileName)
  const data = useBondline(selectActiveSheet)
  const sheetNames = useBondline(useShallow((s) => s.sheets.map((sh) => sh.name)))
  const sheetIndex = useBondline((s) => s.sheetIndex)
  const testDate = useBondline((s) => s.config.testDate)
  const loaded = data !== null

  return (
    <GlassPanel as="header" className="bl-head">
      <h1 className="bl-head__title">{t('appTitle')}</h1>
      {loaded && (
        <span className="bl-chip">
          <span aria-hidden="true">📂</span>
          <strong>{fileName}</strong>
          <span aria-hidden="true">·</span>
          <span>{t('fileDims', data.totalRows, data.columns.length)}</span>
        </span>
      )}
      {loaded && sheetNames.length > 1 && (
        <div className="bl-sheet" role="group" aria-labelledby="bl-sheet-label">
          <span id="bl-sheet-label" className="bl-sub">
            {STATIC_TEXTS.activeSheet}
          </span>
          <div className="bl-sheet__nav">
            <button
              type="button"
              className="bl-icon-btn"
              title={STATIC_TEXTS.prevSheet}
              disabled={disabled || sheetIndex <= 0}
              onClick={() => onSelectSheet(sheetIndex - 1)}
            >
              ←
            </button>
            <select
              className="bl-input bl-sheet__select"
              aria-labelledby="bl-sheet-label"
              value={String(sheetIndex)}
              disabled={disabled}
              onChange={(e) => onSelectSheet(Number(e.target.value))}
            >
              {sheetNames.map((name, idx) => (
                <option key={idx} value={String(idx)}>{`${idx + 1}. ${name}`}</option>
              ))}
            </select>
            <button
              type="button"
              className="bl-icon-btn"
              title={STATIC_TEXTS.nextSheet}
              disabled={disabled || sheetIndex >= sheetNames.length - 1}
              onClick={() => onSelectSheet(sheetIndex + 1)}
            >
              →
            </button>
          </div>
        </div>
      )}
      {loaded && (
        <div className="bl-date">
          <label htmlFor="testDate" className="bl-sub">
            {t('testDateLabel')}
          </label>
          <input
            id="testDate"
            type="text"
            className="bl-input"
            placeholder={t('testDatePlaceholder')}
            value={testDate}
            disabled={disabled}
            onChange={(e) => api.getState().setTestDate(e.target.value)}
          />
        </div>
      )}
      <SavedIndicator lastSavedAt={lastSavedAt} />
      <div className="bl-head__actions">
        {loaded && (
          <label className={`btn btn--ghost bl-pick${disabled ? ' bl-pick--disabled' : ''}`}>
            {t('changeFile')}
            <FileInput disabled={disabled} onFile={onFile} />
          </label>
        )}
        <Button variant="ghost" onClick={onDefaults} disabled={disabled}>
          <span aria-hidden="true">⚙️</span> {t('menuDefaults')}
        </Button>
        <Button variant="ghost" onClick={onHistory} disabled={disabled}>
          <span aria-hidden="true">🕘</span> {t('history')}
        </Button>
        {loaded && onExport && (
          <Button onClick={onExport} disabled={disabled}>
            <span aria-hidden="true">📥</span> {t('menuDownload')}
          </Button>
        )}
      </div>
    </GlassPanel>
  )
}

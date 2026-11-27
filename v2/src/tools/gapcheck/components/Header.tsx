import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { SavedIndicator } from '../../../persistence/SavedIndicator'
import { useGapcheckT } from '../i18n'
import { FileInput } from './FileInput'
import { ActionButton } from '../../../ui/ActionButton'

export interface LoadedFile {
  name: string
  iterations: number
  points: number
}

interface Props {
  file: LoadedFile | null
  lastSavedAt: number | null
  disabled: boolean
  onFile: (file: File) => void
  onHistory: () => void
  onExport: () => unknown
}

/** Franja superior: título, archivo cargado, guardado y acciones (mockup aprobado). */
export function Header({ file, lastSavedAt, disabled, onFile, onHistory, onExport }: Props) {
  const t = useGapcheckT()
  return (
    <GlassPanel as="header" className="gc-head">
      <h1 className="gc-head__title">{t('pageTitle')}</h1>
      {file && (
        <span className="gc-file">
          <span aria-hidden="true">📄</span>
          <strong>{file.name}</strong>
          <span aria-hidden="true">·</span>
          <span>{t('fileDims', { n: file.iterations, m: file.points })}</span>
        </span>
      )}
      <SavedIndicator lastSavedAt={lastSavedAt} />
      <div className="gc-head__actions">
        {file && (
          <label className={`btn btn--ghost gc-pick${disabled ? ' gc-pick--disabled' : ''}`}>
            {t('changeFile')}
            <FileInput disabled={disabled} onFile={onFile} />
          </label>
        )}
        <Button variant="ghost" onClick={onHistory} disabled={disabled}>
          <span aria-hidden="true">🕘</span> {t('history')}
        </Button>
        {file && (
          <ActionButton onClick={onExport} disabled={disabled}>
            <span aria-hidden="true">⬇</span> {t('exportPng')}
          </ActionButton>
        )}
      </div>
    </GlassPanel>
  )
}

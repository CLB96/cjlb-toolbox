import { useState, type DragEvent } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useGapcheckT } from '../i18n'
import { FileInput } from './FileInput'
import { RichText } from '../../../ui/RichText'

interface Props {
  disabled: boolean
  onFile: (file: File) => void
}

/** Zona de carga inicial (inventario §3): clic o arrastrar un .xlsx/.xls/.csv. */
export function EmptyState({ disabled, onFile }: Props) {
  const t = useGapcheckT()
  const [over, setOver] = useState(false)

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (!disabled) setOver(true)
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && !disabled) onFile(file)
  }

  return (
    <GlassPanel as="section" className="gc-card gc-empty" aria-labelledby="gc-import-title">
      <h2 id="gc-import-title" className="gc-card__title">
        <span aria-hidden="true">📁</span> {t('importData')}
      </h2>
      <p className="gc-muted">{t('uploadSubtitle')}</p>
      <label
        className={`gc-drop${over ? ' gc-drop--over' : ''}${disabled ? ' gc-drop--disabled' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <FileInput disabled={disabled} onFile={onFile} />
        <span className="gc-drop__icon" aria-hidden="true">
          📤
        </span>
        <span className="gc-drop__text">
          <RichText text={t('dropText')} />
        </span>
      </label>
    </GlassPanel>
  )
}

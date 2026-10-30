import { useState, type ChangeEvent, type DragEvent } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'
import { RichText } from '../../../ui/RichText'
import { useBondlineT } from '../i18n'

export const ACCEPTED_FILES = '.xlsx,.xls,.csv'

interface FileInputProps {
  disabled: boolean
  onFile: (file: File) => void
}

/** Input de archivo invisible; el `<label>` que lo envuelve es la zona clicable. */
export function FileInput({ disabled, onFile }: FileInputProps) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite recargar el mismo archivo corregido (mejora A16)
    if (file) onFile(file)
  }
  return (
    <input
      type="file"
      className="bl-file-input"
      accept={ACCEPTED_FILES}
      disabled={disabled}
      onChange={onChange}
    />
  )
}

/** Zona de carga inicial (inventario §3): clic o arrastrar un .xlsx/.xls/.csv. */
export function EmptyState({ disabled, onFile }: FileInputProps) {
  const t = useBondlineT()
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
    <GlassPanel as="section" className="bl-card bl-empty" aria-labelledby="bl-file-title">
      <h2 id="bl-file-title" className="bl-card__title">
        {t('fileTitle')}
      </h2>
      <p className="bl-muted">{t('fileSubtitle')}</p>
      <label
        className={`bl-drop${over ? ' bl-drop--over' : ''}${disabled ? ' bl-drop--disabled' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <FileInput disabled={disabled} onFile={onFile} />
        <span className="bl-drop__icon" aria-hidden="true">
          📤
        </span>
        <span className="bl-drop__text">
          <RichText text={t('fileDrop')} />
        </span>
      </label>
    </GlassPanel>
  )
}

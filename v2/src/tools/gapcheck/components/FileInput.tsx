import type { ChangeEvent } from 'react'

export const ACCEPTED_FILES = '.xlsx,.xls,.csv'

interface Props {
  disabled: boolean
  onFile: (file: File) => void
  className?: string
}

/** Input de archivo oculto visualmente; el `<label>` que lo envuelve es la zona clicable. */
export function FileInput({ disabled, onFile, className = 'gc-file-input' }: Props) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Igual que el original: no se limpia el valor (elegir el mismo archivo no vuelve a cargar, §3)
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }
  return (
    <input
      type="file"
      className={className}
      accept={ACCEPTED_FILES}
      disabled={disabled}
      onChange={onChange}
    />
  )
}

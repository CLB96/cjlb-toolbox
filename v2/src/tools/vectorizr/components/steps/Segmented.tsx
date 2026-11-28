import type { CSSProperties } from 'react'

interface Option<T extends string | number> {
  value: T
  label: string
}

interface Props<T extends string | number> {
  options: Option<T>[]
  /** Opción activa; null = ninguna (la píldora se esconde). */
  value: T | null
  onChange: (value: T) => void
  label?: string
}

/**
 * Selector de una opción entre varias: una píldora con el acento se desliza hacia la elegida (con un pequeño
 * rebote) y los botones se aplastan al pulsarlos (data-jelly, ver useButtonFx).
 */
export function Segmented<T extends string | number>({ options, value, onChange, label }: Props<T>) {
  const index = options.findIndex((o) => o.value === value)
  const style = { '--n': options.length, '--i': Math.max(index, 0) } as CSSProperties
  return (
    <div className="vz-seg" role="group" aria-label={label} style={style} data-none={index < 0 ? '' : undefined}>
      <span className="vz-seg__pill" aria-hidden="true" />
      {options.map((o) => (
        <button key={String(o.value)} type="button" data-jelly className={o.value === value ? 'is-on' : ''} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

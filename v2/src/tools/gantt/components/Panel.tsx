import type { ReactNode } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'

interface Props {
  title: string
  subtitle: string
  /** Contenido a la derecha del título (chips, selector Días/Semanas). */
  aside?: ReactNode
  /** Botón −/+ del original; sin `open` el panel no se pliega. */
  open?: boolean
  toggleLabel?: string
  onToggle?: () => void
  className?: string
  children?: ReactNode
}

/** Tarjeta con cabecera panel-head del original. */
export function Panel({ title, subtitle, aside, open = true, toggleLabel, onToggle, className = '', children }: Props) {
  return (
    <GlassPanel as="section" className={`gt-card ${className}`.trim()}>
      <div className="gt-ph">
        <div>
          <h2 className="gt-ph__title">{title}</h2>
          <div className="gt-ph__sub">{subtitle}</div>
        </div>
        <div className="gt-ph__aside">
          {aside}
          {onToggle && (
            <button type="button" className="gt-icon-btn" aria-label={toggleLabel} aria-expanded={open} onClick={onToggle}>
              {open ? '−' : '+'}
            </button>
          )}
        </div>
      </div>
      {open && children}
    </GlassPanel>
  )
}

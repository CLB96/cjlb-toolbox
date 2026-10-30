import type { ReactNode } from 'react'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useBondline, useBondlineApi } from '../BondlineStoreProvider'
import type { PanelKey } from '../store'

interface Props {
  panel: PanelKey
  title: string
  subtitle: string
  children: ReactNode
}

/** Tarjeta plegable (R6): el estado abierto/cerrado vive en el store y se persiste. */
export function Collapsible({ panel, title, subtitle, children }: Props) {
  const api = useBondlineApi()
  const open = useBondline((s) => s.panels[panel])
  const titleId = `bl-${panel}-title`
  const bodyId = `bl-${panel}-body`

  return (
    <GlassPanel as="section" className="bl-card bl-collapsible" aria-labelledby={titleId}>
      <h2 id={titleId} className="bl-card__title">
        <button
          type="button"
          className="bl-collapsible__toggle"
          aria-expanded={open}
          aria-controls={open ? bodyId : undefined}
          onClick={() => api.getState().setPanelOpen(panel, !open)}
        >
          <span aria-hidden="true">{open ? '▾' : '▸'}</span> {title}
        </button>
      </h2>
      <p className="bl-muted">{subtitle}</p>
      {open && (
        <div id={bodyId} className="bl-collapsible__body">
          {children}
        </div>
      )}
    </GlassPanel>
  )
}

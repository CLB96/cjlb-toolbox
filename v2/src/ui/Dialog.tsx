import { useEffect, useId, useRef, type ReactNode } from 'react'

type Props = { open: boolean; onClose: () => void; title: string; children?: ReactNode }

export function Dialog({ open, onClose, title, children }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => previous?.focus?.()
  }, [open])

  if (!open) return null
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="glass glass--dense dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
      >
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

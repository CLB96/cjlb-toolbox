import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = { open: boolean; onClose: () => void; title: string; children?: ReactNode }

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

function focusables(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hidden)
}

/** Mantiene el foco dentro del panel con Tab / Shift+Tab. */
function trapTab(e: KeyboardEvent, panel: HTMLElement) {
  const items = focusables(panel)
  if (items.length === 0) {
    e.preventDefault()
    panel.focus()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  const current = document.activeElement
  const inside = current instanceof Node && panel.contains(current)
  if (e.shiftKey && (!inside || current === first || current === panel)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (!inside || current === last)) {
    e.preventDefault()
    first.focus()
  }
}

export function Dialog({ open, onClose, title, children }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const downOnBackdrop = useRef(false)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [host, setHost] = useState<Element | null>(null)

  // El diálogo se monta en la raíz de la herramienta (o en body): dentro de un panel con vidrio (backdrop-filter)
  // 'fixed' se encierra en ese panel y el diálogo queda tapado por el contenido.
  useLayoutEffect(() => {
    setHost(open ? (anchorRef.current?.closest('[role="tabpanel"]') ?? document.body) : null)
  }, [open])

  useEffect(() => {
    if (!open || !host) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
      } else if (e.key === 'Tab' && panelRef.current) {
        trapTab(e, panelRef.current)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [open, host])

  const dialog = (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        const close = downOnBackdrop.current && e.target === e.currentTarget
        downOnBackdrop.current = false
        if (close) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="glass glass--dense dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
  return (
    <>
      <span ref={anchorRef} hidden />
      {open && host ? createPortal(dialog, host) : null}
    </>
  )
}

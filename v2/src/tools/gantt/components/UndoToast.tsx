import { STATIC_TEXTS, type Lang } from '../i18n'

export interface PendingUndo {
  id: number
  start: Date
  end: Date
  message: string
}

interface Props {
  pending: PendingUndo | null
  lang: Lang
  onUndo: () => void
}

/** Aviso de commitBarDrag con el botón "Deshacer ↩" (5 s). */
export function UndoToast({ pending, lang, onUndo }: Props) {
  if (!pending) return null
  return (
    <div className="glass toast gt-undo-toast" role="status">
      <span>{pending.message}</span>
      <button type="button" className="gt-undo-toast__btn" onClick={onUndo}>
        {`${STATIC_TEXTS.undo[lang]} ↩`}
      </button>
    </div>
  )
}

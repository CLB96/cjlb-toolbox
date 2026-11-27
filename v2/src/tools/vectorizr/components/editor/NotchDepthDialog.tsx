import { useEffect, useState } from 'react'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { clampDepth } from '../../logic/notches'
import { activeNotches } from '../../store'

interface Props {
  /** Notch cuya profundidad se edita; null = cerrado. */
  notchId: string | null
  onClose: () => void
}

/** Profundidad del notch en mm. Un valor vacío, cero o negativo vuelve a la profundidad por defecto. */
export function NotchDepthDialog({ notchId, onClose }: Props) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const notch = useVectorizr((s) => (notchId ? activeNotches(s).find((n) => n.id === notchId) : undefined))
  const [draft, setDraft] = useState('')
  useEffect(() => {
    if (notch) setDraft(String(notch.depth))
  }, [notchId])

  const accept = () => {
    if (notch) api.getState().updateNotch(notch.id, { depth: clampDepth(draft) })
    onClose()
  }

  return (
    <Dialog open={Boolean(notch)} onClose={onClose} title={t('depthTitle')}>
      <label className="vz-field">
        <span className="vz-small vz-muted">{t('notchDepth')}</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') accept()
          }}
        />
      </label>
      <div className="vz-dialog-row">
        <Button variant="ghost" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button onClick={accept}>{t('accept')}</Button>
      </div>
    </Dialog>
  )
}

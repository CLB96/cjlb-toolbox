import { useEffect, useState } from 'react'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { clampDepth } from '../../logic/notches'
import { activeNotches } from '../../store'
import type { NotchType } from '../../types'

/** Datos del notch seleccionado: tipo y profundidad en mm. */
export function NotchPanel({ notchId }: { notchId: string }) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const notch = useVectorizr((s) => activeNotches(s).find((n) => n.id === notchId))
  const [draft, setDraft] = useState('')
  useEffect(() => {
    if (notch) setDraft(String(notch.depth))
  }, [notch?.id, notch?.depth])
  if (!notch) return null

  const commit = () => {
    const depth = clampDepth(draft)
    setDraft(String(depth))
    api.getState().updateNotch(notch.id, { depth })
  }

  return (
    <div className="vz-notch-panel">
      <p className="vz-caps">{t('notchSelected')}</p>
      <label className="vz-field">
        <span className="vz-small vz-muted">{t('notchType')}</span>
        <select
          className="vz-select"
          value={notch.type}
          onChange={(e) => api.getState().updateNotch(notch.id, { type: e.target.value as NotchType })}
        >
          <option value="I">I</option>
          <option value="V">V</option>
          <option value="T">T</option>
        </select>
      </label>
      <label className="vz-field">
        <span className="vz-small vz-muted">{t('notchDepth')}</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
        />
      </label>
    </div>
  )
}

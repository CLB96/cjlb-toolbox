import { useEffect, useState } from 'react'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { clampDiameter, diameterToRadius, formatMm, radiusToDiameter } from '../../logic/drills'
import { activeDrills } from '../../store'

interface Props {
  /** Drill cuya dimensión se edita; null = cerrado. */
  drillId: string | null
  onClose: () => void
}

const positive = (v: string) => {
  const n = v.trim() === '' ? NaN : Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Diámetro y radio del drill en mm: se llena uno y el otro se calcula al momento. */
export function DrillDialog({ drillId, onClose }: Props) {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const drill = useVectorizr((s) => (drillId ? activeDrills(s).find((d) => d.id === drillId) : undefined))
  const [diameter, setDiameter] = useState('')
  const [radius, setRadius] = useState('')
  useEffect(() => {
    if (drill) {
      setDiameter(formatMm(drill.diameter))
      setRadius(formatMm(diameterToRadius(drill.diameter)))
    }
  }, [drillId])

  const onDiameter = (v: string) => {
    setDiameter(v)
    const n = positive(v)
    setRadius(n === null ? '' : formatMm(diameterToRadius(n)))
  }
  const onRadius = (v: string) => {
    setRadius(v)
    const n = positive(v)
    setDiameter(n === null ? '' : formatMm(radiusToDiameter(n)))
  }

  const accept = () => {
    if (drill) api.getState().updateDrill(drill.id, { diameter: clampDiameter(diameter) })
    onClose()
  }
  const remove = () => {
    if (drill) api.getState().removeDrill(drill.id)
    onClose()
  }
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') accept()
  }

  return (
    <Dialog open={Boolean(drill)} onClose={onClose} title={t('drillTitle')}>
      <label className="vz-field">
        <span className="vz-small vz-muted">{t('drillDiameter')}</span>
        <input type="number" min="0" step="0.5" value={diameter} autoFocus onChange={(e) => onDiameter(e.target.value)} onKeyDown={onEnter} />
      </label>
      <label className="vz-field">
        <span className="vz-small vz-muted">{t('drillRadius')}</span>
        <input type="number" min="0" step="0.25" value={radius} onChange={(e) => onRadius(e.target.value)} onKeyDown={onEnter} />
      </label>
      <p className="vz-small vz-muted">{t('drillHint')}</p>
      <div className="vz-dialog-row">
        <Button variant="danger" onClick={remove}>
          {t('deleteNotch')}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button onClick={accept}>{t('accept')}</Button>
      </div>
    </Dialog>
  )
}

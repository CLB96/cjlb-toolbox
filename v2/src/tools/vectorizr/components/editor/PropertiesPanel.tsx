import { useVectorizr } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { pxToMm } from '../../logic/scale'
import type { SegmentType } from '../../types'

interface Props {
  selectedId: string | null
  onSegmentTypeChange: (id: string, type: SegmentType) => void
}

export function PropertiesPanel({ selectedId, onSegmentTypeChange }: Props) {
  const { t } = useVzT()
  const contourPoints = useVectorizr((s) => s.contourPoints)
  const scaleFactor = useVectorizr((s) => s.scaleFactor)
  const pt = contourPoints.find((p) => p.id === selectedId)

  // Igual que el original: cierra el lazo y mide en recto (bug #29 sin cambiar)
  const totalLength = contourPoints.reduce((acc, curr, i) => {
    const next = contourPoints[(i + 1) % contourPoints.length]!
    return acc + Math.hypot(next.x - curr.x, next.y - curr.y)
  }, 0)

  return (
    <aside className="vz-side vz-props glass">
      <div>
        <p className="vz-caps">{pt ? t('selectedPoint') : t('noSelection')}</p>
        {pt ? (
          <>
            <p>{t('coordX', pxToMm(pt.x, scaleFactor).toFixed(2))}</p>
            <p>{t('coordY', pxToMm(pt.y, scaleFactor).toFixed(2))}</p>
          </>
        ) : (
          <p className="vz-muted vz-small">{t('selectHint')}</p>
        )}
      </div>
      {pt && (
        <label className="vz-field">
          <span className="vz-caps">{t('segment')}</span>
          <select className="vz-select" value={pt.type} onChange={(e) => onSegmentTypeChange(pt.id, e.target.value as SegmentType)}>
            <option value="line">{t('segLine')}</option>
            <option value="bezier">{t('segBezier')}</option>
          </select>
        </label>
      )}
      <div className="vz-props__totals">
        <p className="vz-muted vz-small">{t('total', contourPoints.length)}</p>
        <p className="vz-muted vz-small">{t('length', pxToMm(totalLength, scaleFactor).toFixed(1))}</p>
      </div>
    </aside>
  )
}

import { useVectorizr } from '../../VectorizrStoreProvider'
import { toolName, useVzT } from '../../i18n'

export function StatusBar() {
  const { t, lang } = useVzT()
  const scaleFactor = useVectorizr((s) => s.scaleFactor)
  const zoom = useVectorizr((s) => s.zoom)
  const activeToolId = useVectorizr((s) => s.activeToolId)
  const points = useVectorizr((s) => s.contourPoints.length)
  return (
    <div className="vz-status glass" role="status">
      <span>{t('statusScale', scaleFactor.toFixed(4))}</span>
      <span>{t('statusZoom', Math.round(zoom * 100))}</span>
      {/* M17: nombre legible en lugar del id interno */}
      <span>{t('statusTool', toolName(lang, activeToolId))}</span>
      <span>{t('statusPoints', points)}</span>
    </div>
  )
}

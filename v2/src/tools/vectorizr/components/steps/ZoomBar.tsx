import { useVzT } from '../../i18n'
import { Icon } from '../icons'
import type { useCanvasZoom } from './useCanvasZoom'

interface Props {
  zoom: ReturnType<typeof useCanvasZoom>
  /** Gira la vista en pasos de 90° (negativo = izquierda). */
  onRotate: (delta: number) => void
}

/** Botones flotantes del lienzo del paso Vectorizar: girar la foto y acercar o alejar. */
export function ZoomBar({ zoom, onRotate }: Props) {
  const { t } = useVzT()
  return (
    <div className="vz-zoombar glass" role="group">
      <button type="button" data-jelly aria-label={t('rotateLeft')} title={t('rotateLeft')} onClick={() => onRotate(-90)}>
        <Icon name="rotl" />
      </button>
      <button type="button" data-jelly aria-label={t('rotateRight')} title={t('rotateRight')} onClick={() => onRotate(90)}>
        <Icon name="rotr" />
      </button>
      <span className="vz-sep" />
      <button type="button" data-jelly aria-label={t('zoomOut')} title={t('zoomOut')} onClick={zoom.zoomOut} disabled={zoom.scale <= 1}>
        −
      </button>
      <button type="button" data-jelly className="vz-zoombar__pct" onClick={zoom.reset} title={t('oneToOne')} disabled={zoom.scale <= 1}>
        {t('oneToOne')}
      </button>
      <button type="button" data-jelly aria-label={t('zoomIn')} title={t('zoomIn')} onClick={zoom.zoomIn}>
        +
      </button>
    </div>
  )
}

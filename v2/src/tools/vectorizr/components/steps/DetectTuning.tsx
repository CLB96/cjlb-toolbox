import { ElasticSlider } from '../../../../ui/ElasticSlider'
import { useVzT } from '../../i18n'
import { THRESHOLD_LIMITS } from '../../store'
import { Segmented } from './Segmented'
import type { DetectionMethod } from '../../types'

export type Polarity = 'auto' | 'dark' | 'light'

interface Props {
  method: DetectionMethod
  threshold1: number
  threshold2: number
  detail: number
  onMethod: (m: DetectionMethod) => void
  onThreshold1: (v: number) => void
  onThreshold2: (v: number) => void
  onDetail: (v: number) => void
  /** Se llama al soltar un control para detectar de nuevo (M19). */
  onRelease: () => void
}

/** Controles del detector: método, umbrales de Canny (semi automático) y Detalle (los dos métodos). */
export function DetectTuning(p: Props) {
  const { t } = useVzT()
  return (
    <>
      <Segmented
        options={[
          { value: 0 as DetectionMethod, label: t('methodAuto') },
          { value: 1 as DetectionMethod, label: t('methodSemi') },
        ]}
        value={p.method}
        onChange={p.onMethod}
      />
      {p.method === 1 && (
        <>
          <label className="vz-field vz-rise-in">
            <span className="vz-slider-label">
              <span>{t('lowThreshold')}</span>
              <b>{p.threshold1}</b>
            </span>
            <ElasticSlider
              min={THRESHOLD_LIMITS.low.min}
              max={THRESHOLD_LIMITS.low.max}
              value={p.threshold1}
              onChange={(e) => p.onThreshold1(Number(e.target.value))}
              onPointerUp={p.onRelease}
              onKeyUp={p.onRelease}
            />
          </label>
          <label className="vz-field vz-rise-in">
            <span className="vz-slider-label">
              <span>{t('highThreshold')}</span>
              <b>{p.threshold2}</b>
            </span>
            <ElasticSlider
              min={THRESHOLD_LIMITS.high.min}
              max={THRESHOLD_LIMITS.high.max}
              value={p.threshold2}
              onChange={(e) => p.onThreshold2(Number(e.target.value))}
              onPointerUp={p.onRelease}
              onKeyUp={p.onRelease}
            />
          </label>
        </>
      )}
      {p.method === 0 && <p className="vz-muted vz-small">{t('autoHelp')}</p>}
      {(
        <>
          <label className="vz-field vz-rise-in">
            <span className="vz-slider-label">
              <span>{t('detailLabel')}</span>
              <b>{p.detail}</b>
            </span>
            <ElasticSlider
              min={1}
              max={5}
              value={p.detail}
              onChange={(e) => p.onDetail(Number(e.target.value))}
              onPointerUp={p.onRelease}
              onKeyUp={p.onRelease}
            />
            <span className="vz-muted vz-small">{t('detailHint')}</span>
          </label>
        </>
      )}
    </>
  )
}

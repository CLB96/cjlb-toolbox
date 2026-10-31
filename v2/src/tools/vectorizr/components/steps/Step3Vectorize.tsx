import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Button } from '../../../../ui/Button'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { THRESHOLD_LIMITS } from '../../store'
import type { ContourPoint, ImagePoint } from '../../types'
import { useOpencv } from '../../worker/useOpencv'

type Mode = 'choose' | 'auto' | 'manual'

/** Coordenadas del clic teniendo en cuenta el letterbox de objectFit: contain (:11-26). */
function letterbox(rect: DOMRect, imageWidth: number, imageHeight: number) {
  const scaleRatio = Math.min(rect.width / imageWidth, rect.height / imageHeight)
  const offsetX = (rect.width - imageWidth * scaleRatio) / 2
  const offsetY = (rect.height - imageHeight * scaleRatio) / 2
  return { scaleRatio, offsetX, offsetY }
}

function canvasClickToImageCoords(e: MouseEvent<HTMLCanvasElement>, imageWidth: number, imageHeight: number): ImagePoint | null {
  const rect = e.currentTarget.getBoundingClientRect()
  const { scaleRatio, offsetX, offsetY } = letterbox(rect, imageWidth, imageHeight)
  const x = (e.clientX - rect.left - offsetX) / scaleRatio
  const y = (e.clientY - rect.top - offsetY) / scaleRatio
  if (!(x >= 0 && y >= 0 && x <= imageWidth && y <= imageHeight)) return null
  return { x, y }
}

const toContour = (pts: ImagePoint[]): ContourPoint[] => pts.map((p, i) => ({ id: String(i), x: p.x, y: p.y, type: 'line' }))

export function Step3Vectorize() {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const image = useVectorizr((s) => s.image)
  const imageWidth = useVectorizr((s) => s.imageWidth)
  const imageHeight = useVectorizr((s) => s.imageHeight)
  const method = useVectorizr((s) => s.detectionMethod)
  const threshold1 = useVectorizr((s) => s.threshold1)
  const threshold2 = useVectorizr((s) => s.threshold2)
  const { detect } = useOpencv()

  const [mode, setMode] = useState<Mode>('choose')
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState(false)
  const [detectedPoints, setDetectedPoints] = useState<ImagePoint[]>([])
  const [manualPoints, setManualPoints] = useState<ImagePoint[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef(0)
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  function getImageData(img: HTMLImageElement): ImageData {
    const offscreen = document.createElement('canvas')
    offscreen.width = imageWidth
    offscreen.height = imageHeight
    const ctx = offscreen.getContext('2d')
    if (!ctx) throw new Error('canvas 2d no disponible')
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, imageWidth, imageHeight)
  }

  /** M12: la detección se encola hasta que OpenCV esté listo; un error se muestra y el spinner termina. */
  async function runDetection() {
    const img = api.getState().image?.image
    if (!img) return
    const id = ++requestRef.current
    const { detectionMethod, threshold1: low, threshold2: high } = api.getState()
    setDetecting(true)
    setDetectError(false)
    try {
      const pts = await detect(getImageData(img), { method: detectionMethod, threshold1: low, threshold2: high })
      if (aliveRef.current && id === requestRef.current) setDetectedPoints(pts)
    } catch {
      if (aliveRef.current && id === requestRef.current) setDetectError(true)
    } finally {
      if (aliveRef.current && id === requestRef.current) setDetecting(false)
    }
  }

  function handleAutoMode() {
    setMode('auto')
    void runDetection()
  }

  // Imagen + contorno sobre el canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = imageWidth
    canvas.height = imageHeight
    ctx.drawImage(image.image, 0, 0)
    const pts = mode === 'manual' ? manualPoints : detectedPoints
    if (pts.length > 1) {
      ctx.beginPath()
      ctx.moveTo(pts[0]!.x, pts[0]!.y)
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.strokeStyle = '#4a7eff'
      ctx.lineWidth = Math.max(2, imageWidth / 300)
      ctx.stroke()
    }
    pts.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(4, imageWidth / 200), 0, Math.PI * 2)
      ctx.fillStyle = i === 0 && pts.length > 1 ? '#ea580c' : '#e11d48'
      ctx.fill()
    })
  }, [detectedPoints, manualPoints, mode, image, imageWidth, imageHeight])

  function confirmPoints(pts: ImagePoint[]) {
    const s = api.getState()
    s.setContourPoints(toContour(pts))
    s.pushHistory()
    s.setStep(4)
  }

  function handleCanvasClick(e: MouseEvent<HTMLCanvasElement>) {
    if (mode !== 'manual') return
    const coords = canvasClickToImageCoords(e, imageWidth, imageHeight)
    if (!coords) return
    // Cierra el contorno si el clic cae a menos de 18 px (pantalla) del primer punto
    if (manualPoints.length > 2) {
      const rect = e.currentTarget.getBoundingClientRect()
      const { scaleRatio, offsetX, offsetY } = letterbox(rect, imageWidth, imageHeight)
      const dx = e.clientX - rect.left - (manualPoints[0]!.x * scaleRatio + offsetX)
      const dy = e.clientY - rect.top - (manualPoints[0]!.y * scaleRatio + offsetY)
      if (Math.sqrt(dx * dx + dy * dy) < 18) return confirmPoints(manualPoints)
    }
    setManualPoints((pts) => [...pts, coords])
  }

  if (mode === 'choose') {
    return (
      <div className="vz-choose">
        <h2>{t('chooseTitle')}</h2>
        <div className="vz-cards">
          {[
            { icon: '🤖', title: t('autoTitle'), desc: t('autoDesc'), action: handleAutoMode },
            { icon: '✏️', title: t('manualTitle'), desc: t('manualDesc'), action: () => setMode('manual') },
          ].map((opt) => (
            <button key={opt.icon} type="button" className="vz-card glass" onClick={opt.action}>
              <span className="vz-card__icon">{opt.icon}</span>
              <h3>{opt.title}</h3>
              <span className="vz-muted">{opt.desc}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => api.getState().setStep(2)}>
          {t('back')}
        </Button>
      </div>
    )
  }

  // M19: volver a detectar al soltar el slider (puntero o teclado)
  const onRelease = () => void runDetection()

  return (
    <div className="vz-work">
      <div className="vz-canvas">
        <canvas
          ref={canvasRef}
          className="vz-detect-canvas"
          style={{ cursor: mode === 'manual' ? 'crosshair' : 'default' }}
          onClick={handleCanvasClick}
        />
        {detecting && (
          <div className="vz-spinner-wrap" role="status">
            <div className="vz-spinner" />
            <span>{t('detectingOpencv')}</span>
          </div>
        )}
      </div>

      <aside className="vz-side glass">
        {mode === 'auto' && (
          <>
            <div className="vz-seg" role="group">
              <button type="button" className={method === 0 ? 'is-on' : ''} aria-pressed={method === 0} onClick={() => api.getState().setDetectionMethod(0)}>
                {t('methodAuto')}
              </button>
              <button type="button" className={method === 1 ? 'is-on' : ''} aria-pressed={method === 1} onClick={() => api.getState().setDetectionMethod(1)}>
                {t('methodSemi')}
              </button>
            </div>
            {method === 1 && (
              <>
                <label className="vz-field">
                  <span className="vz-slider-label">
                    <span>{t('lowThreshold')}</span>
                    <b>{threshold1}</b>
                  </span>
                  <input
                    type="range"
                    min={THRESHOLD_LIMITS.low.min}
                    max={THRESHOLD_LIMITS.low.max}
                    value={threshold1}
                    onChange={(e) => api.getState().setThreshold1(Number(e.target.value))}
                    onPointerUp={onRelease}
                    onKeyUp={onRelease}
                  />
                </label>
                <label className="vz-field">
                  <span className="vz-slider-label">
                    <span>{t('highThreshold')}</span>
                    <b>{threshold2}</b>
                  </span>
                  <input
                    type="range"
                    min={THRESHOLD_LIMITS.high.min}
                    max={THRESHOLD_LIMITS.high.max}
                    value={threshold2}
                    onChange={(e) => api.getState().setThreshold2(Number(e.target.value))}
                    onPointerUp={onRelease}
                    onKeyUp={onRelease}
                  />
                </label>
              </>
            )}
            {method === 0 && <p className="vz-muted vz-small">{t('autoHelp')}</p>}
            {detectError && (
              <p className="vz-error" role="alert">
                {t('errDetect')}
              </p>
            )}
            <Button variant="ghost" onClick={() => void runDetection()} disabled={detecting}>
              {detecting ? t('detecting') : t('detectAgain')}
            </Button>
            <Button onClick={() => confirmPoints(detectedPoints)} disabled={detectedPoints.length < 3}>
              {t('confirmPts', detectedPoints.length)}
            </Button>
            {method === 1 && (
              <div className="vz-guide">
                <p className="vz-guide__title">{t('guideTitle')}</p>
                <p>
                  <b>{t('guideLowLabel')}</b>
                  {t('guideLow')}
                </p>
                <p>
                  <b>{t('guideHighLabel')}</b>
                  {t('guideHigh')}
                </p>
              </div>
            )}
          </>
        )}
        {mode === 'manual' && (
          <>
            <p className="vz-muted vz-small">
              {t('manualHelpA')}
              <strong className="vz-orange">{t('manualHelpOrange')}</strong>
              {t('manualHelpB')}
            </p>
            <p className="vz-muted vz-small">{t('pointsN', manualPoints.length)}</p>
            <Button variant="ghost" onClick={() => setManualPoints((pts) => pts.slice(0, -1))} disabled={manualPoints.length === 0}>
              {t('undoLast')}
            </Button>
            <Button variant="ghost" onClick={() => setManualPoints([])}>
              {t('clearAll')}
            </Button>
            <Button onClick={() => confirmPoints(manualPoints)} disabled={manualPoints.length < 3}>
              {t('confirm')}
            </Button>
          </>
        )}
        <span className="vz-spacer" />
        <Button
          variant="ghost"
          onClick={() => {
            requestRef.current++
            setDetecting(false)
            setDetectError(false)
            setMode('choose')
            setDetectedPoints([])
            setManualPoints([])
          }}
        >
          {t('changeMode')}
        </Button>
      </aside>
    </div>
  )
}

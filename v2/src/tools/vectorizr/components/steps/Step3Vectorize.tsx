import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Button } from '../../../../ui/Button'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { canvasClickToImageCoords, imageToView, letterbox, viewDims } from '../../logic/canvasCoords'
import { lowResScale, scalePointsBack } from '../../logic/lowRes'
import { buildDetectionInput, drawPrepOverlay } from '../../logic/prepCanvas'
import { adjustFilter, isPrepped, offsetPoints, snapToCrop } from '../../logic/prepImage'
import { clampQuantity, newPiece, pieceColor } from '../../logic/pieces'
import type { ContourPoint, ImagePoint } from '../../types'
import { useOpencv } from '../../worker/useOpencv'
import { Icon } from '../icons'
import { DetectedPieces, type DetectedRow } from './DetectedPieces'
import { ChooseMode } from './ChooseMode'
import { DetectTuning, type Polarity } from './DetectTuning'
import { ImageEditPanel } from './ImageEditPanel'
import { ThresholdGuide } from './ThresholdGuide'
import { ZoomBar } from './ZoomBar'
import { useCanvasZoom } from './useCanvasZoom'
import { useImagePrep } from './useImagePrep'
import { useRoutedPointer } from './useRoutedPointer'

type Mode = 'choose' | 'auto' | 'manual'

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
  const lowRes = useVectorizr((s) => s.lowRes)
  const { detect, detectAll, mask } = useOpencv()
  const rotation = useVectorizr((s) => s.imageRotation)
  const view = viewDims(imageWidth, imageHeight, rotation)
  const edit = useImagePrep(imageWidth, imageHeight, rotation)
  const { prep } = edit

  const [mode, setMode] = useState<Mode>('choose')
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState(false)
  const [detectedPoints, setDetectedPoints] = useState<ImagePoint[]>([])
  const [manualPoints, setManualPoints] = useState<ImagePoint[]>([])
  const [multi, setMulti] = useState(false)
  const [detail, setDetail] = useState(3)
  const detailRef = useRef(3)
  const [polarity, setPolarity] = useState<Polarity>('auto')
  const polarityRef = useRef<Polarity>('auto')
  const [maskView, setMaskView] = useState<HTMLCanvasElement | null>(null)
  const maskRequestRef = useRef(0)
  const [rows, setRows] = useState<DetectedRow[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const zoom = useCanvasZoom(frameRef, mode !== 'choose')
  const routed = useRoutedPointer(edit.handlers, zoom.handlers, edit.tool !== 'none')
  const zoomScale = zoom.scale
  const requestRef = useRef(0)
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  /** Parámetros del detector con lo que el usuario ha ajustado (solo manda lo que no es el valor de siempre). */
  function detectParams() {
    const { detectionMethod, threshold1: low, threshold2: high } = api.getState()
    return {
      method: detectionMethod,
      threshold1: low,
      threshold2: high,
      ...(prep.strokes.length > 0 ? { ignoreTransparent: true } : {}),
      ...(detailRef.current !== 3 ? { detail: detailRef.current } : {}),
      ...(polarityRef.current !== 'auto' ? { polarity: polarityRef.current } : {}),
    }
  }

  /** «Ver lo que detecta»: pide al detector la imagen en blanco y negro con lo mismo que usaría para el contorno. */
  async function refreshMask() {
    const img = api.getState().image?.image
    if (!img) return
    const id = ++maskRequestRef.current
    const region = prep.crop ?? { x: 0, y: 0, w: imageWidth, h: imageHeight }
    const scale = api.getState().lowRes ? lowResScale(region.w, region.h) : 1
    try {
      const m = await mask(buildDetectionInput(img, imageWidth, imageHeight, scale, prep), detectParams())
      if (!aliveRef.current || id !== maskRequestRef.current) return
      const canvas = document.createElement('canvas')
      canvas.width = m.width
      canvas.height = m.height
      canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(m.data), m.width, m.height), 0, 0)
      setMaskView(canvas)
    } catch {
      if (aliveRef.current && id === maskRequestRef.current) setMaskView(null)
    }
  }

  /** M12: la detección se encola hasta que OpenCV esté listo; un error se muestra y el spinner termina. */
  async function runDetection(multiNow = multi) {
    const img = api.getState().image?.image
    if (!img) return
    const id = ++requestRef.current
    const { lowRes: small } = api.getState()
    const region = prep.crop ?? { x: 0, y: 0, w: imageWidth, h: imageHeight }
    const scale = small ? lowResScale(region.w, region.h) : 1
    const back = (pts: ImagePoint[]) => {
      const placed = offsetPoints(scalePointsBack(pts, scale), region.x, region.y)
      // El borde del recorte es un tope: donde corta la pieza, el contorno lo sigue en línea recta
      return prep.crop ? snapToCrop(placed, prep.crop, Math.max(6, imageWidth * 0.008)) : placed
    }
    setDetecting(true)
    setDetectError(false)
    try {
      const params = detectParams()
      if (multiNow) {
        const found = await detectAll(buildDetectionInput(img, imageWidth, imageHeight, scale, prep), params)
        if (aliveRef.current && id === requestRef.current) {
          setRows(found.map((points, i) => ({ key: i, name: `Pieza ${i + 1}`, quantity: 1, points: back(points) })))
        }
      } else {
        const pts = await detect(buildDetectionInput(img, imageWidth, imageHeight, scale, prep), params)
        if (aliveRef.current && id === requestRef.current) setDetectedPoints(back(pts))
      }
    } catch {
      if (aliveRef.current && id === requestRef.current) setDetectError(true)
    } finally {
      if (aliveRef.current && id === requestRef.current) setDetecting(false)
      if (edit.showMask && aliveRef.current) void refreshMask()
    }
  }

  function handleAutoMode() {
    setMode('auto')
    void runDetection()
  }

  // «Ver lo que detecta»: al encender se pide la imagen; al apagar se quita
  useEffect(() => {
    if (mode !== 'auto') return
    if (edit.showMask) void refreshMask()
    else setMaskView(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit.showMask, mode])

  // Al girar la foto, un pequeño destello que acompaña el cambio (no corre con «reducir movimiento»)
  const firstRotation = useRef(true)
  useEffect(() => {
    if (firstRotation.current) {
      firstRotation.current = false
      return
    }
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced) canvasRef.current?.animate?.([{ opacity: 0.2 }, { opacity: 1 }], { duration: 380, easing: 'cubic-bezier(0.3, 1.2, 0.5, 1)' })
  }, [rotation])

  // Tras cada edición de la foto (recorte o borrado) se vuelve a detectar solo
  useEffect(() => {
    if (edit.tick > 0 && mode === 'auto') void runDetection()
  }, [edit.tick])

  // Imagen + contorno sobre el canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // La foto se dibuja girada alrededor de su centro; todo lo demás se sigue dibujando en píxeles de la foto
    canvas.width = view.w
    canvas.height = view.h
    ctx.translate(view.w / 2, view.h / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-imageWidth / 2, -imageHeight / 2)
    if (maskView && edit.showMask && mode === 'auto') {
      const r = prep.crop ?? { x: 0, y: 0, w: imageWidth, h: imageHeight }
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, imageWidth, imageHeight)
      ctx.drawImage(maskView, r.x, r.y, r.w, r.h)
    } else {
      ctx.drawImage(image.image, 0, 0)
    }
    if ((mode === 'auto' && isPrepped(prep)) || edit.tool === 'crop') {
      drawPrepOverlay(ctx, imageWidth, imageHeight, prep, { handles: edit.tool === 'crop', handleSize: Math.max(10, imageWidth / 70) / zoomScale })
    }
    if (mode === 'auto' && multi) {
      const lw = Math.max(1.5, imageWidth / 700)
      rows.forEach((r, i) => {
        ctx.beginPath()
        r.points.forEach((p, j) => (j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        ctx.closePath()
        ctx.strokeStyle = pieceColor(i)
        ctx.lineWidth = lw
        ctx.stroke()
      })
      return
    }
    const pts = mode === 'manual' ? manualPoints : detectedPoints
    if (pts.length > 1) {
      ctx.beginPath()
      ctx.moveTo(pts[0]!.x, pts[0]!.y)
      pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.strokeStyle = '#4a7eff'
      ctx.lineWidth = Math.max(1.5, imageWidth / 700) / zoomScale
      ctx.stroke()
    }
    pts.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(2.5, imageWidth / 450) / zoomScale, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 && pts.length > 1 ? '#ea580c' : '#e11d48'
      ctx.fill()
    })
  }, [detectedPoints, manualPoints, mode, multi, rows, image, imageWidth, imageHeight, zoomScale, prep, edit.tool, maskView, edit.showMask, rotation, view.w, view.h])

  function confirmPoints(pts: ImagePoint[]) {
    const s = api.getState()
    s.setContourPoints(toContour(pts))
    s.pushHistory()
    s.setStep(4)
  }

  function confirmPieces() {
    const s = api.getState()
    s.setPieces(rows.map((r, i) => ({ ...newPiece(i, toContour(r.points)), name: r.name, quantity: clampQuantity(r.quantity) })))
    s.setStep(4)
  }

  function handleCanvasClick(e: MouseEvent<HTMLCanvasElement>) {
    if (mode !== 'manual') return
    if (zoom.consumeDrag()) return
    const coords = canvasClickToImageCoords(e, imageWidth, imageHeight, rotation)
    if (!coords) return
    // Cierra el contorno si el clic cae a menos de 18 px (pantalla) del primer punto
    if (manualPoints.length > 2) {
      const rect = e.currentTarget.getBoundingClientRect()
      const { scaleRatio, offsetX, offsetY } = letterbox(rect, view.w, view.h)
      const first = imageToView(manualPoints[0]!.x, manualPoints[0]!.y, imageWidth, imageHeight, rotation)
      const dx = e.clientX - rect.left - (first.x * scaleRatio + offsetX)
      const dy = e.clientY - rect.top - (first.y * scaleRatio + offsetY)
      if (Math.sqrt(dx * dx + dy * dy) < 18) return confirmPoints(manualPoints)
    }
    setManualPoints((pts) => [...pts, coords])
  }

  if (mode === 'choose') {
    return <ChooseMode onAuto={handleAutoMode} onManual={() => setMode('manual')} onBack={() => api.getState().setStep(2)} />
  }

  /** Gira la foto en pasos de 90° (solo la vista, como en el editor: los puntos y la escala no cambian). */
  const rotateBy = (delta: number) => api.getState().setImageRotation((((rotation + delta) % 360) + 360) % 360)

  // M19: volver a detectar al soltar el slider (puntero o teclado)
  const onRelease = () => void runDetection()

  return (
    <div className="vz-work">
      <div className="vz-canvas" ref={frameRef}>
        <canvas
          ref={canvasRef}
          className="vz-detect-canvas"
          style={{ cursor: mode === 'manual' ? 'crosshair' : edit.cursor, filter: mode === 'auto' && !edit.showMask ? adjustFilter(prep.brightness, prep.contrast) : undefined, ...zoom.style }}
          onClick={handleCanvasClick}
          {...(mode === 'manual' ? zoom.handlers : routed)}
        />
        <div className="vz-zoomtag glass">
          {t('statusZoom', Math.round(zoom.scale * 100))}
          {rotation !== 0 ? ` · ${rotation}°` : ''}
        </div>
        {edit.hover && <span className="vz-brush" style={{ left: edit.hover.x, top: edit.hover.y, width: edit.hover.d, height: edit.hover.d }} />}
        <ZoomBar zoom={zoom} onRotate={rotateBy} />
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
            <label className="vz-chk">
              <input
                type="checkbox"
                checked={multi}
                onChange={(e) => {
                  setMulti(e.target.checked)
                  void runDetection(e.target.checked)
                }}
              />
              {t('multiPieces')}
            </label>
            {multi && <p className="vz-muted vz-small">{t('multiPiecesHint')}</p>}
            <label className="vz-chk">
              <input
                type="checkbox"
                checked={lowRes}
                onChange={(e) => {
                  api.getState().setLowRes(e.target.checked)
                  void runDetection()
                }}
              />
              {t('lowRes')}
            </label>
            {lowRes && <p className="vz-muted vz-small">{t('lowResHint')}</p>}
            <DetectTuning
              method={method}
              threshold1={threshold1}
              threshold2={threshold2}
              detail={detail}
              onMethod={(m) => api.getState().setDetectionMethod(m)}
              onThreshold1={(v) => api.getState().setThreshold1(v)}
              onThreshold2={(v) => api.getState().setThreshold2(v)}
              onDetail={(v) => {
                detailRef.current = v
                setDetail(v)
              }}
              onRelease={onRelease}
            />
            {detectError && (
              <p className="vz-error" role="alert">
                {t('errDetect')}
              </p>
            )}
            <Button variant="ghost" onClick={() => void runDetection()} disabled={detecting}>
              {detecting ? t('detecting') : t('detectAgain')}
            </Button>
            {multi ? (
              <>
                <DetectedPieces rows={rows} onChange={setRows} />
                <Button onClick={confirmPieces} disabled={rows.length === 0 || detecting}>
                  {t('confirmPieces', rows.length)}
                </Button>
              </>
            ) : (
              <Button onClick={() => confirmPoints(detectedPoints)} disabled={detectedPoints.length < 3}>
                {t('confirmPts', detectedPoints.length)}
              </Button>
            )}
            {method === 1 && <ThresholdGuide />}
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
        {mode === 'auto' && (
          <ImageEditPanel
            edit={edit}
            edited={isPrepped(prep)}
            polarity={polarity}
            onPolarity={(p) => {
              polarityRef.current = p
              setPolarity(p)
              void runDetection()
            }}
          />
        )}
        <Button
          variant="ghost"
          onClick={() => {
            requestRef.current++
            setDetecting(false)
            setDetectError(false)
            setMode('choose')
            setDetectedPoints([])
            setManualPoints([])
            setRows([])
            setMulti(false)
          }}
        >
          <Icon name="back" inline />
          {t('changeMode')}
        </Button>
      </aside>
    </div>
  )
}

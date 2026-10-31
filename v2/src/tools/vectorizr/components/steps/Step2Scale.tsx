import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Button } from '../../../../ui/Button'
import { useVectorizr, useVectorizrApi } from '../../VectorizrStoreProvider'
import { useVzT } from '../../i18n'
import { computeScaleFactor } from '../../logic/scale'
import type { ScaleUnit } from '../../types'
import { fitZoom } from '../fit'

type Pt = { x: number; y: number }
type Rotated = { src: string; w: number; h: number }

const ZOOM_MIN = 0.3
const ZOOM_MAX = 8

/** Rota la imagen con un canvas fuera de pantalla (Step2Scale.tsx:9-29). */
function rotateImageData(img: HTMLImageElement, srcW: number, srcH: number, angleDeg: number): Rotated {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const newW = Math.round(srcW * cos + srcH * sin)
  const newH = Math.round(srcW * sin + srcH * cos)
  const canvas = document.createElement('canvas')
  canvas.width = newW
  canvas.height = newH
  const ctx = canvas.getContext('2d')
  if (!ctx) return { src: img.src, w: newW, h: newH }
  ctx.translate(newW / 2, newH / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH)
  return { src: canvas.toDataURL('image/jpeg', 0.92), w: newW, h: newH }
}

const norm = (r: number) => ((r % 360) + 360) % 360

export function Step2Scale() {
  const { t } = useVzT()
  const api = useVectorizrApi()
  const image = useVectorizr((s) => s.image)
  const imageWidth = useVectorizr((s) => s.imageWidth)
  const imageHeight = useVectorizr((s) => s.imageHeight)

  const containerRef = useRef<HTMLDivElement>(null)
  const [p1, setP1] = useState<Pt | null>(null)
  const [p2, setP2] = useState<Pt | null>(null)
  const [realValue, setRealValue] = useState('')
  const [unit, setUnit] = useState<ScaleUnit>('cm')
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(ZOOM_MIN)
  const [rotation, setRotation] = useState(0)
  const [rotated, setRotated] = useState<Rotated | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!image) {
      setRotated(null)
      return
    }
    setRotated(
      rotation === 0
        ? { src: image.image.src, w: imageWidth, h: imageHeight }
        : rotateImageData(image.image, imageWidth, imageHeight, rotation),
    )
    setP1(null)
    setP2(null)
  }, [image, rotation, imageWidth, imageHeight])

  const dispW = rotated?.w ?? imageWidth
  const dispH = rotated?.h ?? imageHeight

  // M16: ajusta la imagen al área al entrar (y al rotar)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const z = fitZoom(el.clientWidth, el.clientHeight, dispW, dispH, 16)
    if (!z) return
    const fit = Math.min(1, z)
    setMinZoom(Math.min(ZOOM_MIN, fit))
    setZoom(fit)
  }, [dispW, dispH])

  // Rueda con listener nativo no pasivo (bug #18: preventDefault en un onWheel pasivo)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 1.18 : 0.85
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(minZoom, z * delta)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [minZoom])

  function getImageCoords(e: MouseEvent<HTMLImageElement>): Pt {
    const rect = e.currentTarget.getBoundingClientRect()
    const rx = ((e.clientX - rect.left) / rect.width) * dispW
    const ry = ((e.clientY - rect.top) / rect.height) * dispH
    switch (norm(rotation)) {
      case 90:
        return { x: ry * (imageWidth / dispH), y: (dispW - rx) * (imageHeight / dispW) }
      case 180:
        return { x: (dispW - rx) * (imageWidth / dispW), y: (dispH - ry) * (imageHeight / dispH) }
      case 270:
        return { x: (dispH - ry) * (imageWidth / dispH), y: rx * (imageHeight / dispW) }
      default:
        return { x: rx, y: ry }
    }
  }

  function toDisplayPercent(pt: Pt): { left: string; top: string } {
    const rx = pt.x / imageWidth
    const ry = pt.y / imageHeight
    switch (norm(rotation)) {
      case 90:
        return { left: `${(1 - ry) * 100}%`, top: `${rx * 100}%` }
      case 180:
        return { left: `${(1 - rx) * 100}%`, top: `${(1 - ry) * 100}%` }
      case 270:
        return { left: `${ry * 100}%`, top: `${(1 - rx) * 100}%` }
      default:
        return { left: `${rx * 100}%`, top: `${ry * 100}%` }
    }
  }

  function handleImgClick(e: MouseEvent<HTMLImageElement>) {
    const coords = getImageCoords(e)
    setError(null)
    if (!p1) return setP1(coords)
    if (!p2) return setP2(coords)
    setP1(coords)
    setP2(null)
  }

  function confirm() {
    if (!p1 || !p2 || !realValue) return
    const val = parseFloat(realValue)
    // M15: avisar en lugar de ignorar en silencio
    if (isNaN(val) || val <= 0) return setError(t('errRealValue'))
    if (p1.x === p2.x && p1.y === p2.y) return setError(t('errSamePoints'))
    const factor = computeScaleFactor(p1, p2, val, unit)
    api.getState().setScaleRef({ p1, p2, realValue: val, unit }, factor)
    api.getState().setStep(3)
  }

  const dot = (p: Pt, key: string) => {
    const pos = toDisplayPercent(p)
    return <div key={key} className="vz-scale-dot" style={{ left: pos.left, top: pos.top }} />
  }
  const line = (a: Pt, b: Pt) => {
    const d1 = toDisplayPercent(a)
    const d2 = toDisplayPercent(b)
    const x1 = parseFloat(d1.left)
    const y1 = parseFloat(d1.top)
    const x2 = parseFloat(d2.left)
    const y2 = parseFloat(d2.top)
    const lenPct = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
    return (
      <div
        className="vz-scale-line"
        style={{ left: d1.left, top: d1.top, width: `${lenPct}%`, transform: `rotate(${angle}deg)` }}
      />
    )
  }

  return (
    <div className="vz-step">
      <div className="vz-bar glass">
        <Button variant="ghost" onClick={() => api.getState().setStep(1)}>
          {t('back')}
        </Button>
        <span className="vz-bar__hint">{!p1 ? t('scaleHint1') : !p2 ? t('scaleHint2') : t('scaleHint3')}</span>
        <span className="vz-spacer" />
        <button
          type="button"
          className="vz-ib"
          title={t('zoomOut')}
          aria-label={t('zoomOut')}
          onClick={() => setZoom((z) => Math.max(minZoom, z * 0.8))}
        >
          −
        </button>
        <span className="vz-pill">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="vz-ib"
          title={t('zoomIn')}
          aria-label={t('zoomIn')}
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.2))}
        >
          +
        </button>
        <button type="button" className="vz-ib vz-ib--txt" title={t('oneToOne')} onClick={() => setZoom(1)}>
          1:1
        </button>
        <span className="vz-sep" />
        <button
          type="button"
          className="vz-ib"
          title={t('rotateLeft')}
          aria-label={t('rotateLeft')}
          onClick={() => setRotation((r) => r - 90)}
        >
          ↺
        </button>
        <button
          type="button"
          className="vz-ib"
          title={t('rotateRight')}
          aria-label={t('rotateRight')}
          onClick={() => setRotation((r) => r + 90)}
        >
          ↻
        </button>
        {rotation !== 0 && <span className="vz-pill">{norm(rotation)}°</span>}
      </div>

      <div className="vz-work">
        <div ref={containerRef} className="vz-canvas vz-canvas--scroll">
          <div className="vz-scale-img">
            {rotated && (
              <img
                src={rotated.src}
                alt={t('refAlt')}
                draggable={false}
                onClick={handleImgClick}
                style={{ width: `${dispW * zoom}px`, height: `${dispH * zoom}px` }}
              />
            )}
            {rotated && (p1 || p2) && (
              <div className="vz-scale-overlay">
                {p1 && dot(p1, 'p1')}
                {p2 && dot(p2, 'p2')}
                {p1 && p2 && line(p1, p2)}
              </div>
            )}
          </div>
        </div>

        {p1 && p2 && (
          <aside className="vz-side glass">
            <label className="vz-field">
              <span className="vz-muted">{t('realLabel')}</span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder={t('realPlaceholder')}
                value={realValue}
                autoFocus
                onChange={(e) => {
                  setRealValue(e.target.value)
                  setError(null)
                }}
              />
            </label>
            <select className="vz-select" value={unit} onChange={(e) => setUnit(e.target.value as ScaleUnit)}>
              <option value="mm">{t('unitMm')}</option>
              <option value="cm">{t('unitCm')}</option>
              <option value="m">{t('unitM')}</option>
              <option value="in">{t('unitIn')}</option>
            </select>
            {error && (
              <p className="vz-error" role="alert">
                {error}
              </p>
            )}
            <Button onClick={confirm} disabled={!realValue}>
              {t('confirmScale')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setP1(null)
                setP2(null)
                setError(null)
              }}
            >
              {t('remark')}
            </Button>
          </aside>
        )}
      </div>
    </div>
  )
}

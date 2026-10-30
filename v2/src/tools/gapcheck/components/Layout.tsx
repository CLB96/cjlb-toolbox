import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '../../../i18n/useI18n'
import { GlassPanel } from '../../../ui/GlassPanel'
import { toast } from '../../../ui/toastStore'
import { useGapcheck, useGapcheckApi } from '../GapcheckStoreProvider'
import { useGapcheckT } from '../i18n'
import { POINT_COLORS } from '../logic/chartStyle'
import { Marker } from './Marker'
import { RichText } from './RichText'

/** Límite de Plan 1: archivos mayores no entran en el snapshot guardado. */
const MAX_PERSISTED_BYTES = 20 * 1024 * 1024
const MARKER_MIN = 20
const MARKER_MAX = 60
const MARKER_STEP = 2

/** URL temporal del Blob, revocada al cambiar de imagen o desmontar. */
function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}

interface ImageInputProps {
  disabled: boolean
  testId: string
  onFile: (file: File) => void
}

function ImageInput({ disabled, testId, onFile }: ImageInputProps) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (file) onFile(file)
  }
  return (
    <input
      type="file"
      className="gc-file-input"
      accept="image/*"
      disabled={disabled}
      data-testid={testId}
      onChange={onChange}
    />
  )
}

/** Gapcheck Layout (inventario §8): imagen del diagrama + marcadores arrastrables por punto. */
export function Layout({ disabled }: { disabled: boolean }) {
  const t = useGapcheckT()
  const { t: tApp } = useI18n()
  const api = useGapcheckApi()
  const [open, setOpen] = useState(true)
  const [over, setOver] = useState(false)
  const overlay = useRef<HTMLDivElement>(null)
  const sliderId = useId()
  const { points, image, imageName, markers, markerSize } = useGapcheck(
    useShallow((s) => ({
      points: s.points,
      image: s.layout.image,
      imageName: s.layout.imageName,
      markers: s.layout.markers,
      markerSize: s.layout.markerSize,
    })),
  )
  const url = useObjectUrl(image)

  const onFile = (file: File) => {
    if (disabled) return
    if (!file.type.startsWith('image/')) {
      toast('error', t('selectImage'))
      return
    }
    api.getState().setLayoutImage(file, file.name)
    if (file.size > MAX_PERSISTED_BYTES) toast('warn', tApp('persist.largeFilesSkipped'))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  const getImageRect = () => overlay.current?.getBoundingClientRect() ?? null
  const moveMarker = (i: number) => (x: number, y: number) => api.getState().moveMarker(i, x, y)

  return (
    <GlassPanel as="section" className="gc-card gc-layout" aria-labelledby="gc-layout-title">
      <h2 id="gc-layout-title" className="gc-card__title">
        <button
          type="button"
          className="gc-table-toggle"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true">{open ? '▾' : '▸'}</span> 📐 {t('gapLayout')}
        </button>
      </h2>
      {open && (
        <div className="gc-layout__body">
          <p className="gc-muted">{t('gapLayoutSubtitle')}</p>
          {!image ? (
            <label
              className={`gc-drop${over ? ' gc-drop--over' : ''}${disabled ? ' gc-drop--disabled' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                if (!disabled) setOver(true)
              }}
              onDragLeave={() => setOver(false)}
              onDrop={onDrop}
            >
              <ImageInput disabled={disabled} testId="gc-layout-input" onFile={onFile} />
              <span className="gc-drop__icon" aria-hidden="true">
                📐
              </span>
              <span className="gc-drop__text">
                <RichText text={t('gapLayoutDrop')} />
              </span>
            </label>
          ) : (
            <>
              <div className="gc-layout__bar">
                <div className="gc-layout__size">
                  <label htmlFor={sliderId} className="gc-layout__size-label">
                    {t('markerSizeLabel')}
                  </label>
                  <input
                    id={sliderId}
                    type="range"
                    className="gc-layout__slider"
                    min={MARKER_MIN}
                    max={MARKER_MAX}
                    step={MARKER_STEP}
                    value={markerSize}
                    disabled={disabled}
                    onChange={(e) => api.getState().setMarkerSize(parseInt(e.target.value, 10))}
                  />
                  <span className="gc-layout__size-value">{`${markerSize}px`}</span>
                </div>
                {imageName && (
                  <span className="gc-file">
                    <strong>{imageName}</strong>
                  </span>
                )}
                <label className={`btn btn--ghost gc-pick${disabled ? ' gc-pick--disabled' : ''}`}>
                  {t('changeImage')}
                  <ImageInput disabled={disabled} testId="gc-layout-change" onFile={onFile} />
                </label>
              </div>
              <p className="gc-layout__hint">{t('gapLayoutInstructions')}</p>
              <div className="gc-layout__scroll">
                <div className="gc-layout__stage">
                  {url && <img className="gc-layout__img" src={url} alt="Gapcheck Layout" draggable={false} />}
                  <div ref={overlay} className="gc-layout__overlay" data-testid="gc-layout-overlay">
                    {markers.map((m) => (
                      <Marker
                        key={m.pointIndex}
                        index={m.pointIndex}
                        name={points[m.pointIndex]?.name ?? ''}
                        color={POINT_COLORS[m.pointIndex % POINT_COLORS.length]}
                        x={m.x}
                        y={m.y}
                        size={markerSize}
                        getImageRect={getImageRect}
                        onMove={moveMarker(m.pointIndex)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </GlassPanel>
  )
}

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '../../../ui/Button'
import { Marker } from '../../../ui/Marker'
import { toast } from '../../../ui/toastStore'
import { useCapa, useCapaApi } from '../CapaflowStoreProvider'
import { INLINE, useCapaT } from '../i18n'
import { colorForCpk } from '../logic'
import { clampDrop, type CapaPoint } from '../store'
import { Section } from './ChartSections'

const MARKER_MIN = 20
const MARKER_MAX = 60

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

const colorOf = (p: CapaPoint) => (p.result.Cpk != null ? colorForCpk(p.result.Cpk) : 'var(--accent)')

/** Plano con marcadores (widget de foto del original, 4271-4503) dentro de una tarjeta plegable. */
export function PlanSection({ onExport }: { onExport: () => void }) {
  const { t, lang } = useCapaT()
  const api = useCapaApi()
  const sliderId = useId()
  const overlay = useRef<HTMLDivElement>(null)
  const [over, setOver] = useState(false)
  const { points, photo, photoName, markers, markerSize, fit } = useCapa(
    useShallow((s) => ({ points: s.points, photo: s.photo, photoName: s.photoName, markers: s.markers, markerSize: s.markerSize, fit: s.photoFit })),
  )
  const url = useObjectUrl(photo)

  const onFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('error', t('v2.notImage'))
      return
    }
    api.getState().setPhoto(file, file.name)
  }
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) onFile(file)
  }
  const onDropFile = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }
  const onDropMarker = (e: DragEvent) => {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData('text/plain'))
    const rect = overlay.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || Number.isNaN(id)) return
    api.getState().placeMarker(id, clampDrop(((e.clientX - rect.left) / rect.width) * 100), clampDrop(((e.clientY - rect.top) / rect.height) * 100))
  }

  const posOf = (p: CapaPoint) => points.indexOf(p) + 1
  const unplaced = points.filter((p) => !markers[p.id])
  const placed = points.filter((p) => markers[p.id])
  const nameOf = (p: CapaPoint) => p.result.pointName || INLINE.pointShort(lang, posOf(p))

  return (
    <Section panel="photo" title={t('v2.photoSection')}>
      {!photo ? (
        <label
          className={`cf-drop${over ? ' cf-drop--over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDropFile}
        >
          <input type="file" className="cf-file-input" accept="image/*" data-testid="cf-photo-input" onChange={onPick} />
          <span aria-hidden="true">📷</span> {t('v2.photoDrop')}
        </label>
      ) : (
        <>
          <div className="cf-photo-bar">
            <label htmlFor={sliderId} className="cf-muted">{t('v2.markerSize')}</label>
            <input id={sliderId} type="range" min={MARKER_MIN} max={MARKER_MAX} step={2} value={markerSize} onChange={(e) => api.getState().setMarkerSize(parseInt(e.target.value, 10))} />
            <span className="cf-muted">{`${markerSize}px`}</span>
            {photoName && <strong className="cf-file">{photoName}</strong>}
            <Button variant="ghost" aria-pressed={!fit} onClick={() => api.getState().setPhotoFit(!fit)}>{t('v2.realSize')}</Button>
            <label className="btn btn--ghost cf-pick">
              {t('photo.change')}
              <input type="file" className="cf-file-input" accept="image/*" data-testid="cf-photo-change" onChange={onPick} />
            </label>
            <Button variant="ghost" title={t('v2.pending')} onClick={onExport}>{t('photo.exportBtn')}</Button>
          </div>
          <div className="cf-tray" data-testid="cf-tray">
            {unplaced.length > 0 && <div className="cf-tray__label">{INLINE.dragTo[lang]}</div>}
            {unplaced.map((p) => (
              <div
                key={p.id}
                className="cf-tray__item"
                draggable
                role="button"
                tabIndex={0}
                title={nameOf(p)}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', String(p.id))
                }}
                onClick={() => api.getState().placeMarker(p.id, 50, 50)}
                onKeyDown={(e) => e.key === 'Enter' && api.getState().placeMarker(p.id, 50, 50)}
              >
                <span className="cf-tray__dot" style={{ background: colorOf(p) }}>{posOf(p)}</span>
                <span className="cf-tray__name">{nameOf(p)}</span>
              </div>
            ))}
            {placed.length > 0 && <div className="cf-tray__label">{INLINE.placed[lang]}</div>}
            {placed.map((p) => (
              <button key={p.id} type="button" className="cf-tray__item cf-tray__item--placed" title={INLINE.remove[lang]} onClick={() => api.getState().removeMarker(p.id)}>
                <span className="cf-tray__dot" style={{ background: colorOf(p) }}>{posOf(p)}</span>
                <span className="cf-tray__name">{nameOf(p)}</span>
                {p.result.Cpk != null && <span className="cf-muted"> · Cpk {p.result.Cpk.toFixed(3)}</span>}
                <span aria-hidden="true" className="cf-tray__x">✕</span>
              </button>
            ))}
          </div>
          <div className={`cf-photo__scroll${fit ? ' cf-photo__scroll--fit' : ''}`}>
            <div className="cf-photo__stage">
              {url && <img className="cf-photo__img" src={url} alt="CapaFlow" draggable={false} onError={() => { toast('error', t('v2.badImage')); api.getState().setPhoto(null, null) }} />}
              <div ref={overlay} className="cf-photo__overlay" data-testid="cf-photo-overlay" onDragOver={(e) => e.preventDefault()} onDrop={onDropMarker}>
                {placed.map((p) => (
                  <Marker
                    key={p.id}
                    className="cf-marker"
                    testId={`cf-marker-${p.id}`}
                    name={p.result.pointName || String(posOf(p))}
                    label={String(posOf(p))}
                    dataLabel={p.result.pointName || String(posOf(p))}
                    color={colorOf(p)}
                    x={markers[p.id]!.x}
                    y={markers[p.id]!.y}
                    size={markerSize}
                    getImageRect={() => overlay.current?.getBoundingClientRect() ?? null}
                    onMove={(x, y) => api.getState().placeMarker(p.id, x, y)}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Section>
  )
}

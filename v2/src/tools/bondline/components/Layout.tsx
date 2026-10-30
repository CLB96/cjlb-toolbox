import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '../../../ui/Button'
import { Marker } from '../../../ui/Marker'
import { RichText } from '../../../ui/RichText'
import { toast } from '../../../ui/toastStore'
import { useBondline, useBondlineApi } from '../BondlineStoreProvider'
import { useBondlineT } from '../i18n'
import { TC_COLORS } from '../logic/types'
import { Collapsible } from './Collapsible'

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
      className="bl-file-input"
      accept="image/*"
      disabled={disabled}
      data-testid={testId}
      onChange={onChange}
    />
  )
}

/** Bondline Layout (inventario §2B): imagen del guante + un marcador arrastrable por TC visible. */
export function Layout({ disabled }: { disabled: boolean }) {
  const t = useBondlineT()
  const api = useBondlineApi()
  const [over, setOver] = useState(false)
  const overlay = useRef<HTMLDivElement>(null)
  const hintId = useId()
  const fit = useBondline((s) => s.layoutFit)
  const visibility = useBondline((s) => s.config.tcVisibility)
  const { image, imageName, markers } = useBondline(
    useShallow((s) => ({
      image: s.config.layout.image,
      imageName: s.config.layout.imageName,
      markers: s.config.layout.markers,
    })),
  )
  const url = useObjectUrl(image)

  const onFile = (file: File) => {
    if (disabled) return
    if (!file.type.startsWith('image/')) {
      toast('error', t('selectImage'))
      return
    }
    // >20 MB: la persistencia avisa una vez al autoguardar; aquí se usa igualmente
    api.getState().setLayoutImage(file, file.name)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  const onImageError = () => {
    toast('error', t('imageLoadFailed'))
    api.getState().setLayoutImage(null, null)
  }

  const getImageRect = () => overlay.current?.getBoundingClientRect() ?? null

  return (
    <Collapsible panel="layout" title={t('layoutTitle')} subtitle={t('layoutSubtitle')}>
      {!image ? (
        <label
          className={`bl-drop${over ? ' bl-drop--over' : ''}${disabled ? ' bl-drop--disabled' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          <ImageInput disabled={disabled} testId="bl-layout-input" onFile={onFile} />
          <span className="bl-drop__icon" aria-hidden="true">
            📍
          </span>
          <span className="bl-drop__text">
            <RichText text={t('layoutDrop')} />
          </span>
        </label>
      ) : (
        <>
          <div className="bl-layout__bar">
            {imageName && (
              <span className="bl-chip">
                {t('layoutFileName')} <strong>{imageName}</strong>
              </span>
            )}
            <Button
              variant="ghost"
              aria-pressed={!fit}
              disabled={disabled}
              onClick={() => api.getState().setLayoutFit(!fit)}
            >
              {t('layoutRealSize')}
            </Button>
            <label className={`btn btn--ghost bl-pick${disabled ? ' bl-pick--disabled' : ''}`}>
              {t('changeImage')}
              <ImageInput disabled={disabled} testId="bl-layout-change" onFile={onFile} />
            </label>
          </div>
          <p id={hintId} className="bl-layout__hint">
            {t('layoutInstructions')}
          </p>
          <div className={`bl-layout__scroll${fit ? ' bl-layout__scroll--fit' : ''}`}>
            <div className="bl-layout__stage">
              {url && (
                <img
                  className="bl-layout__img"
                  src={url}
                  alt="Bondline Layout"
                  draggable={false}
                  onError={onImageError}
                />
              )}
              <div ref={overlay} className="bl-layout__overlay" data-testid="bl-layout-overlay">
                {markers
                  .filter((m) => visibility[m.tcIndex])
                  .map((m) => (
                    <Marker
                      key={m.tcIndex}
                      className="bl-marker"
                      testId={`bl-marker-${m.tcIndex}`}
                      name={`TC-${m.tcIndex + 1}`}
                      label={String(m.tcIndex + 1)}
                      dataLabel={`TC-${m.tcIndex + 1}`}
                      color={TC_COLORS[m.tcIndex % TC_COLORS.length]}
                      x={m.x}
                      y={m.y}
                      disabled={disabled}
                      describedBy={hintId}
                      getImageRect={getImageRect}
                      onMove={(x, y) => api.getState().moveMarker(m.tcIndex, x, y)}
                    />
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Collapsible>
  )
}

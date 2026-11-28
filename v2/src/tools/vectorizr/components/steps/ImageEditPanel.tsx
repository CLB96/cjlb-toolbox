import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../../ui/Button'
import { ElasticSlider } from '../../../../ui/ElasticSlider'
import { useVzT, type VzKey } from '../../i18n'
import { ADJUST_MAX, ADJUST_MIN } from '../../logic/prepImage'
import type { Polarity } from './DetectTuning'
import { Segmented } from './Segmented'
import type { useImagePrep, PrepTool } from './useImagePrep'

type Edit = ReturnType<typeof useImagePrep>

const TOOLS: { id: Exclude<PrepTool, 'none'>; label: VzKey; hint: VzKey }[] = [
  { id: 'crop', label: 'editCrop', hint: 'editCropHint' },
  { id: 'erase', label: 'editErase', hint: 'editEraseHint' },
]

interface Props {
  edit: Edit
  edited: boolean
  polarity: Polarity
  onPolarity: (p: Polarity) => void
}

/**
 * Botón colapsable «Editar imagen». De arriba abajo: Recortar e Ignorar zona, color de la pieza, brillo y contraste,
 * ver lo que detecta y, al final, deshacer y foto completa.
 */
export function ImageEditPanel({ edit, edited, polarity, onPolarity }: Props) {
  const { t } = useVzT()
  const [open, setOpen] = useState(false)
  const fold = useRef<HTMLDivElement>(null)
  // Cerrado no se puede enfocar ni tabular (inert), aunque siga montado para animar el plegado
  useEffect(() => {
    fold.current?.toggleAttribute('inert', !open)
  }, [open])
  const active = TOOLS.find((x) => x.id === edit.tool)

  function toggle() {
    if (open) edit.setTool('none')
    setOpen(!open)
  }

  return (
    <div className="vz-edit">
      <Button variant="ghost" onClick={toggle} aria-expanded={open}>
        {t('editImage')}
        {edited ? ' •' : ''}
        <span className="vz-chev" aria-hidden="true">
          ▾
        </span>
      </Button>
      <div ref={fold} className="vz-fold" data-open={open} aria-hidden={!open}>
        <div className="vz-fold__inner">
          <div className="vz-edit__body">
            <Segmented
              options={TOOLS.map((x) => ({ value: x.id, label: t(x.label) }))}
              value={edit.tool === 'none' ? null : edit.tool}
              onChange={(id) => edit.setTool(edit.tool === id ? 'none' : id)}
            />
            {active && (
              <p key={active.id} className="vz-muted vz-small vz-rise-in">
                {t(active.hint)}
              </p>
            )}
            <p className="vz-muted vz-small">{t('editZoomHint')}</p>
            {edit.tool === 'erase' && (
              <label className="vz-field vz-rise-in">
                <span className="vz-slider-label">
                  <span>{t('editBrush')}</span>
                </span>
                <ElasticSlider min={1} max={20} value={edit.brush} onChange={(e) => edit.setBrush(Number(e.target.value))} />
              </label>
            )}
            <div className="vz-field">
              <span className="vz-slider-label">
                <span>{t('polarityLabel')}</span>
              </span>
              <Segmented
                label={t('polarityLabel')}
                options={[
                  { value: 'auto' as Polarity, label: t('polarityAuto') },
                  { value: 'dark' as Polarity, label: t('polarityDark') },
                  { value: 'light' as Polarity, label: t('polarityLight') },
                ]}
                value={polarity}
                onChange={onPolarity}
              />
              <span className="vz-muted vz-small">{t('polarityHint')}</span>
            </div>
            {(['brightness', 'contrast'] as const).map((key) => (
              <label key={key} className="vz-field">
                <span className="vz-slider-label">
                  <span>{t(key === 'brightness' ? 'editBrightness' : 'editContrast')}</span>
                  <b>{edit.prep[key]}</b>
                </span>
                <ElasticSlider
                  min={ADJUST_MIN}
                  max={ADJUST_MAX}
                  value={edit.prep[key]}
                  onChange={(e) => edit.setAdjust(key, Number(e.target.value))}
                  onPointerUp={edit.commitAdjust}
                  onKeyUp={edit.commitAdjust}
                />
              </label>
            ))}
            <label className="vz-chk">
              <input type="checkbox" checked={edit.showMask} onChange={(e) => edit.setShowMask(e.target.checked)} />
              {t('editMask')}
            </label>
            {edit.showMask && <p className="vz-muted vz-small vz-rise-in">{t('editMaskHint')}</p>}
            <div className="vz-edit__row">
              <Button variant="ghost" onClick={edit.undo} disabled={!edit.canUndo}>
                {t('editUndo')}
              </Button>
              <Button variant="ghost" onClick={edit.fullPhoto} disabled={!edited}>
                {t('editFullPhoto')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

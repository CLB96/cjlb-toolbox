import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useQn } from '../QnStoreProvider'
import { isQnKey, useQnT } from '../i18n'
import type { RotationMode } from '../logic/types'
import { useQnActions } from '../useQnActions'
import { Choice, NumberField } from './common'

const PRESETS = ['0', '90', '45', '180', '30']

export function QuantityPanel() {
  const t = useQnT()
  const form = useQn((s) => s.form)
  const busy = useQn((s) => s.busy)
  const message = useQn((s) => s.message)
  const setField = useQn((s) => s.setField)
  const { generate } = useQnActions()
  const automatic = form.mode === 'auto'
  const total = !automatic && form.multiplePlies
  const fixed = form.rotation === 'fixed'
  const rotation = (value: RotationMode, label: string) => (
    <Choice type="radio" name="qn-rotation" checked={form.rotation === value} disabled={busy}
      onChange={() => setField('rotation', value)}>{label}</Choice>
  )

  return (
    <GlassPanel as="section" className="qn-panel" aria-labelledby="qn-quantities">
      <h3 id="qn-quantities" className="qn-h">{t('quantities')}</h3>
      <Choice type="radio" name="qn-mode" checked={automatic} disabled={busy} onChange={() => setField('mode', 'auto')}>{t('auto')}</Choice>
      <Choice type="radio" name="qn-mode" checked={!automatic} disabled={busy} onChange={() => setField('mode', 'manual')}>{t('manual')}</Choice>
      {!automatic && (
        <>
          <NumberField label={t(total ? 'copiesTotal' : 'copies')} value={form.quantity} step="1" min="1" disabled={busy}
            onChange={(v) => setField('quantity', v)} />
          <Choice type="checkbox" checked={form.multiplePlies} disabled={busy}
            onChange={(e) => setField('multiplePlies', e.target.checked)}>{t('multiplePlies')}</Choice>
          {total && <p className="qn-help">{t('multipleHelp')}</p>}
        </>
      )}
      <p className="qn-help">{t('autoHelp')}</p>
      <hr className="qn-sep" />
      <fieldset className="qn-fieldset">
        <legend>{t('rotateQuestion')}</legend>
        {rotation('free', t('allowRotation'))}
        {rotation('independent', t('independentRotation'))}
        {rotation('fixed', t('fixedRotation'))}
        {fixed && (
          <div className="qn-angle">
            <label className="qn-field">
              <span>{t('orientation')}</span>
              <select value={form.anglePreset} disabled={busy} onChange={(e) => setField('anglePreset', e.target.value)}>
                {PRESETS.map((a) => <option key={a} value={a}>{a}°</option>)}
                <option value="custom">{t('custom')}</option>
              </select>
            </label>
            {form.anglePreset === 'custom' && (
              <NumberField label={t('customAngle')} value={form.customAngle} min="-360" disabled={busy}
                onChange={(v) => setField('customAngle', v)} />
            )}
          </div>
        )}
        <p className="qn-help">{t(fixed ? 'fixedHelp' : form.rotation === 'independent' ? 'independentHelp' : 'freeHelp')}</p>
      </fieldset>
      <hr className="qn-sep" />
      <Button className="qn-generate" disabled={busy} onClick={() => void generate()}>{t(busy ? 'running' : 'generate')}</Button>
      <p className="qn-feedback" role="status" data-kind={message.kind}>
        {isQnKey(message.key) ? t(message.key, message.values) : message.key}
      </p>
    </GlassPanel>
  )
}

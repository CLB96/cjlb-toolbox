import { GlassPanel } from '../../../ui/GlassPanel'
import { useQn } from '../QnStoreProvider'
import { useQnT } from '../i18n'
import { selectedLayout } from '../logic/plans'
import { Choice, NumberField, useQnFormat } from './common'

export function SpreadPanel() {
  const t = useQnT()
  const format = useQnFormat()
  const form = useQn((s) => s.form)
  const busy = useQn((s) => s.busy)
  const layout = useQn((s) => selectedLayout(s.result, s.viewGroup))
  const setField = useQn((s) => s.setField)
  const automatic = form.mode === 'auto'
  const total = !automatic && form.multiplePlies
  const calculated = layout?.length != null
    ? `${format(layout.length)} mm${layout.lengthIsPartial ? t('partialLength') : ''}`
    : t('pendingLength')

  return (
    <GlassPanel as="section" className="qn-panel" aria-labelledby="qn-dimensions">
      <h3 id="qn-dimensions" className="qn-h">{t('dimensions')}</h3>
      <NumberField label={t('rollWidth')} value={form.width} disabled={busy} onChange={(v) => setField('width', v)} />
      {(automatic || total) ? (
        <NumberField label={t(total ? 'plyLength' : 'spreadLength')} value={form.length} disabled={busy}
          onChange={(v) => setField('length', v)} />
      ) : (
        <div className="qn-field">
          <span>{t('calculatedLength')}</span>
          <output className="qn-output">{calculated}</output>
        </div>
      )}
      <NumberField label={t('gap')} value={form.gap} disabled={busy} onChange={(v) => setField('gap', v)} />
      <p className="qn-help">{t('gapHelp')}</p>
      <details className="qn-extras">
        <summary>{t('extras')}</summary>
        <Choice type="checkbox" checked={form.marginEnabled} disabled={busy}
          onChange={(e) => setField('marginEnabled', e.target.checked)}>{t('enableMargin')}</Choice>
        {form.marginEnabled && (
          <NumberField label={t('margin')} value={form.margin} disabled={busy} onChange={(v) => setField('margin', v)} />
        )}
        <p className="qn-help">{t('marginHelp')}</p>
      </details>
    </GlassPanel>
  )
}

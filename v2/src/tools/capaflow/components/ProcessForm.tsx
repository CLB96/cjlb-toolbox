import { forwardRef, type ReactNode } from 'react'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { toast } from '../../../ui/toastStore'
import { useCapa, useCapaApi } from '../CapaflowStoreProvider'
import { useCapaT, type CapaKey } from '../i18n'
import { analysisErrorMessage, analysisWarningMessage } from '../logic'
import type { CapaForm } from '../store'

interface FieldProps {
  field: keyof CapaForm
  label: string
  tip?: string
  placeholder?: string
  disabled: boolean
  inputMode?: 'decimal' | 'numeric'
}

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ field, label, tip, placeholder, disabled, inputMode }, ref) {
  const api = useCapaApi()
  const value = useCapa((s) => s.form[field])
  return (
    <label className="cf-field">
      <span title={tip}>{label}</span>
      <input
        ref={ref}
        className="cf-input"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        onChange={(e) => api.getState().setField(field, e.target.value)}
      />
    </label>
  )
})

const THRESHOLDS: { key: CapaKey; cond: string; color: string }[] = [
  { key: 'qref.worldClass', cond: 'Cpk ≥ 1.67', color: 'var(--ok)' },
  { key: 'qref.capable', cond: 'Cpk ≥ 1.33', color: 'var(--accent-2)' },
  { key: 'qref.marginal', cond: 'Cpk ≥ 1.00', color: 'var(--warn)' },
  { key: 'qref.notCapable', cond: 'Cpk < 1.00', color: 'var(--error)' },
]

function Sub({ children }: { children: ReactNode }) {
  return <div className="cf-sub">{children}</div>
}

/** Columna izquierda: Configuración del Proceso y Referencia Rápida. */
export const ProcessForm = forwardRef<HTMLInputElement, { disabled: boolean }>(function ProcessForm({ disabled }, nameRef) {
  const { t, lang } = useCapaT()
  const api = useCapaApi()
  const hasPoints = useCapa((s) => s.points.length > 0)

  const onCalculate = () => {
    const out = api.getState().calculate()
    if (!out.ok) toast('error', analysisErrorMessage(out.error, lang))
    else out.warnings.forEach((w) => toast('warn', analysisWarningMessage(w, lang)))
  }

  return (
    <GlassPanel as="section" className="cf-card cf-form" aria-labelledby="cf-form-title">
      <h2 id="cf-form-title" className="cf-card__title">⚙ {t('form.title')}</h2>
      <Sub>{t('form.specs')}</Sub>
      <div className="cf-row3">
        <Field field="lsl" label={t('form.lsl')} tip={t('tip.lsl')} placeholder={t('form.placeholder.lsl')} disabled={disabled} inputMode="decimal" />
        <Field field="usl" label={t('form.usl')} tip={t('tip.usl')} placeholder={t('form.placeholder.usl')} disabled={disabled} inputMode="decimal" />
        <Field field="target" label={t('form.target')} tip={t('tip.target')} placeholder={t('form.placeholder.target')} disabled={disabled} inputMode="decimal" />
      </div>
      <Sub>{t('form.data')}</Sub>
      <label className="cf-field">
        <span>{t('form.dataLabel')}</span>
        <DataArea disabled={disabled} placeholder={t('form.placeholder.data')} />
      </label>
      <Button variant="ghost" disabled={disabled} onClick={() => api.getState().loadSample()}>{t('form.sample')}</Button>
      <Sub>{t('form.pointSection')}</Sub>
      <Field ref={nameRef} field="pointName" label={t('form.pointLabel')} placeholder={t('form.placeholder.pointName')} disabled={disabled} />
      <Sub>{t('form.advanced')}</Sub>
      <div className="cf-row2">
        <Field field="subgroupSize" label={t('form.subgroup')} tip={t('tip.subgroup')} disabled={disabled} inputMode="numeric" />
        <Field field="confidence" label={t('form.confidence')} disabled={disabled} inputMode="numeric" />
      </div>
      <Button disabled={disabled} onClick={onCalculate}>{`▶ ${t('form.calculate')}`}</Button>
      {hasPoints && (
        <Button variant="ghost" className="cf-danger" disabled={disabled} onClick={() => api.getState().clearProject()}>{t('form.clearProject')}</Button>
      )}
      <Sub>{t('panel.qref')}</Sub>
      <div className="cf-ref">
        {THRESHOLDS.map((th) => (
          <span key={th.key}>
            <i><b className="cf-ref__dot" style={{ background: th.color }} />{th.cond}</i>
            {t(th.key)}
          </span>
        ))}
      </div>
    </GlassPanel>
  )
})

function DataArea({ disabled, placeholder }: { disabled: boolean; placeholder: string }) {
  const api = useCapaApi()
  const raw = useCapa((s) => s.form.raw)
  return <textarea className="cf-input cf-data" value={raw} placeholder={placeholder} disabled={disabled} onChange={(e) => api.getState().setField('raw', e.target.value)} />
}

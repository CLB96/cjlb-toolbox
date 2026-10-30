import { useBondline, useBondlineApi } from '../BondlineStoreProvider'
import { useBondlineT, type BondlineKey } from '../i18n'
import { computeLoss } from '../logic/loss'
import type { ScalarParamKey } from '../store'
import { Collapsible } from './Collapsible'

interface NumberFieldProps {
  id: string
  label: string
  value: string
  disabled: boolean
  onChange: (v: string) => void
}

function NumberField({ id, label, value, disabled, onChange }: NumberFieldProps) {
  return (
    <div className="bl-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        step="0.1"
        className="bl-input"
        placeholder="°C"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function LossBox({ testId, label, thermo, nest }: { testId: string; label: string; thermo: string; nest: string }) {
  const loss = computeLoss(thermo, nest)
  return (
    <div className="bl-field">
      <span>{label}</span>
      <div className={`bl-loss${loss.positive ? ' bl-loss--pos' : ''}`} data-testid={testId}>
        {loss.text}
      </div>
    </div>
  )
}

interface Zone {
  zone: 'upper' | 'lower'
  heading: BondlineKey
  thermo: { key: ScalarParamKey; label: BondlineKey }
  nest: { key: ScalarParamKey; label: BondlineKey }
}

const ZONES: readonly Zone[] = [
  {
    zone: 'upper',
    heading: 'paramUpper',
    thermo: { key: 'thermoUpper', label: 'paramThermoregUpper' },
    nest: { key: 'nestUpper', label: 'paramNestUpper' },
  },
  {
    zone: 'lower',
    heading: 'paramLower',
    thermo: { key: 'thermoLower', label: 'paramThermoregLower' },
    nest: { key: 'nestLower', label: 'paramNestLower' },
  },
]

/** Parámetros del proceso (inventario §6): pérdidas, leisters dinámicos y sliders. */
export function ProcessParams({ disabled }: { disabled: boolean }) {
  const t = useBondlineT()
  const api = useBondlineApi()
  const params = useBondline((s) => s.config.params)
  const { setParam, addLeister, removeLeister, setLeister } = api.getState()

  return (
    <Collapsible panel="params" title={t('paramsTitle')} subtitle={t('paramsSubtitleFull')}>
      {ZONES.map((z) => (
        <div key={z.zone} className="bl-group">
          <div className="bl-sub">{t(z.heading)}</div>
          <div className="bl-row3">
            <NumberField
              id={`bl-${z.thermo.key}`}
              label={t(z.thermo.label)}
              value={params[z.thermo.key]}
              disabled={disabled}
              onChange={(v) => setParam(z.thermo.key, v)}
            />
            <NumberField
              id={`bl-${z.nest.key}`}
              label={t(z.nest.label)}
              value={params[z.nest.key]}
              disabled={disabled}
              onChange={(v) => setParam(z.nest.key, v)}
            />
            <LossBox
              testId={z.zone === 'upper' ? 'lossUpper' : 'lossLower'}
              label={t('paramLoss')}
              thermo={params[z.thermo.key]}
              nest={params[z.nest.key]}
            />
          </div>
        </div>
      ))}
      <div className="bl-group">
        <div className="bl-sub">{t('paramLeistersLabel')}</div>
        <div className="bl-leisters">
          {params.leisters.map((value, i) => (
            <NumberField
              key={i}
              id={`bl-leister-${i}`}
              label={`Leister ${i + 1}`}
              value={value}
              disabled={disabled}
              onChange={(v) => setLeister(i, v)}
            />
          ))}
          <div className="bl-leisters__actions">
            <button type="button" className="btn btn--ghost" title="+" aria-label="+" disabled={disabled} onClick={addLeister}>
              +
            </button>
            <button type="button" className="btn btn--ghost" title="−" aria-label="−" disabled={disabled} onClick={removeLeister}>
              −
            </button>
          </div>
        </div>
      </div>
      <div className="bl-group">
        <div className="bl-sub">{t('paramSlidersLabel')}</div>
        <NumberField
          id="bl-slidersTemp"
          label={t('paramSliders')}
          value={params.slidersTemp}
          disabled={disabled}
          onChange={(v) => setParam('slidersTemp', v)}
        />
      </div>
    </Collapsible>
  )
}

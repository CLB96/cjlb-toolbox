import { useShallow } from 'zustand/react/shallow'
import { Button } from '../../../ui/Button'
import { GlassPanel } from '../../../ui/GlassPanel'
import { useGapcheck, useGapcheckApi } from '../GapcheckStoreProvider'
import { useGapcheckT, STATIC_TEXTS, type GapcheckKey } from '../i18n'
import type { CoveringType, TargetInputs } from '../logic/types'
import { selectLiveTarget, type GapcheckStore } from '../store'

interface FieldDef {
  id: string
  key: keyof TargetInputs
  label: GapcheckKey
  step: string
  max?: string
}

/** ids, min, max y step del original (inventario §6). Hard y Soft son independientes. */
const FIELDS: Record<CoveringType, FieldDef[]> = {
  hard: [
    { id: 'skinThickness', key: 'skin', label: 'skinThicknessLabel', step: '0.1' },
    { id: 'compressionPct', key: 'pct', label: 'compressionLabel', step: '1', max: '100' },
  ],
  soft: [
    { id: 'skinThicknessSoft', key: 'skinSoft', label: 'skinThicknessLabel', step: '0.1' },
    { id: 'foamThickness', key: 'foam', label: 'foamThicknessLabel', step: '0.1' },
    { id: 'compressionPctSoft', key: 'pctSoft', label: 'compressionLabel', step: '1', max: '100' },
  ],
}

const liveTexts = (s: GapcheckStore) => {
  const r = selectLiveTarget(s)
  return { valueText: r.valueText, text: r.formula.text, result: r.formula.result }
}

/** Valores objetivo: resultado en vivo al escribir; el resto se recalcula con el botón (R1). */
export function TargetPanel({ disabled }: { disabled: boolean }) {
  const t = useGapcheckT()
  const api = useGapcheckApi()
  const covering = useGapcheck((s) => s.covering)
  const inputs = useGapcheck((s) => s.inputs)
  const live = useGapcheck(useShallow(liveTexts))
  const { setCovering, setInput, applyComparison } = api.getState()

  return (
    <GlassPanel as="section" className="gc-card gc-target" aria-labelledby="gc-target-title">
      <h2 id="gc-target-title" className="gc-card__title">
        <span aria-hidden="true">🎯</span> {t('targets')}
      </h2>
      <div className="gc-sub" id="gc-covering-type">
        {STATIC_TEXTS.coveringType}
      </div>
      <div className="gc-seg" role="group" aria-labelledby="gc-covering-type">
        {(['hard', 'soft'] as const).map((c) => (
          <button
            key={c}
            type="button"
            className={`gc-seg__btn${covering === c ? ' gc-seg__btn--on' : ''}`}
            aria-pressed={covering === c}
            disabled={disabled}
            onClick={() => setCovering(c)}
          >
            {STATIC_TEXTS[c]}
          </button>
        ))}
      </div>
      <div className="gc-fields">
        {FIELDS[covering].map((f) => (
          <div className="gc-field" key={f.id}>
            <label htmlFor={f.id}>{t(f.label)}</label>
            <div className="gc-field__box">
              <input
                id={f.id}
                type="number"
                className="gc-input"
                min="0"
                max={f.max}
                step={f.step}
                value={inputs[f.key]}
                disabled={disabled}
                onChange={(e) => setInput(f.key, e.target.value)}
              />
              {f.max && <span className="gc-field__suffix">{STATIC_TEXTS.pct}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="gc-result">
        <span className="gc-result__eyebrow">{STATIC_TEXTS.eyebrow}</span>
        <span className="gc-result__num">
          <span data-testid="gapcheckValue">{live.valueText}</span> <small>{STATIC_TEXTS.mm}</small>
        </span>
        <span className="gc-result__formula" data-testid="gapcheckFormula">
          {live.text}
          <strong>{live.result}</strong>
        </span>
      </div>
      <Button onClick={applyComparison} disabled={disabled}>
        <span aria-hidden="true">🔄</span> {t('updateBtn')}
      </Button>
    </GlassPanel>
  )
}

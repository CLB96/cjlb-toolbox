import { useI18n } from '../../../i18n/useI18n'
import { GlassPanel } from '../../../ui/GlassPanel'
import { toast } from '../../../ui/toastStore'
import { useBondline, useBondlineApi } from '../BondlineStoreProvider'
import { STATIC_TEXTS, translate, useBondlineT } from '../i18n'
import { hasDecimals, type TimeRangeError } from '../logic/range'
import type { Lang } from '../logic/types'
import { selectActiveSheet } from '../store'

/** Alerts de applyTimeRange del original (inventario §6), ahora como toast. */
export function timeRangeErrorText(error: TimeRangeError, totalRows: number, lang: Lang): string {
  if (error === 'startNegative') return translate(lang, 'timeStartNegative')
  if (error === 'endNotAfterStart') return translate(lang, 'timeEndNotAfterStart')
  return translate(lang, 'timeEndExceeds', totalRows)
}

/** Rango Temporal: inputs step 1 min 0; ✓ aplica y ↻ restaura (títulos fijos en ES del original). */
export function TimeRange({ disabled }: { disabled: boolean }) {
  const { lang } = useI18n()
  const api = useBondlineApi()
  const inputs = useBondline((s) => s.config.timeRangeInputs)
  const { setTimeRangeInput, applyTimeRange, resetTimeRange } = api.getState()
  const t = useBondlineT()

  const onApply = () => {
    const error = applyTimeRange()
    const data = selectActiveSheet(api.getState())
    if (error && data) toast('error', timeRangeErrorText(error, data.totalRows, lang))
    else if (!error && (hasDecimals(inputs.start) || hasDecimals(inputs.end))) toast('warn', t('timeDecimals'))
  }

  return (
    <GlassPanel as="section" className="bl-card" aria-labelledby="bl-range-title">
      <h2 id="bl-range-title" className="bl-card__title">
        {t('timeRangeTitle')}
      </h2>
      <p className="bl-muted">{t('timeRangeSubtitle')}</p>
      <div className="bl-row2">
        <div className="bl-field">
          <label htmlFor="timeRangeStart">{t('timeRangeStart')}</label>
          <input
            id="timeRangeStart"
            type="number"
            step="1"
            min="0"
            className="bl-input"
            placeholder="0"
            value={inputs.start}
            disabled={disabled}
            onChange={(e) => setTimeRangeInput('start', e.target.value)}
          />
        </div>
        <div className="bl-field">
          <label htmlFor="timeRangeEnd">{t('timeRangeEnd')}</label>
          <input
            id="timeRangeEnd"
            type="number"
            step="1"
            min="0"
            className="bl-input"
            placeholder={STATIC_TEXTS.auto}
            value={inputs.end}
            disabled={disabled}
            onChange={(e) => setTimeRangeInput('end', e.target.value)}
          />
        </div>
      </div>
      <div className="bl-range__actions">
        <button
          type="button"
          className="btn btn--primary bl-range__apply"
          title={STATIC_TEXTS.applyRange}
          aria-label={STATIC_TEXTS.applyRange}
          disabled={disabled}
          onClick={onApply}
        >
          ✓
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          title={STATIC_TEXTS.resetRange}
          aria-label={STATIC_TEXTS.resetRange}
          disabled={disabled}
          onClick={resetTimeRange}
        >
          ↻
        </button>
      </div>
    </GlassPanel>
  )
}

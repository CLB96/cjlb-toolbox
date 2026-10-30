import { useBondlineT } from '../i18n'
import type { CoolingCheck } from '../logic/cooling'
import type { ActivationResult } from '../logic/results'

interface Props {
  result: ActivationResult
  cooling: CoolingCheck
  coolingTarget: number
}

/** #activationResult y #coolingResult (inventario §4B, §4C): mismo contenido que el original. */
export function ResultBoxes({ result, cooling, coolingTarget }: Props) {
  const t = useBondlineT()
  const cooled = cooling.achievedAt !== null
  return (
    <div className="bl-results">
      <div
        className={`bl-result bl-result--${result.variant}`}
        data-testid="activationResult"
        role="status"
      >
        <div className="result-title">{t(result.titleKey)}</div>
        {t(result.bodyKey, ...result.args)}
      </div>
      {cooling.show && (
        <div
          className={`bl-result bl-result--${cooled ? 'pass' : 'fail'}`}
          data-testid="coolingResult"
          role="status"
        >
          <div className="result-title">{t(cooled ? 'coolingResultTitle' : 'coolingResultFailTitle')}</div>
          {cooled
            ? t('coolingResult', cooling.elapsed as number, coolingTarget)
            : t('coolingResultFail', coolingTarget)}
        </div>
      )}
    </div>
  )
}

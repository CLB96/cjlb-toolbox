import type { AdhesiveCfg } from './activation'
import { ACTIVATION_DURATION } from './types'

export interface ActivationResult {
  variant: 'pass' | 'fail'
  titleKey: 'resultPassTitle' | 'resultFailTitle' | 'resultOutTitle'
  bodyKey: 'resultPass' | 'resultFail' | 'resultOut'
  args: (number | string)[]
}

/** El tiempo mostrado es relativo al inicio del rango (puede ser negativo). */
export function activationResult(
  activationStart: number | null,
  allInRange: boolean,
  effectiveStart: number,
  cfg: AdhesiveCfg,
): ActivationResult {
  if (activationStart === null) {
    return { variant: 'fail', titleKey: 'resultFailTitle', bodyKey: 'resultFail', args: [cfg.min, cfg.label] }
  }
  const shown = activationStart - effectiveStart
  if (allInRange) {
    return {
      variant: 'pass',
      titleKey: 'resultPassTitle',
      bodyKey: 'resultPass',
      args: [cfg.min, shown, ACTIVATION_DURATION, cfg.max],
    }
  }
  return {
    variant: 'fail',
    titleKey: 'resultOutTitle',
    bodyKey: 'resultOut',
    args: [shown, ACTIVATION_DURATION, cfg.min, cfg.max],
  }
}

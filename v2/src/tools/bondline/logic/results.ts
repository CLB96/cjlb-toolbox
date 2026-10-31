import type { AdhesiveCfg } from './activation'
import { ACTIVATION_DURATION } from './types'

export interface ActivationResult {
  variant: 'pass' | 'fail'
  titleKey: 'resultPassTitle' | 'resultFailTitle' | 'resultOutTitle' | 'resultIncompleteTitle'
  bodyKey: 'resultPass' | 'resultFail' | 'resultOut' | 'resultIncomplete'
  args: (number | string)[]
}

/** El tiempo mostrado es relativo al inicio del rango activo. */
export function activationResult(
  activationStart: number | null,
  allInRange: boolean,
  effectiveStart: number,
  cfg: AdhesiveCfg,
  /** false si la ventana de 30 s pasa del final de los datos visibles (A9). */
  windowComplete = true,
): ActivationResult {
  if (activationStart === null) {
    return { variant: 'fail', titleKey: 'resultFailTitle', bodyKey: 'resultFail', args: [cfg.min, cfg.label] }
  }
  const shown = activationStart - effectiveStart
  if (!windowComplete) {
    return {
      variant: 'fail',
      titleKey: 'resultIncompleteTitle',
      bodyKey: 'resultIncomplete',
      args: [shown, ACTIVATION_DURATION],
    }
  }
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

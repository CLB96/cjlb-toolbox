import type { CoveringType, TargetInputs } from './types'

export interface TargetResult {
  target: number
  valueText: string
  /** `text` va antes del <strong>; `result` es su contenido. */
  formula: { text: string; result: string }
}

export function computeTarget(covering: CoveringType, inputs: TargetInputs): TargetResult {
  let target: number
  let text: string
  if (covering === 'hard') {
    const skin = parseFloat(inputs.skin) || 0
    const pct = parseFloat(inputs.pct) || 0
    const factor = 1 - pct / 100
    target = skin * factor
    text = `Skin × (1 - ${pct}%)  →  ${skin} × ${factor.toFixed(2)} = `
  } else {
    const skin = parseFloat(inputs.skinSoft) || 0
    const foam = parseFloat(inputs.foam) || 0
    const pct = parseFloat(inputs.pctSoft) || 0
    const factor = 1 - pct / 100
    target = skin + foam * factor
    text = `Skin + Foam × (1 - ${pct}%)  →  ${skin} + ${foam} × ${factor.toFixed(2)} = `
  }
  return {
    target,
    valueText: target.toFixed(2),
    formula: { text, result: `${target.toFixed(2)} mm` },
  }
}

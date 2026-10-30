export type CoveringType = 'hard' | 'soft'

export interface GapPoint {
  name: string
  values: number[]
}

/** Entradas del objetivo, como strings (igual que los inputs del original). */
export interface TargetInputs {
  skin: string
  pct: string
  skinSoft: string
  foam: string
  pctSoft: string
}

export const DEFAULT_TARGET_INPUTS: TargetInputs = {
  skin: '10',
  pct: '50',
  skinSoft: '10',
  foam: '50',
  pctSoft: '50',
}

export interface KpiTexts {
  totalRecords: string
  avg: string
  min: string
  max: string
  meeting: string
}

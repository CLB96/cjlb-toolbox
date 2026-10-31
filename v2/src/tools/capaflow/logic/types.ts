export type Lang = 'es' | 'en'

export interface AdTest {
  stat: number
  p: number
}

/** Result of one capability analysis (same fields as the legacy `renderResults` argument). */
export interface AnalysisResult {
  data: number[]
  xBar: number
  sOverall: number
  sWithin: number
  N: number
  minV: number
  maxV: number
  med: number
  range: number
  Cp: number | null
  Cpk: number | null
  Cpu: number | null
  Cpl: number | null
  Pp: number | null
  Ppk: number | null
  Ppu: number | null
  Ppl: number | null
  Cpm: number | null
  sigLvl: number | null
  ppm: number | null
  ppmOverall: number | null
  adTest: AdTest
  isNormal: boolean
  /** Significance level used for the normality conclusion and the Q-Q band (1 - confidence/100). */
  alpha: number
  lsl: number
  usl: number
  targetVal: number
  hasLSL: boolean
  hasUSL: boolean
  hasBoth: boolean
  subgroupSize: number
  pointName: string
}

export interface AnalysisInput {
  raw: string
  lsl: string
  usl: string
  target: string
  subgroupSize: string
  pointName: string
  /** Confidence (%) of the form; empty or absent means 95. */
  confidence?: string
}

export type AnalysisErrorCode = 'minData' | 'noLimit' | 'badLimits' | 'infinite' | 'noVariation'
export type AnalysisWarning = 'subgroupClamped' | 'confidenceInvalid'
export type AnalysisOutcome =
  | { ok: true; result: AnalysisResult; warnings: AnalysisWarning[] }
  | { ok: false; error: AnalysisErrorCode }

export type CCType = 'imr' | 'xr' | 'xs'
export type CCTypeChoice = CCType | 'auto'

export interface ControlChart {
  topPts: number[]
  topCL: number
  topUCL: number
  topLCL: number
  topSigma: number
  topLabel: string
  topViol: number[]
  topOOC: number
  botPts: (number | null)[]
  botCL: number
  botUCL: number
  botLCL: number
  botSigma: number
  botLabel: string
  botViol: number[]
  botOOC: number
}

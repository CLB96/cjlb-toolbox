// Representative inputs for the CapaFlow differential tests (field strings, as typed in the original form).
import { SAMPLE_DATA, SAMPLE_LSL, SAMPLE_SUBGROUP, SAMPLE_TARGET, SAMPLE_USL } from './legacyReference'

export interface FixtureInput {
  raw: string
  lsl: string
  usl: string
  target: string
  subgroupSize: string
  pointName: string
}

/** Deterministic pseudo-random numbers (LCG) so fixtures never change. */
function lcg(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function series(count: number, seed: number, center: number, spread: number): string {
  const rnd = lcg(seed)
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push((center + (rnd() - 0.5) * spread).toFixed(3))
  return out.join(' ')
}

/** Skewed series with a few extreme values: non normal, with box-plot outliers and Western Electric hits. */
function skewed(): string {
  const rnd = lcg(7)
  const out: string[] = []
  for (let i = 0; i < 60; i++) out.push((10 - Math.log(1 - rnd()) * 0.4).toFixed(3))
  out.push('16.5', '17.2')
  return out.join('\n')
}

const base = { lsl: SAMPLE_LSL, usl: SAMPLE_USL, target: SAMPLE_TARGET, subgroupSize: SAMPLE_SUBGROUP, pointName: '' }

export const FIXTURES: Record<string, FixtureInput> = {
  sample: { ...base, raw: SAMPLE_DATA },
  sampleNamed: { ...base, raw: SAMPLE_DATA, pointName: '  Punto A  ' },
  smallN: { ...base, raw: '74.01 73.99 74.02 74.00 73.98 74.01', subgroupSize: '2' },
  notMultiple: { ...base, raw: SAMPLE_DATA.split(',').slice(0, 53).join(','), subgroupSize: '5' },
  individuals: { ...base, subgroupSize: '1', raw: SAMPLE_DATA },
  subgroup10: { ...base, subgroupSize: '10', raw: SAMPLE_DATA },
  subgroup12: { ...base, subgroupSize: '12', raw: SAMPLE_DATA },
  subgroupTooBig: { ...base, subgroupSize: '6', raw: '74.01 73.99 74.02 74.00 73.98' },
  onlyUSL: { ...base, lsl: '', raw: SAMPLE_DATA },
  onlyLSL: { ...base, usl: '', raw: SAMPLE_DATA },
  noTarget: { ...base, target: '', raw: SAMPLE_DATA },
  outOfSpec: { ...base, lsl: '9.9', usl: '10.1', target: '10', subgroupSize: '4', raw: series(80, 11, 10.04, 0.3) },
  offCenter: { ...base, lsl: '9.5', usl: '12', target: '10.75', subgroupSize: '5', raw: series(75, 5, 10.0, 0.6) },
  nonNormal: { ...base, lsl: '9', usl: '18', target: '12', subgroupSize: '3', raw: skewed() },
  constant: { ...base, lsl: '9', usl: '11', target: '10', subgroupSize: '5', raw: '10 10 10 10 10 10 10 10 10 10' },
  mixedSeparators: { ...base, subgroupSize: 'abc', raw: '74.01;74.02,74.00\n74.03\t73.99 xx 74.01 74.00' },
}

export const FIXTURE_NAMES = Object.keys(FIXTURES)

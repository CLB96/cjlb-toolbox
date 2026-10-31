import type { AdTest } from './types'
import { mean, normCDF, stddev } from './stats'

/** Anderson-Darling normality test (adjusted statistic and p-value, clamped to 0..1). */
export function andersonDarlingTest(data: number[]): AdTest {
  const n = data.length
  const sorted = [...data].sort((a, b) => a - b)
  const m = mean(sorted)
  const s = stddev(sorted)
  let A2 = 0
  for (let i = 0; i < n; i++) {
    const z1 = normCDF((sorted[i] - m) / s)
    const z2 = normCDF((sorted[n - 1 - i] - m) / s)
    A2 += (2 * (i + 1) - 1) * (Math.log(Math.max(z1, 1e-10)) + Math.log(Math.max(1 - z2, 1e-10)))
  }
  A2 = -n - A2 / n
  const A2adj = A2 * (1 + 4 / n - 25 / n ** 2)
  let pv: number
  if (A2adj >= 0.6) pv = Math.exp(1.2937 - 5.709 * A2adj + 0.0186 * A2adj ** 2)
  else if (A2adj >= 0.34) pv = Math.exp(0.9177 - 4.279 * A2adj - 1.38 * A2adj ** 2)
  else if (A2adj >= 0.2) pv = 1 - Math.exp(-8.318 + 42.796 * A2adj - 59.938 * A2adj ** 2)
  else pv = 1 - Math.exp(-13.436 + 101.14 * A2adj - 223.73 * A2adj ** 2)
  return { stat: A2adj, p: Math.min(1, Math.max(0, pv)) }
}

export interface SpcConstants {
  A2: number
  D3: number
  D4: number
  A3: number
  B3: number
  B4: number
  c4: number
  d2: number
}

/** Tabulated sizes 2..10, 15, 20, 25; the rest is interpolated. */
export const SPC_CONSTANTS: Record<number, SpcConstants> = {
  2: { A2: 1.880, D3: 0, D4: 3.267, A3: 2.659, B3: 0, B4: 3.267, c4: 0.7979, d2: 1.128 },
  3: { A2: 1.023, D3: 0, D4: 2.574, A3: 1.954, B3: 0, B4: 2.568, c4: 0.8862, d2: 1.693 },
  4: { A2: 0.729, D3: 0, D4: 2.282, A3: 1.628, B3: 0, B4: 2.266, c4: 0.9213, d2: 2.059 },
  5: { A2: 0.577, D3: 0, D4: 2.114, A3: 1.427, B3: 0, B4: 2.089, c4: 0.9400, d2: 2.326 },
  6: { A2: 0.483, D3: 0, D4: 2.004, A3: 1.287, B3: 0.030, B4: 1.970, c4: 0.9515, d2: 2.534 },
  7: { A2: 0.419, D3: 0.076, D4: 1.924, A3: 1.182, B3: 0.118, B4: 1.882, c4: 0.9594, d2: 2.704 },
  8: { A2: 0.373, D3: 0.136, D4: 1.864, A3: 1.099, B3: 0.185, B4: 1.815, c4: 0.9650, d2: 2.847 },
  9: { A2: 0.337, D3: 0.184, D4: 1.816, A3: 1.032, B3: 0.239, B4: 1.761, c4: 0.9693, d2: 2.970 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777, A3: 0.975, B3: 0.284, B4: 1.716, c4: 0.9727, d2: 3.078 },
  15: { A2: 0.223, D3: 0.347, D4: 1.653, A3: 0.789, B3: 0.428, B4: 1.572, c4: 0.9823, d2: 3.472 },
  20: { A2: 0.180, D3: 0.415, D4: 1.585, A3: 0.680, B3: 0.510, B4: 1.490, c4: 0.9869, d2: 3.735 },
  25: { A2: 0.153, D3: 0.459, D4: 1.541, A3: 0.606, B3: 0.565, B4: 1.435, c4: 0.9896, d2: 3.931 },
}

export function getSPCConstants(n: number): SpcConstants {
  if (SPC_CONSTANTS[n]) return SPC_CONSTANTS[n]
  const keys = Object.keys(SPC_CONSTANTS).map(Number).sort((a, b) => a - b)
  for (let i = 0; i < keys.length - 1; i++) {
    if (n > keys[i] && n < keys[i + 1]) {
      const lo = SPC_CONSTANTS[keys[i]]
      const hi = SPC_CONSTANTS[keys[i + 1]]
      const f = (n - keys[i]) / (keys[i + 1] - keys[i])
      const lerp = (a: number, b: number) => a + (b - a) * f
      return {
        A2: lerp(lo.A2, hi.A2), D3: lerp(lo.D3, hi.D3), D4: lerp(lo.D4, hi.D4),
        A3: lerp(lo.A3, hi.A3), B3: lerp(lo.B3, hi.B3), B4: lerp(lo.B4, hi.B4),
        c4: lerp(lo.c4, hi.c4), d2: lerp(lo.d2, hi.d2),
      }
    }
  }
  return SPC_CONSTANTS[25]
}

/** Western Electric rule 1: values beyond the limits (values, not indices). */
export function westernRule1(pts: number[], ucl: number, lcl: number): number[] {
  return pts.filter((p) => p > ucl || p < lcl)
}

/** All Western Electric violations (sorted unique indices): >3 sigma, 2 of 3 >2 sigma, 6 trending, 8 same side. */
export function weViolations(pts: number[], cl: number, sigma: number): number[] {
  const viol = new Set<number>()
  const n = pts.length
  pts.forEach((p, i) => {
    if (Math.abs(p - cl) > 3 * sigma) viol.add(i)
  })
  for (let i = 2; i < n; i++) {
    const w = [pts[i], pts[i - 1], pts[i - 2]]
    const abv = w.filter((v) => v > cl + 2 * sigma).length
    const blw = w.filter((v) => v < cl - 2 * sigma).length
    if (abv >= 2 || blw >= 2) {
      viol.add(i)
      if (abv >= 2) {
        if (pts[i - 1] > cl + 2 * sigma) viol.add(i - 1)
        if (pts[i - 2] > cl + 2 * sigma) viol.add(i - 2)
      }
      if (blw >= 2) {
        if (pts[i - 1] < cl - 2 * sigma) viol.add(i - 1)
        if (pts[i - 2] < cl - 2 * sigma) viol.add(i - 2)
      }
    }
  }
  for (let i = 5; i < n; i++) {
    let up = true
    let dn = true
    for (let j = i - 4; j <= i; j++) {
      if (pts[j] <= pts[j - 1]) up = false
      if (pts[j] >= pts[j - 1]) dn = false
    }
    if (up || dn) for (let j = i - 5; j <= i; j++) viol.add(j)
  }
  for (let i = 7; i < n; i++) {
    const seg = pts.slice(i - 7, i + 1)
    if (seg.every((v) => v > cl) || seg.every((v) => v < cl)) for (let j = i - 7; j <= i; j++) viol.add(j)
  }
  return [...viol].sort((a, b) => a - b)
}

/** Subgroups from a flat array; the partial last group is dropped. */
export function makeSubgroups(data: number[], n: number): number[][] {
  if (n <= 1) return data.map((v) => [v])
  const groups: number[][] = []
  for (let i = 0; i < data.length; i += n) {
    const g = data.slice(i, i + n)
    if (g.length === n) groups.push(g)
  }
  return groups
}

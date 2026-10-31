/** Splits on whitespace, comma and semicolon; keeps whatever parseFloat accepts (legacy behavior). */
export function parseData(raw: string): number[] {
  return raw.split(/[\s,;\n\t]+/).map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v))
}

export function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function stddev(arr: number[], pop = false): number {
  const m = mean(arr)
  const sq = arr.map((v) => (v - m) ** 2)
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / (pop ? arr.length : arr.length - 1))
}

export function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Linear-interpolation percentile (same method as R default / Minitab). */
export function quartile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base]
}

const D2_MAP: Record<number, number> = {
  1: 1, 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078,
  11: 3.173, 12: 3.258, 13: 3.336, 14: 3.407, 15: 3.472, 16: 3.532, 17: 3.588, 18: 3.640, 19: 3.689,
  20: 3.735, 21: 3.778, 22: 3.819, 23: 3.858, 24: 3.895, 25: 3.931,
}

/** Within sigma: mean moving range / 1.128 for n=1, otherwise mean subgroup range / d2 (partial last group dropped). */
export function withinSigma(data: number[], n: number): number {
  if (n === 1) {
    const mr: number[] = []
    for (let i = 1; i < data.length; i++) mr.push(Math.abs(data[i] - data[i - 1]))
    return mean(mr) / 1.128
  }
  const d2 = D2_MAP[n] || 2.326
  const groups: number[][] = []
  for (let i = 0; i < data.length; i += n) {
    const group = data.slice(i, i + n)
    if (group.length === n) groups.push(group)
  }
  const ranges = groups.map((g) => Math.max(...g) - Math.min(...g))
  return mean(ranges) / d2
}

export function normCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)
  const t2 = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t2 + a4) * t2 + a3) * t2 + a2) * t2 + a1) * t2 * Math.exp(-x * x))
  return 0.5 * (1 + sign * y)
}

export function normPDF(x: number, mu: number, sigma: number): number {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
}

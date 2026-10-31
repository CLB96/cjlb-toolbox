/** Main numeric formatter: em dash for null/NaN (Infinity is printed, as in the original). */
export const fmt = (v: number | null | undefined, d = 3): string =>
  v !== null && v !== undefined && !isNaN(v) ? Number(v).toFixed(d) : '—'

/** Integer formatter (host locale grouping, like the original). */
export const fmtN = (v: number | null): string => (v !== null && !isNaN(v) ? Math.round(v).toLocaleString() : '—')

/** Fill width (%) of the sigma bar. */
export const sigmaBarWidth = (sigLvl: number | null): number => (sigLvl !== null ? Math.min(100, (sigLvl / 6) * 100) : 0)

export type GapStatus = 'met' | 'warning' | 'notMet'

export function statusOf(value: number, target: number): GapStatus {
  const tolerance = target * 0.1
  if (value <= target) return 'met'
  if (value <= target + tolerance) return 'warning'
  return 'notMet'
}

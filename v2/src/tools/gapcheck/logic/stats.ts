import type { GapPoint, KpiTexts } from './types'

const emptyKpis = (): KpiTexts => ({ totalRecords: '0', avg: '0', min: '0', max: '0', meeting: '0 / 0' })

export function computeStats(
  points: readonly GapPoint[],
  visiblePoints: ReadonlySet<number>,
  visibleIters: ReadonlySet<number>,
  target: number,
): KpiTexts {
  const values: number[] = []
  points.forEach((p, i) => {
    if (!visiblePoints.has(i)) return
    p.values.forEach((v, iterIdx) => {
      if (visibleIters.has(iterIdx) && v !== undefined && v !== null) values.push(v)
    })
  })

  if (values.length === 0) return emptyKpis()
  // bucle en vez de Math.min(...values): el spread revienta la pila con cientos de miles de valores
  let sum = 0
  let min = values[0]
  let max = values[0]
  let meetingCount = 0
  for (const v of values) {
    sum += v
    if (v < min) min = v
    if (v > max) max = v
    if (v <= target) meetingCount++
  }
  const avg = sum / values.length
  return {
    totalRecords: String(visiblePoints.size),
    avg: avg.toFixed(2),
    min: String(min),
    max: String(max),
    meeting: `${meetingCount} / ${values.length}`,
  }
}

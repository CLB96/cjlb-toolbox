import type { GapPoint, KpiTexts } from './types'

const EMPTY_KPIS: KpiTexts = { totalRecords: '0', avg: '0', min: '0', max: '0', meeting: '0 / 0' }

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

  if (values.length === 0) return EMPTY_KPIS
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const meetingCount = values.filter((v) => v <= target).length
  return {
    totalRecords: String(visiblePoints.size),
    avg: avg.toFixed(2),
    min: String(Math.min(...values)),
    max: String(Math.max(...values)),
    meeting: `${meetingCount} / ${values.length}`,
  }
}

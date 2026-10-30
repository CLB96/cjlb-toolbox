import type { GapPoint } from './types'

export const PALETTE_SOLID: readonly string[] = [
  '#4f8cff', '#8b5cf6', '#43b36b', '#f59e0b', '#ef5b67',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#0ea5e9', '#d97706', '#10b981',
]

export const POINT_COLORS: readonly string[] = [
  '#4f8cff', '#ef5b67', '#43b36b', '#8b5cf6', '#f59e0b',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#0ea5e9', '#d97706', '#10b981',
]

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export interface PointStyle {
  style: 'circle' | 'crossRot'
  radius: number
  hoverRadius: number
  borderWidth: number
}

export function pointStyle(y: number, target: number): PointStyle {
  const met = y <= target
  return {
    style: met ? 'circle' : 'crossRot',
    radius: met ? 7 : 9,
    hoverRadius: met ? 10 : 12,
    borderWidth: met ? 1.5 : 3,
  }
}

export function iterDataset(
  points: readonly GapPoint[],
  visiblePoints: ReadonlySet<number>,
  iterIdx: number,
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  points.forEach((p, i) => {
    if (!visiblePoints.has(i)) return
    const val = p.values[iterIdx] as number | undefined | null
    if (val !== undefined && val !== null) out.push({ x: i + 1, y: val })
  })
  return out
}

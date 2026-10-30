import { isToolId, type ToolId } from '../app/routes'
import type { SessionDoc } from './usageService'

export type HoursByTool = Partial<Record<ToolId, number>>

export interface UserUsage {
  email: string
  name: string
  totalHours: number
  lastSeen: number
  byTool: HoursByTool
}

export interface UsageSummary {
  users: UserUsage[]
  byTool: HoursByTool
}

const toHours = (seconds: number): number => Math.round((seconds / 3600) * 10) / 10

type Acc = { name: string; seen: number; total: number; byTool: Partial<Record<ToolId, number>> }

export function aggregateUsage(sessions: SessionDoc[]): UsageSummary {
  const perUser = new Map<string, Acc>()
  const toolSeconds: Partial<Record<ToolId, number>> = {}

  for (const s of sessions) {
    const key = s.email.toLowerCase()
    const prev = perUser.get(key) ?? { name: s.name, seen: 0, total: 0, byTool: {} }
    const byTool = { ...prev.byTool }
    if (isToolId(s.tool)) {
      byTool[s.tool] = (byTool[s.tool] ?? 0) + s.activeSeconds
      toolSeconds[s.tool] = (toolSeconds[s.tool] ?? 0) + s.activeSeconds
    }
    perUser.set(key, {
      name: s.lastBeat >= prev.seen ? s.name : prev.name,
      seen: Math.max(prev.seen, s.lastBeat),
      total: prev.total + s.activeSeconds,
      byTool,
    })
  }

  const hours = (m: Partial<Record<ToolId, number>>): HoursByTool =>
    Object.fromEntries(Object.entries(m).map(([k, v]) => [k, toHours(v)]))

  const users = [...perUser.entries()]
    .map(([email, a]) => ({
      email,
      name: a.name,
      totalHours: toHours(a.total),
      lastSeen: a.seen,
      byTool: hours(a.byTool),
    }))
    .sort((a, b) => b.totalHours - a.totalHours)

  return { users, byTool: hours(toolSeconds) }
}

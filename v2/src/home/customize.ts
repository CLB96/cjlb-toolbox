import type { ToolDef } from '../tools/types'

export type Badge = ToolDef['badge']
/** Insignias guardadas por el admin; una herramienta sin entrada usa la de tools.json. */
export type BadgeOverrides = Readonly<Record<string, Badge>>

/** Devuelve la insignia si es válida; `undefined` si el valor no sirve. */
export function parseBadge(value: unknown): Badge | undefined {
  if (value === null || value === 'new' || value === 'updated') return value
  return undefined
}

export function applyBadges(tools: readonly ToolDef[], overrides: BadgeOverrides): ToolDef[] {
  return tools.map((tool) =>
    Object.prototype.hasOwnProperty.call(overrides, tool.id)
      ? { ...tool, badge: overrides[tool.id] ?? null }
      : tool,
  )
}

/** Aplica el orden guardado: descarta ids que ya no existen y agrega al final las herramientas nuevas. */
export function applyOrder(tools: readonly ToolDef[], saved: unknown): ToolDef[] {
  if (!Array.isArray(saved)) return [...tools]
  const byId = new Map(tools.map((t) => [t.id as string, t]))
  const seen = new Set<string>()
  const ordered: ToolDef[] = []
  for (const id of saved) {
    if (typeof id !== 'string' || seen.has(id)) continue
    const tool = byId.get(id)
    if (!tool) continue
    seen.add(id)
    ordered.push(tool)
  }
  return [...ordered, ...tools.filter((t) => !seen.has(t.id))]
}

export function moveBy(order: readonly string[], id: string, delta: number): string[] {
  const from = order.indexOf(id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= order.length) return [...order]
  const next = order.filter((x) => x !== id)
  next.splice(to, 0, id)
  return next
}

/** Suelta `dragId` en el lugar de `targetId`, como al arrastrar una tarjeta sobre otra. */
export function dropBefore(order: readonly string[], dragId: string, targetId: string): string[] {
  const from = order.indexOf(dragId)
  const to = order.indexOf(targetId)
  if (from < 0 || to < 0 || from === to) return [...order]
  return moveBy(order, dragId, to - from)
}

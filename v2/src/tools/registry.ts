import data from '../data/tools.json'
import { isToolId, type Route, type ToolId } from '../app/routes'
import type { ToolDef } from './types'

const loadPlaceholder = () => import('./Placeholder')

export const TOOLS: ToolDef[] = data.tools
  .filter((t) => isToolId(t.id))
  .map((t) => ({
    id: t.id as ToolId,
    icon: t.icon,
    nameEs: t.nameEs,
    nameEn: t.nameEn,
    descEs: t.descEs,
    descEn: t.descEn,
    badge: t.badge as ToolDef['badge'],
    status: t.status as ToolDef['status'],
    holdLabelEs: t.holdLabelEs,
    holdLabelEn: t.holdLabelEn,
    url: t.url,
    load: loadPlaceholder,
  }))

export function getTool(id: ToolId): ToolDef {
  const tool = TOOLS.find((t) => t.id === id)
  if (!tool) throw new Error(`Herramienta desconocida: ${id}`)
  return tool
}

/** Una ruta a una herramienta en espera (o inexistente) se resuelve a 'home'. */
export function resolveRoute(route: Route, tools: ToolDef[] = TOOLS): Route {
  if (route === 'home' || route === 'usage') return route
  const tool = tools.find((t) => t.id === route)
  return tool && tool.status === 'active' ? route : 'home'
}

export type ToolId = 'gantt' | 'gapcheck' | 'bondline' | 'capaflow' | 'vectorizr'
export type Route = 'home' | 'usage' | ToolId

export const TOOL_IDS: readonly ToolId[] = ['gantt', 'gapcheck', 'bondline', 'capaflow', 'vectorizr']

const ROUTES: readonly Route[] = ['home', 'usage', ...TOOL_IDS]

export function isToolId(v: string): v is ToolId {
  return (TOOL_IDS as readonly string[]).includes(v)
}

export function parseHash(hash: string): Route {
  const id = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  return (ROUTES as readonly string[]).includes(id) ? (id as Route) : 'home'
}

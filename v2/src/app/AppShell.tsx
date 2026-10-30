import { useCallback, useEffect, type ReactNode } from 'react'
import { Starfield } from '../theme/Starfield'
import { ToastHost } from '../ui/Toast'
import { resolveRoute, TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/types'
import { useRoute } from './useRoute'
import { TopBar } from './TopBar'
import { ToolHost } from './ToolHost'
import type { Route, ToolId } from './routes'
import { flushTool } from '../persistence/flushRegistry'

type Props = {
  isAdmin?: boolean
  avatar?: ReactNode
  tools?: ToolDef[]
  onToolSwitch?: (from: ToolId | null, to: Route) => void
}

export function AppShell({ isAdmin = false, avatar, tools = TOOLS, onToolSwitch }: Props) {
  const { route: requested, navigate } = useRoute()
  const allowed = requested === 'usage' && !isAdmin ? 'home' : requested
  const route = resolveRoute(allowed, tools)

  const handleSwitch = useCallback(
    (from: ToolId | null, to: Route) => {
      if (from) void flushTool(from)
      onToolSwitch?.(from, to)
    },
    [onToolSwitch],
  )

  useEffect(() => {
    if (route !== requested) navigate(route)
  }, [route, requested, navigate])

  return (
    <>
      <Starfield />
      <TopBar route={route} onNavigate={navigate} isAdmin={isAdmin} avatar={avatar} tools={tools} />
      <ToolHost route={route} tools={tools} isAdmin={isAdmin} onToolSwitch={handleSwitch} />
      <ToastHost />
    </>
  )
}

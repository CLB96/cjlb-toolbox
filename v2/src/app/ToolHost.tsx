import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { isToolId, type Route, type ToolId } from './routes'
import { TOOLS } from '../tools/registry'
import type { ToolDef, ToolProps } from '../tools/types'
import { GlassPanel } from '../ui/GlassPanel'
import { useI18n } from '../i18n/useI18n'
import { HomePage } from '../home/HomePage'

type Props = {
  route: Route
  tools?: ToolDef[]
  onToolSwitch?: (from: ToolId | null, to: Route) => void
}

function StaticPanel({ titleKey }: { titleKey: 'shell.tab.usage' }) {
  const { t } = useI18n()
  return (
    <GlassPanel as="section">
      <h2>{t(titleKey)}</h2>
      <p>{t('shell.migrating')}</p>
    </GlassPanel>
  )
}

export function ToolHost({ route, tools = TOOLS, onToolSwitch }: Props) {
  const { t } = useI18n()
  const [visited, setVisited] = useState<ReadonlySet<ToolId>>(new Set())
  const previous = useRef<Route | null>(null)
  const lazyTools = useMemo(
    () => new Map<ToolId, ComponentType<ToolProps>>(tools.map((d) => [d.id, lazy(d.load)])),
    [tools],
  )

  useEffect(() => {
    if (isToolId(route)) {
      setVisited((prev) => (prev.has(route) ? prev : new Set(prev).add(route)))
    }
    const from = previous.current
    if (from !== null && from !== route) {
      onToolSwitch?.(isToolId(from) ? from : null, route)
    }
    previous.current = route
  }, [route, onToolSwitch])

  return (
    <main className="tool-host">
      <div role="tabpanel" aria-labelledby="tab-home" hidden={route !== 'home'}>
        {route === 'home' && <HomePage />}
      </div>
      <div role="tabpanel" aria-labelledby="tab-usage" hidden={route !== 'usage'}>
        {route === 'usage' && <StaticPanel titleKey="shell.tab.usage" />}
      </div>
      {tools.map((def) => {
        const Tool = lazyTools.get(def.id)
        const mounted = visited.has(def.id) || route === def.id
        if (!Tool || !mounted) return null
        return (
          <div
            key={def.id}
            role="tabpanel"
            aria-labelledby={`tab-${def.id}`}
            hidden={route !== def.id}
          >
            <Suspense fallback={<p>{t('shell.loading')}</p>}>
              <Tool toolId={def.id} active={route === def.id} />
            </Suspense>
          </div>
        )
      })}
    </main>
  )
}

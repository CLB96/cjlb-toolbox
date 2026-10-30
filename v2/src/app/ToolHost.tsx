import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { isToolId, type Route, type ToolId } from './routes'
import { TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/types'
import { useI18n } from '../i18n/useI18n'
import { HomePage } from '../home/HomePage'
import { ToolErrorBoundary } from './ToolErrorBoundary'

type Props = {
  route: Route
  tools?: ToolDef[]
  isAdmin?: boolean
  onToolSwitch?: (from: ToolId | null, to: Route) => void
}

const UsagePage = lazy(() => import('../usage/UsagePage').then((m) => ({ default: m.UsagePage })))

/**
 * Una herramienta con su propia frontera de error. "Reintentar" crea un nuevo `lazy` (React
 * cachea un import rechazado) y remonta solo esta herramienta.
 */
function ToolSlot({ def, active }: { def: ToolDef; active: boolean }) {
  const { t } = useI18n()
  const [attempt, setAttempt] = useState(0)
  // attempt fuerza un lazy nuevo al reintentar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Tool = useMemo(() => lazy(def.load), [def.load, attempt])
  return (
    <ToolErrorBoundary
      key={attempt}
      message={t('shell.toolError')}
      retryLabel={t('shell.retry')}
      onRetry={() => setAttempt((a) => a + 1)}
    >
      <Suspense fallback={<p>{t('shell.loading')}</p>}>
        <Tool toolId={def.id} active={active} />
      </Suspense>
    </ToolErrorBoundary>
  )
}

export function ToolHost({ route, tools = TOOLS, isAdmin = false, onToolSwitch }: Props) {
  const { t } = useI18n()
  const [visited, setVisited] = useState<ReadonlySet<ToolId>>(new Set())
  const previous = useRef<Route | null>(null)

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
        {route === 'usage' && isAdmin && (
          <Suspense fallback={<p>{t('shell.loading')}</p>}>
            <UsagePage />
          </Suspense>
        )}
      </div>
      {tools.map((def) => {
        const mounted = visited.has(def.id) || route === def.id
        if (!mounted) return null
        return (
          <div
            key={def.id}
            role="tabpanel"
            aria-labelledby={`tab-${def.id}`}
            hidden={route !== def.id}
          >
            <ToolSlot def={def} active={route === def.id} />
          </div>
        )
      })}
    </main>
  )
}

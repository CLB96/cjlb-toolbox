import { useCallback, useSyncExternalStore } from 'react'
import { parseHash, type Route } from './routes'

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

function getSnapshot(): Route {
  return parseHash(window.location.hash)
}

export function useRoute(): { route: Route; navigate: (r: Route) => void } {
  const route = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const navigate = useCallback((r: Route) => {
    window.location.hash = '#/' + r
  }, [])
  return { route, navigate }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ButtonStatus } from './Button'

/** Cuánto se ve la palomita antes de volver al reposo. */
export const SUCCESS_MS = 1400

/**
 * Estado "cargando → listo → reposo" para botones que lanzan trabajo. `run(key, fn)` ejecuta `fn`; el botón cuya
 * `key` coincide usa `statusOf(key)`. Si `fn` falla, vuelve al reposo y el error se propaga. Solo corre una a la vez.
 */
export function useActionStatus() {
  const [state, setState] = useState<{ key: string | null; status: ButtonStatus }>({ key: null, status: 'idle' })
  const mounted = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const running = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])

  const run = useCallback(async <T,>(key: string, fn: () => Promise<T>): Promise<T | undefined> => {
    if (running.current) return undefined
    running.current = true
    clearTimeout(timer.current)
    setState({ key, status: 'loading' })
    try {
      const result = await fn()
      if (mounted.current) {
        setState({ key, status: 'success' })
        timer.current = setTimeout(() => {
          if (mounted.current) setState({ key: null, status: 'idle' })
        }, SUCCESS_MS)
      }
      return result
    } catch (e) {
      if (mounted.current) setState({ key: null, status: 'idle' })
      throw e
    } finally {
      running.current = false
    }
  }, [])

  /** Vuelve al reposo ya (por ejemplo al cerrar el diálogo donde está el botón). */
  const reset = useCallback(() => {
    clearTimeout(timer.current)
    if (mounted.current) setState({ key: null, status: 'idle' })
  }, [])

  const statusOf = useCallback((key: string): ButtonStatus => (state.key === key ? state.status : 'idle'), [state])

  return { run, reset, statusOf, busy: state.status !== 'idle' }
}

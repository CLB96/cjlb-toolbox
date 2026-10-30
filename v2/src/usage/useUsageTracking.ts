import { useCallback, useEffect, useRef } from 'react'
import type { AppUser } from '../auth/authService'
import { useRoute } from '../app/useRoute'
import { toast } from '../ui/toastStore'
import { useI18n } from '../i18n/useI18n'
import { createActivityTracker } from './activity'
import { beat, recordLogin, startSession } from './usageService'

export const BEAT_INTERVAL_MS = 60_000
export const IDLE_MS = 300_000
/** Sin red las escrituras de Firestore no resuelven: se avisa a los 15 s y se sigue esperando. */
export const SLOW_WRITE_MS = 15_000
const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'wheel'] as const

type Timers = { open: boolean; set: Set<ReturnType<typeof setTimeout>> }
const newTimers = (): Timers => ({ open: true, set: new Set() })
function closeTimers(t: Timers): void {
  t.open = false
  t.set.forEach(clearTimeout)
  t.set.clear()
}

/** Avisa si p tarda más de SLOW_WRITE_MS; devuelve p intacta. Al cerrar `timers` ya no avisa. */
function watchSlow<T>(p: Promise<T>, onSlow: () => void, timers: Timers): Promise<T> {
  if (!timers.open) return p
  const timer = setTimeout(() => {
    timers.set.delete(timer)
    onSlow()
  }, SLOW_WRITE_MS)
  timers.set.add(timer)
  const clear = () => {
    clearTimeout(timer)
    timers.set.delete(timer)
  }
  p.then(clear, clear)
  return p
}

/** Registra login y sesiones de uso (una por herramienta/ruta). Solo para usuarios permitidos. */
export function useUsageTracking(user: AppUser): void {
  const { route } = useRoute()
  const { t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const userRef = useRef(user)
  userRef.current = user
  const uid = user.uid
  /** Un solo aviso por sesión, compartido por login, apertura y beats. */
  const warnedRef = useRef(false)
  const warnOnce = useCallback(() => {
    if (warnedRef.current) return
    warnedRef.current = true
    toast('warn', tRef.current('usage.trackFailed'))
  }, [])

  useEffect(() => {
    const timers = newTimers()
    watchSlow(recordLogin(userRef.current), warnOnce, timers).catch(warnOnce)
    return () => closeTimers(timers)
  }, [uid, warnOnce])

  useEffect(() => {
    const tracker = createActivityTracker({ idleMs: IDLE_MS, now: Date.now })
    const timers = newTimers()
    warnedRef.current = false
    let pending = 0
    const sessionP = watchSlow(startSession(userRef.current, route), warnOnce, timers).catch(() => {
      warnOnce()
      return null
    })

    const flush = async (visible: boolean) => {
      const total = pending + tracker.collect(visible)
      const id = await sessionP
      if (!id) return
      try {
        await watchSlow(beat(id, total), warnOnce, timers)
        pending = 0
      } catch {
        pending = total
        warnOnce()
      }
    }

    const onInteraction = () => tracker.recordInteraction()
    const onVisibility = () => {
      // Al ocultarse se cierra el tramo visible; al mostrarse se descarta el oculto.
      void flush(document.visibilityState === 'hidden')
    }
    INTERACTION_EVENTS.forEach((e) => document.addEventListener(e, onInteraction, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    const timer = setInterval(() => void flush(document.visibilityState === 'visible'), BEAT_INTERVAL_MS)

    return () => {
      clearInterval(timer)
      closeTimers(timers)
      INTERACTION_EVENTS.forEach((e) => document.removeEventListener(e, onInteraction))
      document.removeEventListener('visibilitychange', onVisibility)
      void flush(true)
    }
  }, [uid, route, warnOnce])
}

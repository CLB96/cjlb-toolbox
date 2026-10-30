export interface ActivityTracker {
  recordInteraction(): void
  /** Segundos activos desde la última llamada. */
  collect(visible: boolean): number
}

/**
 * Cuenta solo el tramo en que hubo una interacción reciente (menos de idleMs),
 * nunca más que el tiempo real transcurrido. Un hueco largo sin interacción
 * (suspensión, reloj saltado) aporta como máximo idleMs.
 */
export function createActivityTracker(opts: { idleMs: number; now: () => number }): ActivityTracker {
  const { idleMs, now } = opts
  let lastCollect = now()
  let lastInteraction = lastCollect

  return {
    recordInteraction() {
      lastInteraction = now()
    },
    collect(visible: boolean): number {
      const current = now()
      const from = lastCollect
      lastCollect = current
      if (!visible) return 0
      const end = Math.min(current, lastInteraction + idleMs)
      return Math.max(0, Math.floor((end - from) / 1000))
    },
  }
}

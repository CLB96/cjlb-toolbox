import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { loadPreference, savePreference } from '../persistence/preferences'
import type { ToolDef } from '../tools/types'
import { toast } from '../ui/toastStore'
import { applyOrder, dropBefore, moveBy } from './customize'

export const ORDER_KEY = 'homeOrder'

export interface HomeOrder {
  ordered: ToolDef[]
  move: (id: string, delta: number) => void
  drop: (dragId: string, targetId: string) => void
  reset: () => void
}

/** Orden de tarjetas del inicio, guardado por usuario en este equipo (IndexedDB). */
export function useHomeOrder(uid: string, tools: readonly ToolDef[]): HomeOrder {
  const { t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const [saved, setSaved] = useState<unknown>(undefined)
  const touched = useRef(false)

  useEffect(() => {
    let cancelled = false
    touched.current = false
    setSaved(undefined)
    loadPreference<unknown>(uid, ORDER_KEY)
      .then((value) => {
        if (!cancelled && !touched.current) setSaved(value)
      })
      // sin lectura se muestra el orden de tools.json; no hay nada que avisar
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [uid])

  const ordered = useMemo(() => applyOrder(tools, saved), [tools, saved])

  const commit = useCallback(
    (next: string[] | null) => {
      touched.current = true
      setSaved(next)
      savePreference(uid, ORDER_KEY, next).catch(() =>
        toast('error', tRef.current('home.customize.orderSaveFailed')),
      )
    },
    [uid],
  )

  const ids = ordered.map((tool) => tool.id as string)
  return {
    ordered,
    move: (id, delta) => commit(moveBy(ids, id, delta)),
    drop: (dragId, targetId) => commit(dropBefore(ids, dragId, targetId)),
    reset: () => commit(null),
  }
}

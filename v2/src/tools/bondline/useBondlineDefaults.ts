import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { loadPreference, savePreference } from '../../persistence/preferences'
import { useUid } from '../../persistence/uidContext'
import { toast } from '../../ui/toastStore'
import { normalizeDefaults, parseDefaultsForm, type DefaultsForm } from './logic/defaults'
import type { BondlineDefaults } from './logic/types'

export const BONDLINE_DEFAULTS_KEY = 'bondline.defaults'

export interface BondlineDefaultsApi {
  defaults: BondlineDefaults
  loaded: boolean
  /** Resuelven true si se guardó; false si falló (ya se avisó con un toast). */
  save(form: DefaultsForm): Promise<boolean>
  resetToFactory(): Promise<boolean>
}

export function useBondlineDefaults(): BondlineDefaultsApi {
  const uid = useUid()
  const { t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const uidRef = useRef(uid)
  uidRef.current = uid
  const writesRef = useRef(0)
  const [state, setState] = useState<{ uid: string; defaults: BondlineDefaults } | null>(null)

  useEffect(() => {
    let cancelled = false
    const writesAtStart = writesRef.current
    loadPreference<unknown>(uid, BONDLINE_DEFAULTS_KEY)
      .then((raw) => normalizeDefaults(raw))
      .catch(() => {
        toast('error', tRef.current('prefs.loadFailed'))
        return normalizeDefaults(undefined)
      })
      .then((defaults) => {
        if (!cancelled && writesRef.current === writesAtStart) setState({ uid, defaults })
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  const persist = useCallback(
    async (next: BondlineDefaults): Promise<boolean> => {
      try {
        await savePreference(uid, BONDLINE_DEFAULTS_KEY, next)
        if (uidRef.current === uid) {
          writesRef.current += 1
          setState({ uid, defaults: next })
        }
        return true
      } catch {
        toast('error', tRef.current('prefs.saveFailed'))
        return false
      }
    },
    [uid],
  )

  const save = useCallback((form: DefaultsForm) => persist(parseDefaultsForm(form)), [persist])
  const resetToFactory = useCallback(() => persist(normalizeDefaults(undefined)), [persist])

  const ready = state !== null && state.uid === uid
  return {
    defaults: ready ? state.defaults : normalizeDefaults(undefined),
    loaded: ready,
    save,
    resetToFactory,
  }
}


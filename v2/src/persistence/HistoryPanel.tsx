import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import type { ToolId } from '../app/routes'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'
import { toast } from '../ui/toastStore'
import { listSnapshots, type SnapshotMeta } from './snapshotStore'
import { useUid } from './uidContext'

interface Props {
  toolId: ToolId
  /** Se llama con el id de la versión elegida (ver `restoreVersion` de usePersistentTool). */
  onRestore: (id: string) => void | Promise<void>
  /** `lastSavedAt` de usePersistentTool: al cambiar se vuelve a leer la lista. */
  lastSavedAt?: number | null
}

export function HistoryPanel({ toolId, onRestore, lastSavedAt = null }: Props) {
  const uid = useUid()
  const { t, lang } = useI18n()
  const [items, setItems] = useState<SnapshotMeta[]>([])

  useEffect(() => {
    let active = true
    listSnapshots(uid, toolId).then(
      (list) => active && setItems(list),
      () => {
        if (!active) return
        setItems([])
        toast('error', t('persist.historyLoadFailed'))
      },
    )
    return () => {
      active = false
    }
    // t cambia con el idioma; la lista no depende de él
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, toolId, lastSavedAt])

  const restore = async (id: string) => {
    try {
      await onRestore(id)
    } catch {
      toast('error', t('persist.restoreFailed'))
    }
  }

  const fmt = new Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'medium' })
  return (
    <GlassPanel as="section" aria-label={t('persist.history')}>
      <h3>{t('persist.history')}</h3>
      {items.length === 0 ? (
        <p>{t('persist.historyEmpty')}</p>
      ) : (
        <ul>
          {items.map((m) => (
            <li key={m.id}>
              <time dateTime={new Date(m.savedAt).toISOString()}>{fmt.format(m.savedAt)}</time>
              <Button variant="ghost" onClick={() => void restore(m.id)}>
                {t('persist.restore')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { toast } from '../ui/toastStore'
import { useI18n } from '../i18n/useI18n'
import { approveRequest, listPendingRequests, rejectRequest, type AccessRequest } from './accessService'

type Props = { adminEmail: string }

/** Sección "Solicitudes de acceso" (se monta en UsagePage, Task 10). */
export function AccessRequestsPanel({ adminEmail }: Props) {
  const { t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const [items, setItems] = useState<AccessRequest[] | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await listPendingRequests())
    } catch {
      toast('error', tRef.current('access.loadFailed'))
      setItems((prev) => prev ?? [])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function act(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch {
      toast('error', t('access.actionFailed'))
    } finally {
      setBusy(false)
    }
    await load()
  }

  return (
    <section aria-labelledby="access-requests-title">
      <h2 id="access-requests-title">{t('access.panel.title')}</h2>
      {items !== null && items.length === 0 && <p>{t('access.panel.empty')}</p>}
      <ul>
        {(items ?? []).map((r) => (
          <li key={r.email}>
            <strong>{r.name}</strong> <span>{r.email}</span>
            {r.reason && <p>{r.reason}</p>}
            <Button disabled={busy} onClick={() => void act(() => approveRequest(r.email, adminEmail))}>
              {t('access.approve')}
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => void act(() => rejectRequest(r.email))}>
              {t('access.reject')}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

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
    <section className="access-panel" aria-labelledby="access-requests-title">
      <h2 id="access-requests-title">{t('access.panel.title')}</h2>
      {items !== null && items.length === 0 && <p className="access-panel__empty">{t('access.panel.empty')}</p>}
      <ul className="access-panel__list">
        {(items ?? []).map((r) => (
          <li key={r.email} className="access-panel__item">
            <div className="access-panel__who">
              <strong>{r.name}</strong>
              <span className="access-panel__email">{r.email}</span>
            </div>
            <div className="access-panel__actions">
              <Button disabled={busy} onClick={() => void act(() => approveRequest(r.email, adminEmail))}>
                {t('access.approve')}
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => void act(() => rejectRequest(r.email))}>
                {t('access.reject')}
              </Button>
            </div>
            {r.reason && <p className="access-panel__reason">{r.reason}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

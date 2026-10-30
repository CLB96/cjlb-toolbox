import { useEffect, useState } from 'react'
import { Starfield } from '../theme/Starfield'
import { GlassPanel } from '../ui/GlassPanel'
import { Button } from '../ui/Button'
import { toast } from '../ui/toastStore'
import { useI18n } from '../i18n/useI18n'
import { getMyRequest, type AccessRequest } from '../access/accessService'
import { RequestAccessForm } from '../access/RequestAccessForm'

type Props = { email: string; uid: string; displayName: string | null; onSignOut: () => void }

export function DeniedScreen({ email, uid, displayName, onSignOut }: Props) {
  const { t } = useI18n()
  // undefined = cargando; null = sin solicitud previa
  const [request, setRequest] = useState<AccessRequest | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    getMyRequest(email)
      .then((r) => !cancelled && setRequest(r))
      .catch(() => {
        if (cancelled) return
        toast('error', t('access.loadFailed'))
        setRequest(null)
      })
    return () => {
      cancelled = true
    }
    // t cambia con el idioma; la consulta no debe repetirse
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const statusText =
    request?.status === 'pending'
      ? t('access.sentPending')
      : request?.status === 'rejected'
        ? t('access.rejected')
        : request?.status === 'approved'
          ? t('access.approved')
          : null

  return (
    <>
      <Starfield />
      <main className="auth-screen">
        <GlassPanel className="auth-card">
          <h1 className="auth-card__title">{t('auth.denied.title')}</h1>
          <p>{t('auth.denied.body')}</p>
          <p className="auth-card__muted">{email}</p>
          {statusText && <p role="status">{statusText}</p>}
          {request === null && (
            <RequestAccessForm email={email} uid={uid} defaultName={displayName ?? ''} />
          )}
          <Button variant="ghost" onClick={onSignOut}>
            {t('auth.signOut')}
          </Button>
        </GlassPanel>
      </main>
    </>
  )
}

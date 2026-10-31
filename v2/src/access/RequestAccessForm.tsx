import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { toast } from '../ui/toastStore'
import { useI18n } from '../i18n/useI18n'
import { submitAccessRequest, type SubmitResult } from './accessService'
import { LIMITS } from './limits'


type Props = {
  /** Con cuenta: correo fijo (solo lectura). */
  email?: string
  uid?: string
  defaultName?: string
  onBack?: () => void
  /** Con cuenta: se llama al quedar la solicitud pendiente. */
  onSent?: () => void
}

export function RequestAccessForm({ email: fixedEmail, uid, defaultName = '', onBack, onSent }: Props) {
  const { t } = useI18n()
  const [email, setEmail] = useState(fixedEmail ?? '')
  const [name, setName] = useState(defaultName)
  const [reason, setReason] = useState('')
  const [trap, setTrap] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  // Se bloquea solo tras enviar en esta vista; las reglas impiden duplicar solicitudes pendientes.
  const [locked, setLocked] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await submitAccessRequest({ email, name, reason, uid, honeypot: trap })
    setBusy(false)
    if (r === 'error') {
      toast('error', t('access.error'))
      return
    }
    setResult(r)
    setLocked(true)
    if (r === 'sent') onSent?.()
  }

  // Sin cuenta, todos los resultados muestran el mismo texto para no revelar si el correo ya solicitó.
  const signedIn = fixedEmail !== undefined
  const message =
    result === null
      ? null
      : signedIn && result === 'sent'
        ? t('access.sent')
        : signedIn
          ? t('access.pending')
          : t('access.pendingSignIn')

  return (
    <form className="auth-card__form" onSubmit={onSubmit}>
      <label>
        {t('auth.email')}
        <input
          type="email"
          required
          maxLength={LIMITS.email}
          value={email}
          readOnly={fixedEmail !== undefined}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        {t('access.name')}
        <input required maxLength={LIMITS.name} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        {t('access.reason')}
        <textarea maxLength={LIMITS.reason} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <input
        className="hp-field"
        name="hp_fax"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
      />
      {message && <p role="status">{message}</p>}
      <Button type="submit" disabled={busy || locked}>
        {t('access.submit')}
      </Button>
      {onBack && (
        <Button variant="ghost" onClick={onBack}>
          {t('access.back')}
        </Button>
      )}
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { useI18n, type MessageKey } from '../i18n/useI18n'
import { CreateUserFailure, createUserByAdmin, generatePassword, MIN_PASSWORD, type CreateUserError } from './createUser'

type Props = { adminEmail: string }

const ERRORS: Record<CreateUserError, MessageKey> = {
  invalid: 'access.create.invalid',
  exists: 'access.create.exists',
  weakPassword: 'access.create.weakPassword',
  accessFailed: 'access.create.accessFailed',
  failed: 'access.create.failed',
}

/** Sección «Crear usuario» del panel de admin (página de uso), debajo de las solicitudes de acceso. */
export function CreateUserPanel({ adminEmail }: Props) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState(generatePassword)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<CreateUserError | null>(null)
  // La contraseña solo vive en memoria y se muestra una vez; no se guarda en ningún sitio.
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const done = await createUserByAdmin({ email, name, password }, adminEmail)
      setCreated({ email: done, password })
      setEmail('')
      setName('')
      setPassword(generatePassword())
    } catch (failure) {
      setCreated(null)
      setError(failure instanceof CreateUserFailure ? failure.reason : 'failed')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.password)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="access-panel create-user" aria-labelledby="create-user-title">
      <h2 id="create-user-title">{t('access.create.title')}</h2>
      <p className="access-panel__empty">{t('access.create.intro')}</p>
      <form className="create-user__form" onSubmit={(e) => void submit(e)}>
        <label className="create-user__field">
          <span>{t('access.create.email')}</span>
          <input type="email" required autoComplete="off" value={email} disabled={busy} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="create-user__field">
          <span>{t('access.create.name')}</span>
          <input type="text" autoComplete="off" value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="create-user__row">
          <label className="create-user__field">
            <span>{t('access.create.password')}</span>
            <input type="text" required minLength={MIN_PASSWORD} autoComplete="new-password" spellCheck={false} value={password}
              disabled={busy} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <Button variant="ghost" disabled={busy} onClick={() => setPassword(generatePassword())}>{t('access.create.generate')}</Button>
        </div>
        <p className="access-panel__empty">{t('access.create.passwordHelp')}</p>
        <div className="create-user__actions">
          <Button type="submit" disabled={busy}>{t('access.create.submit')}</Button>
        </div>
      </form>
      {error && <p className="create-user__error" role="alert">{t(ERRORS[error])}</p>}
      {created && (
        <div className="create-user__done" role="status">
          <strong>{t('access.create.done', { email: created.email })}</strong>
          <p className="access-panel__empty">{t('access.create.oneTime')}</p>
          <div className="create-user__row">
            <code className="create-user__password">{created.password}</code>
            <Button variant="ghost" onClick={() => void copy()}>{t(copied ? 'access.create.copied' : 'access.create.copy')}</Button>
          </div>
          <p className="access-panel__empty">{t('access.create.doneHelp')}</p>
        </div>
      )}
    </section>
  )
}

import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { useI18n, type MessageKey } from '../i18n/useI18n'
import { MIN_PASSWORD } from '../access/limits'
import { authService } from './authService'

type Props = { open: boolean; onClose: () => void }

const codeOf = (e: unknown) => (typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '')

/** Cambio de contraseña desde el menú de usuario: pide la actual y la nueva dos veces. */
export function ChangePasswordDialog({ open, onClose }: Props) {
  const { t } = useI18n()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ key: MessageKey; ok: boolean } | null>(null)

  function close() {
    setCurrent('')
    setNext('')
    setRepeat('')
    setMessage(null)
    onClose()
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (next.length < MIN_PASSWORD) return setMessage({ key: 'access.create.weakPassword', ok: false })
    if (next !== repeat) return setMessage({ key: 'auth.password.mismatch', ok: false })
    setBusy(true)
    try {
      await authService.changePassword(current, next)
      setCurrent('')
      setNext('')
      setRepeat('')
      setMessage({ key: 'auth.password.done', ok: true })
    } catch (failure) {
      const code = codeOf(failure)
      const wrong = code === 'auth/wrong-password' || code === 'auth/invalid-credential'
      setMessage({ key: wrong ? 'auth.password.wrong' : code === 'auth/weak-password' ? 'access.create.weakPassword' : 'auth.password.failed', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={close} title={t('auth.changePassword')}>
      <form className="change-password" onSubmit={(e) => void submit(e)}>
        <label className="create-user__field">
          <span>{t('auth.password.current')}</span>
          <input type="password" required autoComplete="current-password" value={current} disabled={busy} onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <label className="create-user__field">
          <span>{t('auth.password.new')}</span>
          <input type="password" required autoComplete="new-password" value={next} disabled={busy} onChange={(e) => setNext(e.target.value)} />
        </label>
        <label className="create-user__field">
          <span>{t('auth.password.repeat')}</span>
          <input type="password" required autoComplete="new-password" value={repeat} disabled={busy} onChange={(e) => setRepeat(e.target.value)} />
        </label>
        <p className="access-panel__empty">{t('auth.password.help')}</p>
        {message && (
          <p className={message.ok ? 'change-password__ok' : 'create-user__error'} role={message.ok ? 'status' : 'alert'}>{t(message.key)}</p>
        )}
        <div className="create-user__actions">
          <Button variant="ghost" onClick={close}>{t('auth.password.cancel')}</Button>
          <Button type="submit" disabled={busy}>{t('auth.password.save')}</Button>
        </div>
      </form>
    </Dialog>
  )
}

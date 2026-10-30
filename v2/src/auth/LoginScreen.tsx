import { useState, type FormEvent } from 'react'
import { Starfield } from '../theme/Starfield'
import { GlassPanel } from '../ui/GlassPanel'
import { Button } from '../ui/Button'
import { useI18n, type MessageKey } from '../i18n/useI18n'
import { RequestAccessForm } from '../access/RequestAccessForm'
import { useTheme } from '../theme/useTheme'

type Props = {
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
}

export function LoginScreen({ signInWithGoogle, signInWithEmail }: Props) {
  const { t } = useI18n()
  const { resolved } = useTheme()
  const logoSrc = resolved === 'dark' ? '/logo-dark.png' : '/logo-light.png'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null)
  const [busy, setBusy] = useState(false)
  const [requesting, setRequesting] = useState(false)

  async function run(action: () => Promise<void>, failKey: MessageKey) {
    setBusy(true)
    setErrorKey(null)
    try {
      await action()
    } catch {
      // mensaje genérico a propósito: no se exponen códigos ni detalles de Firebase
      setErrorKey(failKey)
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void run(() => signInWithEmail(email, password), 'auth.invalidCredentials')
  }

  if (requesting) {
    return (
      <>
        <Starfield />
        <main className="auth-screen">
          <GlassPanel className="auth-card">
            <img className="auth-card__logo" src={logoSrc} alt="CJLB" height={40} />
            <h1 className="auth-card__title">{t('auth.title')}</h1>
            <RequestAccessForm onBack={() => setRequesting(false)} />
          </GlassPanel>
        </main>
      </>
    )
  }

  return (
    <>
      <Starfield />
      <main className="auth-screen">
        <GlassPanel className="auth-card">
          <img className="auth-card__logo" src={logoSrc} alt="CJLB" height={40} />
          <h1 className="auth-card__title">{t('auth.title')}</h1>
          <Button disabled={busy} onClick={() => void run(signInWithGoogle, 'auth.googleFailed')}>
            {t('auth.google')}
          </Button>
          <p className="auth-card__sep">{t('auth.or')}</p>
          <form className="auth-card__form" onSubmit={onSubmit}>
            <label>
              {t('auth.email')}
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              {t('auth.password')}
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {errorKey && (
              <p role="alert" className="auth-card__error">
                {t(errorKey)}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {t('auth.submit')}
            </Button>
          </form>
          <Button variant="ghost" onClick={() => setRequesting(true)}>
            {t('access.link')}
          </Button>
        </GlassPanel>
      </main>
    </>
  )
}

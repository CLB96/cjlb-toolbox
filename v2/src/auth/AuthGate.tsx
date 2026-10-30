import { AppShell } from '../app/AppShell'
import { UidProvider } from '../persistence/uidContext'
import { Starfield } from '../theme/Starfield'
import { GlassPanel } from '../ui/GlassPanel'
import { Button } from '../ui/Button'
import { ToastHost } from '../ui/Toast'
import { useI18n } from '../i18n/useI18n'
import { useAuth } from './useAuth'
import { LoginScreen } from './LoginScreen'
import { DeniedScreen } from './DeniedScreen'
import { VerifyScreen } from './VerifyScreen'
import { UserMenu } from './UserMenu'

/** loading → LoginScreen → VerifyScreen → DeniedScreen → AppShell (o reintento si falla la comprobación). */
export function AuthGate() {
  const { t } = useI18n()
  const auth = useAuth()
  const { status, user } = auth

  if (status === 'loading') return <Starfield />

  if (status === 'signedOut' || !user) {
    return (
      <>
        <LoginScreen signInWithGoogle={auth.signInWithGoogle} signInWithEmail={auth.signInWithEmail} />
        <ToastHost />
      </>
    )
  }

  const onSignOut = () => void auth.signOut()

  if (status === 'unverified') {
    return (
      <>
        <VerifyScreen
          email={user.email}
          sendVerification={auth.sendVerification}
          reloadUser={auth.reloadUser}
          onSignOut={onSignOut}
        />
        <ToastHost />
      </>
    )
  }

  if (status === 'denied') {
    return <DeniedScreen email={user.email} uid={user.uid} displayName={user.displayName} onSignOut={onSignOut} />
  }

  if (status === 'error') {
    return (
      <>
        <Starfield />
        <main className="auth-screen">
          <GlassPanel className="auth-card">
            <p>{t('auth.checkFailed')}</p>
            <Button onClick={() => void auth.retry()}>{t('auth.retry')}</Button>
            <Button variant="ghost" onClick={onSignOut}>
              {t('auth.signOut')}
            </Button>
          </GlassPanel>
        </main>
        <ToastHost />
      </>
    )
  }

  return (
    <UidProvider uid={user.uid}>
      <AppShell
        key={user.uid}
        isAdmin={auth.isAdmin}
        avatar={<UserMenu user={user} isAdmin={auth.isAdmin} onSignOut={onSignOut} />}
      />
    </UidProvider>
  )
}

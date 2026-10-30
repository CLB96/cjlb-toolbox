import { useMemo, type ReactNode } from 'react'
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
import { SessionProvider, type Session } from './session'
import { useUsageTracking } from '../usage/useUsageTracking'
import type { AppUser } from './authService'

type Auth = ReturnType<typeof useAuth>

/** Activa el registro de uso solo mientras el usuario está permitido. */
function UsageTracker({ user }: { user: AppUser }) {
  useUsageTracking(user)
  return null
}

function CheckFailed({ auth, onSignOut }: { auth: Auth; onSignOut: () => void }) {
  const { t } = useI18n()
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
    </>
  )
}

function renderBranch(auth: Auth, session: Session | null): ReactNode {
  const { status, user } = auth
  if (status === 'loading') return <Starfield />
  if (status === 'signedOut' || !user) {
    return <LoginScreen signInWithGoogle={auth.signInWithGoogle} signInWithEmail={auth.signInWithEmail} />
  }

  const onSignOut = () => void auth.signOut()
  if (status === 'unverified') {
    return (
      <VerifyScreen
        email={user.email}
        sendVerification={auth.sendVerification}
        reloadUser={auth.reloadUser}
        onSignOut={onSignOut}
      />
    )
  }
  if (status === 'denied') {
    return (
      <DeniedScreen
        email={user.email}
        uid={user.uid}
        displayName={user.displayName}
        onSignOut={onSignOut}
        onRecheck={auth.retry}
      />
    )
  }
  if (status === 'error' || !session) return <CheckFailed auth={auth} onSignOut={onSignOut} />

  return (
    <SessionProvider session={session}>
      <UidProvider uid={user.uid}>
        <UsageTracker user={user} />
        <AppShell
          key={user.uid}
          isAdmin={auth.isAdmin}
          avatar={<UserMenu user={user} isAdmin={auth.isAdmin} onSignOut={onSignOut} />}
        />
      </UidProvider>
    </SessionProvider>
  )
}

/**
 * loading → LoginScreen → VerifyScreen → DeniedScreen → AppShell (o reintento si falla la
 * comprobación). Un único ToastHost cubre todas las ramas.
 */
export function AuthGate() {
  const auth = useAuth()
  const { user, isAdmin } = auth
  const session = useMemo<Session | null>(() => (user ? { user, isAdmin } : null), [user, isAdmin])
  return (
    <>
      {renderBranch(auth, session)}
      <ToastHost />
    </>
  )
}

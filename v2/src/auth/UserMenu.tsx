import { lazy, Suspense, useState } from 'react'
import { Button } from '../ui/Button'
import { useI18n } from '../i18n/useI18n'
import { usePendingCount } from '../access/accessService'
import { greetingName } from './greeting'
import type { AppUser } from './authService'

// Se carga al abrirlo: el menú no arrastra Firebase Auth ni el diálogo si nadie cambia la contraseña.
const ChangePasswordDialog = lazy(() => import('./ChangePasswordDialog').then((m) => ({ default: m.ChangePasswordDialog })))

type Props = { user: AppUser; isAdmin?: boolean; onSignOut: () => void }

export function UserMenu({ user, isAdmin = false, onSignOut }: Props) {
  const { t } = useI18n()
  const pending = usePendingCount(isAdmin)
  const name = greetingName(user)
  const [changing, setChanging] = useState(false)
  return (
    <>
    <details className="user-menu">
      <summary aria-label={t('auth.userMenu')} className="user-menu__avatar">
        {name.charAt(0).toUpperCase()}
        {pending > 0 && (
          <span className="user-menu__badge" role="status" aria-label={t('access.pendingBadge', { n: pending })}>
            {pending}
          </span>
        )}
      </summary>
      <div className="glass user-menu__panel">
        <strong>{name}</strong>
        <span className="user-menu__email">{user.email}</span>
        {user.hasPassword && (
          <Button variant="ghost" onClick={() => setChanging(true)}>
            {t('auth.changePassword')}
          </Button>
        )}
        <Button variant="ghost" onClick={onSignOut}>
          {t('auth.signOut')}
        </Button>
      </div>
    </details>
    {changing && (
      <Suspense fallback={null}>
        <ChangePasswordDialog open onClose={() => setChanging(false)} />
      </Suspense>
    )}
    </>
  )
}

import { Button } from '../ui/Button'
import { useI18n } from '../i18n/useI18n'
import { greetingName } from './greeting'
import type { AppUser } from './authService'

type Props = { user: AppUser; onSignOut: () => void }

export function UserMenu({ user, onSignOut }: Props) {
  const { t } = useI18n()
  const name = greetingName(user)
  return (
    <details className="user-menu">
      <summary aria-label={t('auth.userMenu')} className="user-menu__avatar">
        {name.charAt(0).toUpperCase()}
      </summary>
      <div className="glass user-menu__panel">
        <strong>{name}</strong>
        <span className="user-menu__email">{user.email}</span>
        <Button variant="ghost" onClick={onSignOut}>
          {t('auth.signOut')}
        </Button>
      </div>
    </details>
  )
}

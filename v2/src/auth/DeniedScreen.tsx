import { Starfield } from '../theme/Starfield'
import { GlassPanel } from '../ui/GlassPanel'
import { Button } from '../ui/Button'
import { useI18n } from '../i18n/useI18n'

type Props = { email: string; onSignOut: () => void }

/** Task 8 añade aquí el formulario de solicitud de acceso. */
export function DeniedScreen({ email, onSignOut }: Props) {
  const { t } = useI18n()
  return (
    <>
      <Starfield />
      <main className="auth-screen">
        <GlassPanel className="auth-card">
          <h1 className="auth-card__title">{t('auth.denied.title')}</h1>
          <p>{t('auth.denied.body')}</p>
          <p className="auth-card__muted">{email}</p>
          <Button variant="ghost" onClick={onSignOut}>
            {t('auth.signOut')}
          </Button>
        </GlassPanel>
      </main>
    </>
  )
}

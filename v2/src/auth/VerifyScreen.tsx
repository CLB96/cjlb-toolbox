import { useEffect, useRef, useState } from 'react'
import { Starfield } from '../theme/Starfield'
import { GlassPanel } from '../ui/GlassPanel'
import { Button } from '../ui/Button'
import { toast } from '../ui/toastStore'
import { useI18n } from '../i18n/useI18n'

export const RESEND_COOLDOWN_MS = 60_000

type Props = {
  email: string
  sendVerification: () => Promise<void>
  reloadUser: () => Promise<void>
  onSignOut: () => void
}

export function VerifyScreen({ email, sendVerification, reloadUser, onSignOut }: Props) {
  const { t } = useI18n()
  const [coolingDown, setCoolingDown] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  async function onSend() {
    setCoolingDown(true)
    timer.current = setTimeout(() => setCoolingDown(false), RESEND_COOLDOWN_MS)
    try {
      await sendVerification()
      toast('ok', t('auth.verify.sent'))
    } catch {
      toast('error', t('auth.verify.sendFailed'))
    }
  }

  async function onReload() {
    try {
      await reloadUser()
    } catch {
      toast('error', t('auth.verify.reloadFailed'))
    }
  }

  return (
    <>
      <Starfield />
      <main className="auth-screen">
        <GlassPanel className="auth-card">
          <h1 className="auth-card__title">{t('auth.verify.title')}</h1>
          <p>{t('auth.verify.body', { email })}</p>
          <Button disabled={coolingDown} onClick={() => void onSend()}>
            {t('auth.verify.send')}
          </Button>
          <Button onClick={() => void onReload()}>{t('auth.verify.done')}</Button>
          <Button variant="ghost" onClick={onSignOut}>
            {t('auth.signOut')}
          </Button>
        </GlassPanel>
      </main>
    </>
  )
}

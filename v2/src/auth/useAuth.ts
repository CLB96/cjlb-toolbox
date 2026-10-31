import { useCallback, useEffect, useRef, useState } from 'react'
import { authService, type AppUser } from './authService'
import { toast } from '../ui/toastStore'
import { useI18n } from '../i18n/useI18n'

/**
 * 'unverified': correo/contraseña sin verificar (no se consulta la allowlist).
 * 'error': falló la consulta de allowlist (red/permisos); la UI ofrece reintentar.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'unverified' | 'denied' | 'allowed' | 'error'

type State = { status: AuthStatus; user: AppUser | null; isAdmin: boolean }

const INITIAL: State = { status: 'loading', user: null, isAdmin: false }

export function useAuth() {
  const { t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const [state, setState] = useState<State>(INITIAL)
  const lastUser = useRef<AppUser | null>(null)
  const token = useRef(0)

  const evaluate = useCallback(async (user: AppUser | null) => {
    const mine = ++token.current
    const stale = () => mine !== token.current
    lastUser.current = user
    if (!user) {
      setState({ status: 'signedOut', user: null, isAdmin: false })
      return
    }
    if (!user.emailVerified) {
      setState({ status: 'unverified', user, isAdmin: false })
      return
    }
    setState({ status: 'loading', user, isAdmin: false })
    let allowed: boolean
    try {
      allowed = await authService.isAllowed(user.email)
    } catch {
      if (stale()) return
      toast('error', tRef.current('auth.checkFailed'))
      setState({ status: 'error', user, isAdmin: false })
      return
    }
    if (stale()) return
    if (!allowed) {
      setState({ status: 'denied', user, isAdmin: false })
      return
    }
    let isAdmin = false
    try {
      const admin = await authService.fetchAdminEmail()
      isAdmin = admin !== null && admin.trim().toLowerCase() === user.email
    } catch {
      if (!stale()) toast('error', tRef.current('auth.adminCheckFailed'))
    }
    if (stale()) return
    setState({ status: 'allowed', user, isAdmin })
  }, [])

  useEffect(() => {
    const unsub = authService.onUser((u) => void evaluate(u))
    return () => {
      token.current++
      unsub()
    }
  }, [evaluate])

  const retry = useCallback(() => evaluate(lastUser.current), [evaluate])

  return {
    status: state.status,
    user: state.user,
    isAdmin: state.isAdmin,
    signInWithGoogle: authService.signInWithGoogle,
    signInWithEmail: authService.signInWithEmail,
    signUpWithEmail: authService.signUpWithEmail,
    signOut: authService.signOut,
    sendVerification: authService.sendVerification,
    reloadUser: authService.reloadUser,
    retry,
  }
}

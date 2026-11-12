import {
  EmailAuthProvider,
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updatePassword,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { normalizeEmail } from './email'

export interface AppUser {
  uid: string
  /** Ya normalizado (minúsculas, sin espacios). */
  email: string
  displayName: string | null
  emailVerified: boolean
  /** Entra con correo y contraseña (puede cambiarla); false para cuentas solo de Google. */
  hasPassword?: boolean
}

function toAppUser(u: User | null): AppUser | null {
  if (!u || !u.email) return null
  return {
    uid: u.uid,
    email: normalizeEmail(u.email),
    displayName: u.displayName,
    emailVerified: u.emailVerified,
    hasPassword: u.providerData.some((p) => p.providerId === 'password'),
  }
}

// onAuthStateChanged no se dispara al recargar el usuario: se notifica a mano.
const reloadListeners = new Set<(u: AppUser | null) => void>()

async function ensurePersistence(): Promise<void> {
  await setPersistence(auth, browserLocalPersistence)
}

export const authService = {
  async signInWithGoogle(): Promise<void> {
    await ensurePersistence()
    await signInWithPopup(auth, new GoogleAuthProvider())
  },

  async signInWithEmail(email: string, password: string): Promise<void> {
    await ensurePersistence()
    await signInWithEmailAndPassword(auth, normalizeEmail(email), password)
  },

  /** Alta con correo/contraseña; envía la verificación (las reglas exigen email_verified). */
  async signUpWithEmail(email: string, password: string): Promise<void> {
    await ensurePersistence()
    const cred = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password)
    await sendEmailVerification(cred.user)
  },

  async signOut(): Promise<void> {
    await fbSignOut(auth)
  },

  onUser(cb: (u: AppUser | null) => void): () => void {
    reloadListeners.add(cb)
    const unsub = onAuthStateChanged(auth, (u) => cb(toAppUser(u)))
    return () => {
      reloadListeners.delete(cb)
      unsub()
    }
  },

  async sendVerification(): Promise<void> {
    if (!auth.currentUser) throw new Error('no-user')
    await sendEmailVerification(auth.currentUser)
  },

  async reloadUser(): Promise<void> {
    const current = auth.currentUser
    if (!current) return
    await current.reload()
    // reload() refresca el estado de verificación; los tokens se renuevan para que
    // las reglas de Firestore vean email_verified actualizado.
    await current.getIdToken(true)
    const next = toAppUser(auth.currentUser)
    reloadListeners.forEach((l) => l(next))
  },

  async isAllowed(email: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'allowlist', normalizeEmail(email)))
    return snap.exists()
  },

  /**
   * ¿La creó el admin? Su entrada en la allowlist guarda este uid. Para otra cuenta sin
   * verificar las reglas niegan la lectura, y eso cuenta como «no».
   */
  async isAdminCreated(email: string, uid: string): Promise<boolean> {
    try {
      const snap = await getDoc(doc(db, 'allowlist', normalizeEmail(email)))
      return snap.exists() && snap.data().uid === uid
    } catch {
      return false
    }
  },

  /** Cambia la contraseña tras confirmar la actual (Firebase exige un inicio de sesión reciente). */
  async changePassword(current: string, next: string): Promise<void> {
    const user = auth.currentUser
    if (!user || !user.email) throw Object.assign(new Error('no-user'), { code: 'no-user' })
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current))
    await updatePassword(user, next)
  },

  async fetchAdminEmail(): Promise<string | null> {
    const snap = await getDoc(doc(db, 'config', 'app'))
    const v = snap.exists() ? snap.data().adminEmail : null
    return typeof v === 'string' ? v : null
  },
}

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
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
}

function toAppUser(u: User | null): AppUser | null {
  if (!u || !u.email) return null
  return {
    uid: u.uid,
    email: normalizeEmail(u.email),
    displayName: u.displayName,
    emailVerified: u.emailVerified,
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

  async fetchAdminEmail(): Promise<string | null> {
    const snap = await getDoc(doc(db, 'config', 'app'))
    const v = snap.exists() ? snap.data().adminEmail : null
    return typeof v === 'string' ? v : null
  },
}

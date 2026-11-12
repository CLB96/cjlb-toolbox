// Alta de usuarios por el admin para quien no recibe el correo de verificación.
// La cuenta se crea en una instancia secundaria de Firebase para no cerrar la sesión del admin,
// y su uid queda en allowlist/{correo}: las reglas solo aceptan sin verificar a ese uid.
import { deleteApp, initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { app, db } from '../auth/firebase'
import { normalizeEmail } from '../auth/email'
import { LIMITS, MIN_PASSWORD } from './limits'

export { MIN_PASSWORD }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Sin caracteres que se confunden al dictarlos (0/O, 1/l/I). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

export type CreateUserError = 'invalid' | 'exists' | 'weakPassword' | 'accessFailed' | 'failed'

export class CreateUserFailure extends Error {
  constructor(readonly reason: CreateUserError) {
    super(reason)
    this.name = 'CreateUserFailure'
  }
}

/** Contraseña aleatoria de 12 caracteres en tres grupos, p. ej. «Rq7k-T3mP-z9wX». */
export function generatePassword(random: (n: number) => Uint32Array = (n) => crypto.getRandomValues(new Uint32Array(n))): string {
  const chars: string[] = []
  // Rechazo de valores sesgados para que cada carácter sea igual de probable.
  const limit = Math.floor(0x100000000 / ALPHABET.length) * ALPHABET.length
  while (chars.length < 12) {
    for (const v of random(16)) {
      if (v < limit && chars.length < 12) chars.push(ALPHABET[v % ALPHABET.length]!)
    }
  }
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8)].map((g) => g.join('')).join('-')
}

export interface NewUser {
  email: string
  name?: string
  password: string
}

export function validateNewUser(input: NewUser): CreateUserError | null {
  const email = normalizeEmail(input.email)
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) return 'invalid'
  if ((input.name ?? '').trim().length > LIMITS.name) return 'invalid'
  if (input.password.length < MIN_PASSWORD) return 'weakPassword'
  return null
}

const codeOf = (e: unknown) => (typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '')

/** Crea la cuenta y le da acceso. Devuelve el correo normalizado; lanza CreateUserFailure. */
export async function createUserByAdmin(input: NewUser, adminEmail: string): Promise<string> {
  const invalid = validateNewUser(input)
  if (invalid) throw new CreateUserFailure(invalid)
  const email = normalizeEmail(input.email)
  const name = (input.name ?? '').trim()
  const secondary = initializeApp(app.options, `admin-create-${Date.now()}`)
  let uid: string
  try {
    const secondaryAuth = initializeAuth(secondary, { persistence: inMemoryPersistence })
    if (import.meta.env.VITE_USE_EMULATORS === 'true') {
      connectAuthEmulator(secondaryAuth, 'http://127.0.0.1:9099', { disableWarnings: true })
    }
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, input.password)
    uid = cred.user.uid
    if (name) await updateProfile(cred.user, { displayName: name })
    await signOut(secondaryAuth)
  } catch (e) {
    const code = codeOf(e)
    if (code === 'auth/email-already-in-use') throw new CreateUserFailure('exists')
    if (code === 'auth/invalid-email') throw new CreateUserFailure('invalid')
    if (code === 'auth/weak-password') throw new CreateUserFailure('weakPassword')
    throw new CreateUserFailure('failed')
  } finally {
    await deleteApp(secondary).catch(() => undefined)
  }
  try {
    await setDoc(doc(db, 'allowlist', email), { addedAt: serverTimestamp(), addedBy: normalizeEmail(adminEmail), uid })
  } catch {
    throw new CreateUserFailure('accessFailed')
  }
  return email
}

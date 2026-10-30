import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'
const EMULATOR_PROJECT = 'demo-cjlb-toolbox'
const env = import.meta.env

export const app: FirebaseApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY ?? (useEmulators ? 'demo-key' : undefined),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: useEmulators ? EMULATOR_PROJECT : env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

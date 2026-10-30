import { createContext, useContext, type ReactNode } from 'react'
import type { AppUser } from './authService'

/** Usuario ya permitido y su rol; lo provee AuthGate para que las páginas no vuelvan a llamar a useAuth. */
export interface Session {
  user: AppUser
  isAdmin: boolean
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ session, children }: { session: Session; children?: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}

/** null fuera de AuthGate (p. ej. en pruebas que renderizan el shell directamente). */
export function useSession(): Session | null {
  return useContext(SessionContext)
}

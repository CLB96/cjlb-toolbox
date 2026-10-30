import { createContext, useContext, type ReactNode } from 'react'

const UidContext = createContext<string>('local')

export function UidProvider({ uid, children }: { uid: string; children?: ReactNode }) {
  return <UidContext.Provider value={uid}>{children}</UidContext.Provider>
}

export function useUid(): string {
  return useContext(UidContext)
}

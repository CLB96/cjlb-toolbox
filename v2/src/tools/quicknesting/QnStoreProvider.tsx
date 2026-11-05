import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createQnStore, type QnApi, type QnStore } from './store'

const StoreContext = createContext<QnApi | null>(null)

/** Store propio por montaje: AppShell remonta con key={uid} al cambiar de usuario. */
export function QnStoreProvider({ children }: { children?: ReactNode }) {
  const [api] = useState(createQnStore)
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useQnApi(): QnApi {
  const api = useContext(StoreContext)
  if (!api) throw new Error('QnStoreProvider ausente')
  return api
}

export function useQn<T>(selector: (s: QnStore) => T): T {
  return useStore(useQnApi(), selector)
}

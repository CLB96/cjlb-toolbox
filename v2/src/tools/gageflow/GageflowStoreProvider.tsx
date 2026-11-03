import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { crearGageflowStore, type GageflowApi, type GageflowStore } from './store'

const StoreContext = createContext<GageflowApi | null>(null)

/** Store propio por montaje: AppShell remonta con key={uid} al cambiar de usuario. */
export function GageflowStoreProvider({ children }: { children?: ReactNode }) {
  const [api] = useState(crearGageflowStore)
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useGageflowApi(): GageflowApi {
  const api = useContext(StoreContext)
  if (!api) throw new Error('GageflowStoreProvider ausente')
  return api
}

export function useGageflow<T>(selector: (s: GageflowStore) => T): T {
  return useStore(useGageflowApi(), selector)
}

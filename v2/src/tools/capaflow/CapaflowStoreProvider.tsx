import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createCapaStore, type CapaApi, type CapaStore } from './store'

const StoreContext = createContext<CapaApi | null>(null)

/** Crea un store propio por montaje (AppShell remonta con key={uid} al cambiar de usuario). */
export function CapaflowStoreProvider({ children }: { children?: ReactNode }) {
  const [api] = useState(createCapaStore)
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useCapaApi(): CapaApi {
  const api = useContext(StoreContext)
  if (!api) throw new Error('CapaflowStoreProvider ausente')
  return api
}

export function useCapa<T>(selector: (s: CapaStore) => T): T {
  return useStore(useCapaApi(), selector)
}

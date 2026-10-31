import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createVectorizrStore, type VectorizrApi, type VectorizrStore } from './store'

const StoreContext = createContext<VectorizrApi | null>(null)

/** Un store por montaje (AppShell remonta con key={uid} al cambiar de usuario). */
export function VectorizrStoreProvider({ children }: { children?: ReactNode }) {
  const [api] = useState(createVectorizrStore)
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useVectorizrApi(): VectorizrApi {
  const api = useContext(StoreContext)
  if (!api) throw new Error('VectorizrStoreProvider ausente')
  return api
}

export function useVectorizr<T>(selector: (s: VectorizrStore) => T): T {
  return useStore(useVectorizrApi(), selector)
}

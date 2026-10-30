import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createGapcheckStore, type GapcheckApi, type GapcheckStore } from './store'

const StoreContext = createContext<GapcheckApi | null>(null)

/** Crea un store propio por montaje (AppShell remonta con key={uid} al cambiar de usuario). */
export function GapcheckStoreProvider({ children }: { children?: ReactNode }) {
  const [api] = useState(createGapcheckStore)
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useGapcheckApi(): GapcheckApi {
  const api = useContext(StoreContext)
  if (!api) throw new Error('GapcheckStoreProvider ausente')
  return api
}

export function useGapcheck<T>(selector: (s: GapcheckStore) => T): T {
  return useStore(useGapcheckApi(), selector)
}

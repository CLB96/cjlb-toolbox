import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createGanttStore, type GanttApi, type GanttStore } from './store'

const StoreContext = createContext<GanttApi | null>(null)

/** Crea un store propio por montaje (AppShell remonta con key={uid} al cambiar de usuario). */
export function GanttStoreProvider({ children }: { children?: ReactNode }) {
  const [api] = useState(createGanttStore)
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useGanttApi(): GanttApi {
  const api = useContext(StoreContext)
  if (!api) throw new Error('GanttStoreProvider ausente')
  return api
}

export function useGantt<T>(selector: (s: GanttStore) => T): T {
  return useStore(useGanttApi(), selector)
}

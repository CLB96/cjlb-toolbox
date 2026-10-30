import {
  createContext,
  useContext,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { useStore } from 'zustand'
import { createBondlineStore, type BondlineApi, type BondlineStore } from './store'

const StoreContext = createContext<BondlineApi | null>(null)

/**
 * Canvas renderizado por la gráfica: ref por instancia, junto al store, para que el export
 * lo lea sin getters de módulo ni elementos DOM en el store (el store se serializa).
 */
const ChartCanvasContext = createContext<MutableRefObject<HTMLCanvasElement | null> | null>(null)

/** Crea un store propio por montaje (AppShell remonta con key={uid} al cambiar de usuario). */
export function BondlineStoreProvider({ children }: { children?: ReactNode }) {
  const [api] = useState(createBondlineStore)
  const chartCanvas = useRef<HTMLCanvasElement | null>(null)
  return (
    <StoreContext.Provider value={api}>
      <ChartCanvasContext.Provider value={chartCanvas}>{children}</ChartCanvasContext.Provider>
    </StoreContext.Provider>
  )
}

export function useBondlineApi(): BondlineApi {
  const api = useContext(StoreContext)
  if (!api) throw new Error('BondlineStoreProvider ausente')
  return api
}

export function useBondline<T>(selector: (s: BondlineStore) => T): T {
  return useStore(useBondlineApi(), selector)
}

/** Ref al canvas de la gráfica de esta instancia (null si no hay gráfica montada). */
export function useBondlineChartCanvas(): MutableRefObject<HTMLCanvasElement | null> {
  const ref = useContext(ChartCanvasContext)
  if (!ref) throw new Error('BondlineStoreProvider ausente')
  return ref
}

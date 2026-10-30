import {
  createContext,
  useContext,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { useStore } from 'zustand'
import { createGapcheckStore, type GapcheckApi, type GapcheckStore } from './store'

const StoreContext = createContext<GapcheckApi | null>(null)

/**
 * Canvas renderizado por la gráfica (Ruling P2-A): ref por instancia, junto al store,
 * para que el export (Task 8) lo lea sin getters de módulo ni elementos DOM en el store
 * (el store se serializa para persistir).
 */
const ChartCanvasContext = createContext<MutableRefObject<HTMLCanvasElement | null> | null>(null)

/** Crea un store propio por montaje (AppShell remonta con key={uid} al cambiar de usuario). */
export function GapcheckStoreProvider({ children }: { children?: ReactNode }) {
  const [api] = useState(createGapcheckStore)
  const chartCanvas = useRef<HTMLCanvasElement | null>(null)
  return (
    <StoreContext.Provider value={api}>
      <ChartCanvasContext.Provider value={chartCanvas}>{children}</ChartCanvasContext.Provider>
    </StoreContext.Provider>
  )
}

export function useGapcheckApi(): GapcheckApi {
  const api = useContext(StoreContext)
  if (!api) throw new Error('GapcheckStoreProvider ausente')
  return api
}

export function useGapcheck<T>(selector: (s: GapcheckStore) => T): T {
  return useStore(useGapcheckApi(), selector)
}

/** Ref al canvas de la gráfica de esta instancia (null si no hay gráfica montada). */
export function useGapcheckChartCanvas(): MutableRefObject<HTMLCanvasElement | null> {
  const ref = useContext(ChartCanvasContext)
  if (!ref) throw new Error('GapcheckStoreProvider ausente')
  return ref
}

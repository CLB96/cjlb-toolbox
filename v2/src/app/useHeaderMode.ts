import { useEffect, useState } from 'react'

/** full: barra completa · collapsing: se aprieta hacia el logo · col: solo el círculo. */
export type BarMode = 'full' | 'collapsing' | 'col'

/** Tiempo que la barra completa se queda visible al entrar a una herramienta. */
export const FULL_MS = 2000
/** Duración del colapso; al terminar el contenido sube de verdad (cambia el layout una sola vez). */
export const COLLAPSE_MS = 1400

/**
 * Estado del encabezado principal: en Inicio y Uso es un círculo; al entrar a una herramienta se ve completo
 * FULL_MS y luego se aprieta a círculo. Cambiar de herramienta con el círculo no lo vuelve a abrir.
 */
export function useHeaderMode(isTool: boolean): BarMode {
  const [mode, setMode] = useState<BarMode>(isTool ? 'full' : 'col')

  useEffect(() => {
    setMode(isTool ? 'full' : 'col')
  }, [isTool])

  useEffect(() => {
    if (mode === 'full') {
      const id = setTimeout(() => setMode('collapsing'), FULL_MS)
      return () => clearTimeout(id)
    }
    if (mode === 'collapsing') {
      const id = setTimeout(() => {
        setMode('col')
        // el contenido subió: las herramientas que miden la ventana (VectoriZr) se reajustan
        window.dispatchEvent(new Event('resize'))
      }, COLLAPSE_MS)
      return () => clearTimeout(id)
    }
    return undefined
  }, [mode])

  return mode
}

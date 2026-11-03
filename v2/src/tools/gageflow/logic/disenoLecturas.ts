/** Lecturas del estudio y diseño que se deduce de ellas. */
import { claveEtiqueta, compararNatural } from './celdas'

export interface Reading {
  pieza: string
  operador: string
  ensayo: number
  valor: number
  /** Fila de Excel (1-based), para señalar el error al usuario. */
  fila: number
}

/** Diseño resuelto y ordenado: la base del cálculo y de la tabla. */
export interface Diseno {
  piezas: string[]
  operadores: string[]
  ensayos: number[]
}

export interface FilaDiseno {
  pieza: string
  operador: string
  ensayo: number
}

export const disenoVacio = (): Diseno => ({ piezas: [], operadores: [], ensayos: [] })

/** Ordena y deduplica a partir de las filas, en cualquier orden que lleguen. */
export function construirDiseno(filas: readonly FilaDiseno[]): Diseno {
  const piezas = new Map<string, string>()
  const operadores = new Map<string, string>()
  const ensayos = new Set<number>()
  for (const f of filas) {
    if (!piezas.has(claveEtiqueta(f.pieza))) piezas.set(claveEtiqueta(f.pieza), f.pieza.trim())
    if (!operadores.has(claveEtiqueta(f.operador))) operadores.set(claveEtiqueta(f.operador), f.operador.trim())
    ensayos.add(f.ensayo)
  }
  return {
    piezas: [...piezas.values()].sort(compararNatural),
    operadores: [...operadores.values()].sort(compararNatural),
    ensayos: [...ensayos].sort((a, b) => a - b),
  }
}

/** Coloca cada lectura en [pieza][operador][ensayo-1]. Huecos quedan en null. */
export function aMatriz(lecturas: readonly Reading[], diseno: Diseno): (number | null)[][][] {
  const p = new Map(diseno.piezas.map((v, i) => [claveEtiqueta(v), i]))
  const o = new Map(diseno.operadores.map((v, i) => [claveEtiqueta(v), i]))
  const e = new Map(diseno.ensayos.map((v, i) => [v, i]))
  const m: (number | null)[][][] = diseno.piezas.map(() =>
    diseno.operadores.map(() => diseno.ensayos.map(() => null)))
  for (const l of lecturas) {
    const i = p.get(claveEtiqueta(l.pieza))
    const j = o.get(claveEtiqueta(l.operador))
    const k = e.get(l.ensayo)
    if (i === undefined || j === undefined || k === undefined) continue
    m[i][j][k] = l.valor
  }
  return m
}

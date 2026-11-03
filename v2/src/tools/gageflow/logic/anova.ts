/** ANOVA de dos factores con interacción, efectos aleatorios (AIAG MSA). */
import { pValorF } from './distrib'
import type { FilaAnova } from './types'

export interface AnovaCrudo {
  filas: FilaAnova[]
  ss: { pieza: number; operador: number; interaccion: number; error: number }
  gl: { pieza: number; operador: number; interaccion: number; error: number }
  ms: { pieza: number; operador: number; interaccion: number; error: number }
}

const media = (v: readonly number[]): number => v.reduce((a, b) => a + b, 0) / v.length

/**
 * @param m matriz completa [pieza][operador][ensayo]; sin huecos.
 */
export function calcularAnova(m: readonly number[][][]): AnovaCrudo {
  const p = m.length
  const o = m[0].length
  const r = m[0][0].length

  const todas: number[] = []
  for (const fila of m) for (const celda of fila) for (const v of celda) todas.push(v)
  const gran = media(todas)

  const yPieza = m.map((fila) => media(fila.flat()))
  const yOperador = Array.from({ length: o }, (_, j) =>
    media(m.map((fila) => media(fila[j]))))
  const yCelda = m.map((fila) => fila.map((celda) => media(celda)))

  const ssPieza = o * r * yPieza.reduce((a, v) => a + (v - gran) ** 2, 0)
  const ssOperador = p * r * yOperador.reduce((a, v) => a + (v - gran) ** 2, 0)

  let ssInter = 0
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < o; j++) {
      ssInter += (yCelda[i][j] - yPieza[i] - yOperador[j] + gran) ** 2
    }
  }
  ssInter *= r

  let ssError = 0
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < o; j++) {
      for (let k = 0; k < r; k++) ssError += (m[i][j][k] - yCelda[i][j]) ** 2
    }
  }

  const gl = { pieza: p - 1, operador: o - 1, interaccion: (p - 1) * (o - 1), error: p * o * (r - 1) }
  const ms = {
    pieza: ssPieza / gl.pieza,
    operador: ssOperador / gl.operador,
    interaccion: ssInter / gl.interaccion,
    error: ssError / gl.error,
  }

  const fPieza = ms.pieza / ms.interaccion
  const fOperador = ms.operador / ms.interaccion
  const fInter = ms.interaccion / ms.error

  const filas: FilaAnova[] = [
    { fuente: 'pieza', gl: gl.pieza, ss: ssPieza, ms: ms.pieza, f: fPieza, p: pValorF(fPieza, gl.pieza, gl.interaccion) },
    { fuente: 'operador', gl: gl.operador, ss: ssOperador, ms: ms.operador, f: fOperador, p: pValorF(fOperador, gl.operador, gl.interaccion) },
    { fuente: 'interaccion', gl: gl.interaccion, ss: ssInter, ms: ms.interaccion, f: fInter, p: pValorF(fInter, gl.interaccion, gl.error) },
    { fuente: 'error', gl: gl.error, ss: ssError, ms: ms.error, f: null, p: null },
  ]

  return { filas, ss: { pieza: ssPieza, operador: ssOperador, interaccion: ssInter, error: ssError }, gl, ms }
}

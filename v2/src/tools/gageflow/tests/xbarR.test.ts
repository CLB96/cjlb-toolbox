import { describe, expect, it } from 'vitest'
import csv from './fixtures/datos-grr.csv?raw'
import { aMatriz, parseGrid } from '../logic/parse'
import { calcularXbarR } from '../logic/xbarR'

/** Dos piezas, ensayos en filas: el operador 2 mide `sesgo` por encima del 1. */
function matriz(operadores: number, ensayos: number, sesgo: number): number[][][] {
  return [10, 20].map((base) =>
    Array.from({ length: operadores }, (_, o) =>
      Array.from({ length: ensayos }, (_, e) => base + o * sesgo + e * 0.1)))
}

describe('comprobación X̄-R', () => {
  it('con 2 operadores usa d2* = 1.41421 para la reproducibilidad', () => {
    const x = calcularXbarR(matriz(2, 2, 1), 10)
    const ev = 0.1 / 1.128
    const av = Math.sqrt((1 / 1.41421) ** 2 - (ev ** 2) / (2 * 2))
    expect(x?.ev).toBeCloseTo(ev, 6)
    expect(x?.av).toBeCloseTo(av, 4)
  })

  it('con 3 operadores usa d2* = 1.91155 aunque haya 2 ensayos', () => {
    const x = calcularXbarR(matriz(3, 2, 1), null)
    const ev = 0.1 / 1.128
    const av = Math.sqrt((2 / 1.91155) ** 2 - (ev ** 2) / (2 * 2))
    expect(x?.av).toBeCloseTo(av, 4)
    expect(x?.pctTolerancia).toBeNull()
  })

  it('el factor de reproducibilidad no cambia con el número de ensayos', () => {
    const d2 = calcularXbarR(matriz(3, 2, 5), null)
    const d3 = calcularXbarR(matriz(3, 3, 5), null)
    expect(d2?.av).toBeCloseTo(d3?.av ?? 0, 2)
  })

  it('la reproducibilidad no baja de cero cuando los operadores coinciden', () => {
    expect(calcularXbarR(matriz(2, 3, 0), 10)?.av).toBe(0)
  })

  it('calcula %tolerancia sobre 6 sigma', () => {
    const x = calcularXbarR(matriz(2, 2, 1), 10)
    expect(x?.pctTolerancia).toBeCloseTo((100 * 6 * (x?.grr ?? 0)) / 10, 6)
  })

  it('en el estudio de ejemplo queda cerca del ANOVA', () => {
    const lineas = csv.trim().split(/\r?\n/).map((l) => l.split(','))
    const r = parseGrid(lineas.map((c, i) => (i === 0 ? c : [c[0], c[1], Number(c[2]), Number(c[3])])))
    const x = calcularXbarR(aMatriz(r.lecturas, r.diseno) as number[][][], 0.2)
    expect(x?.ev).toBeCloseTo(0.0056704, 6)
    expect(x?.av).toBeCloseTo(0.0030185, 6)
    expect(x?.pctTolerancia).toBeCloseTo(19.271, 2)
  })

  it('no calcula sin factor para esos ensayos', () => {
    expect(calcularXbarR(matriz(2, 11, 1), 10)).toBeNull()
    expect(calcularXbarR(matriz(21, 2, 1), 10)).toBeNull()
  })
})

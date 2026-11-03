import { describe, expect, it } from 'vitest'
import { calcularEstudio } from '../logic/estudio'
import { betaIncompleta, pValorF } from '../logic/distrib'
import { categoriasDistintas, recomendacionesDe, veredictoDe } from '../logic/verdict'
import type { FilaAnova } from '../logic/types'

/** 5 piezas, 2 operadores, 3 ensayos, con ruido fijo y reproducible. */
function matrizBase(sesgo = 0.001): number[][][] {
  const ruido = [0.002, -0.001, 0.001, -0.002, 0.0015, -0.0005]
  return [0, 1, 2, 3, 4].map((p) =>
    [0, 1].map((o) => [0, 1, 2].map((e) => 2.5 + p * 0.02 + o * sesgo + ruido[(p + o * 3 + e) % 6])))
}

const fila = (fuente: FilaAnova['fuente'], p: number): FilaAnova => ({ fuente, gl: 1, ss: 1, ms: 1, f: 1, p })

describe('distribución F', () => {
  it('con F = 1 y grados iguales el p-valor es 0.5', () => {
    expect(pValorF(1, 5, 5)).toBeCloseTo(0.5, 8)
  })

  it('coincide con el valor crítico de tablas F(0.05; 2, 18) = 3.555', () => {
    expect(pValorF(3.555, 2, 18)).toBeCloseTo(0.05, 3)
  })

  it('devuelve 1 para F no válida', () => {
    expect(pValorF(0, 2, 18)).toBe(1)
    expect(pValorF(Number.NaN, 2, 18)).toBe(1)
  })

  it('la beta incompleta respeta sus extremos', () => {
    expect(betaIncompleta(2, 3, 0)).toBe(0)
    expect(betaIncompleta(2, 3, 1)).toBe(1)
    expect(betaIncompleta(2, 2, 0.5)).toBeCloseTo(0.5, 8)
  })
})

describe('veredicto', () => {
  it.each([
    [9.99, 'aceptable'], [10, 'condicional'], [30, 'condicional'], [30.01, 'noAceptable'],
  ])('%s %% de GRR es %s', (pct, esperado) => {
    expect(veredictoDe(pct)).toBe(esperado)
  })

  it('ndc redondea hacia abajo y es 0 sin variación', () => {
    expect(categoriasDistintas(10, 2)).toBe(7)
    expect(categoriasDistintas(0, 2)).toBe(0)
    expect(categoriasDistintas(10, 0)).toBe(0)
  })

  it('recomienda según la causa, sin repetir', () => {
    const r = recomendacionesDe({
      pctEv: 5, pctAv: 8, ndc: 3, ensayos: 2, ancho: null,
      anova: [fila('interaccion', 0.01), fila('operador', 0.01)],
    })
    expect(r).toEqual(['interaccion', 'reproducibilidad', 'pocasPiezas', 'pocosEnsayos', 'sinLimites'])
  })

  it('señala la repetibilidad cuando pesa más que la reproducibilidad', () => {
    const r = recomendacionesDe({
      pctEv: 8, pctAv: 5, ndc: 9, ensayos: 3, ancho: 1,
      anova: [fila('interaccion', 0.5), fila('operador', 0.5)],
    })
    expect(r).toEqual(['repetibilidad'])
  })
})

describe('estudio', () => {
  it('el veredicto usa la tolerancia si hay límites y la variación si no', () => {
    const con = calcularEstudio(matrizBase(), { lsl: 0, usl: 100 })
    expect(con.veredicto).toBe('aceptable')
    const sin = calcularEstudio(matrizBase())
    expect(sin.veredicto).toBe(veredictoDe(sin.pctGrrVariacion))
  })

  it('con un solo límite no calcula %tolerancia', () => {
    const r = calcularEstudio(matrizBase(), { lsl: 2.4 })
    expect(r.anchoTolerancia).toBeNull()
    expect(r.pctGrrTolerancia).toBeNull()
  })

  it('los componentes suman la varianza total', () => {
    const c = calcularEstudio(matrizBase()).componentes
    const suma = c.ev.varianza + c.av.varianza + c.interaccion.varianza + c.parte.varianza
    expect(suma).toBeCloseTo(c.total.sd ** 2, 10)
    expect(c.grr.varianza).toBeCloseTo(c.ev.varianza + c.av.varianza + c.interaccion.varianza, 10)
  })

  it('las contribuciones suman 100 %', () => {
    const c = calcularEstudio(matrizBase()).componentes
    expect(c.grr.pctContribucion + c.parte.pctContribucion).toBeCloseTo(100, 6)
  })

  it('el ANOVA tiene los grados de libertad del diseño', () => {
    const gl = calcularEstudio(matrizBase()).anova.map((f) => [f.fuente, f.gl])
    expect(gl).toEqual([['pieza', 4], ['operador', 1], ['interaccion', 4], ['error', 20]])
  })

  it('no falla si todas las lecturas son iguales', () => {
    const plana = matrizBase().map((a) => a.map((b) => b.map(() => 2.5)))
    const r = calcularEstudio(plana, { lsl: 2, usl: 3 })
    expect(r.ok).toBe(false)
    expect(r.errores).toEqual(['sinVariacion'])
  })

  it('rechaza diseños desbalanceados o demasiado pequeños', () => {
    const coja = matrizBase().map((a) => a.map((b) => [...b]))
    coja[1][1].pop()
    expect(calcularEstudio(coja).errores).toContain('desbalanceado')
    expect(calcularEstudio([[[1, 2]]]).errores).toContain('pocosDatos')
    expect(calcularEstudio([]).ok).toBe(false)
  })

  it('incluye la comprobación X̄-R con el mismo ancho de tolerancia', () => {
    const r = calcularEstudio(matrizBase(), { lsl: 2, usl: 3 })
    expect(r.xbarR?.pctTolerancia).toBeCloseTo((100 * 6 * (r.xbarR?.grr ?? 0)) / 1, 8)
  })
})

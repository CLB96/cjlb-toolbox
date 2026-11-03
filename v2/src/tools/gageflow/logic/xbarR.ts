/**
 * Comprobación por el método de promedios y rangos (X̄-R).
 *
 * Aproximación: AIAG usa un factor d2* que depende de (operadores, ensayos);
 * aquí se emplea d2(ensayos) también para la reproducibilidad. Es una
 * comprobación cruzada del ANOVA, no el resultado principal.
 */
import type { XbarR } from './types'

const D2: Readonly<Record<number, number>> = {
  2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.97, 10: 3.078,
}

const media = (v: readonly number[]): number => v.reduce((a, b) => a + b, 0) / v.length

export function calcularXbarR(m: readonly number[][][], ancho: number | null): XbarR | null {
  const r = m[0]?.[0]?.length ?? 0
  const d2 = D2[r]
  if (!d2) return null

  const p = m.length
  const o = m[0].length

  const rangos: number[] = []
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < o; j++) {
      const valores = m[i][j]
      rangos.push(Math.max(...valores) - Math.min(...valores))
    }
  }
  const ev = media(rangos) / d2

  const mediasOperador = m[0].map((_, j) =>
    media(m.map((fila) => media(fila[j]))))
  const diferencia = Math.max(...mediasOperador) - Math.min(...mediasOperador)
  const av = Math.sqrt(Math.max(0, (diferencia / d2) ** 2 - (ev ** 2) / (p * r)))
  const grr = Math.sqrt(ev ** 2 + av ** 2)

  return {
    ev,
    av,
    grr,
    pctTolerancia: ancho ? (100 * 6 * grr) / ancho : null,
  }
}

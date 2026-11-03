/**
 * Comprobación por el método de promedios y rangos (X̄-R), según AIAG MSA.
 *
 * La repetibilidad usa d2 según los ensayos. La reproducibilidad usa d2* según
 * los operadores, con un solo subgrupo (g = 1). Es una comprobación cruzada del
 * ANOVA, no el resultado principal.
 */
import type { XbarR } from './types'

const D2: Readonly<Record<number, number>> = {
  2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.97, 10: 3.078,
}

/** d2*(m, g = 1), de m = 2 a 20 operadores. */
const D2_ESTRELLA: Readonly<Record<number, number>> = {
  2: 1.41421, 3: 1.91155, 4: 2.23887, 5: 2.48124, 6: 2.67253, 7: 2.82981, 8: 2.96288,
  9: 3.07794, 10: 3.17905, 11: 3.26909, 12: 3.35016, 13: 3.42378, 14: 3.49116, 15: 3.55333,
  16: 3.61071, 17: 3.66422, 18: 3.71424, 19: 3.76118, 20: 3.80537,
}

const media = (v: readonly number[]): number => v.reduce((a, b) => a + b, 0) / v.length

export function calcularXbarR(m: readonly number[][][], ancho: number | null): XbarR | null {
  const r = m[0]?.[0]?.length ?? 0
  const o = m[0]?.length ?? 0
  const d2 = D2[r]
  const d2Estrella = D2_ESTRELLA[o]
  if (!d2 || !d2Estrella) return null

  const p = m.length

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
  const av = Math.sqrt(Math.max(0, (diferencia / d2Estrella) ** 2 - (ev ** 2) / (p * r)))
  const grr = Math.sqrt(ev ** 2 + av ** 2)

  return {
    ev,
    av,
    grr,
    pctTolerancia: ancho ? (100 * 6 * grr) / ancho : null,
  }
}

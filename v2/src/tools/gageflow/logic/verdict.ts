/** Veredicto y recomendaciones a partir de los índices (AIAG MSA 4ª ed.). */
import type { FilaAnova, Recomendacion, Veredicto } from './types'

export const LIMITE_ACEPTABLE = 10
export const LIMITE_CONDICIONAL = 30
export const NDC_MINIMO = 5

/** Categorías distintas que el sistema puede distinguir. */
export function categoriasDistintas(pv: number, grr: number): number {
  if (!(grr > 0) || !(pv > 0)) return 0
  return Math.floor(1.41 * (pv / grr))
}

/** El veredicto se decide sobre %GRR de tolerancia; si no hay límites, sobre la variación total. */
export function veredictoDe(pctGrr: number): Veredicto {
  if (pctGrr < LIMITE_ACEPTABLE) return 'aceptable'
  if (pctGrr <= LIMITE_CONDICIONAL) return 'condicional'
  return 'noAceptable'
}

export interface EntradaRecomendaciones {
  pctEv: number | null
  pctAv: number | null
  ndc: number
  ensayos: number
  ancho: number | null
  anova: readonly FilaAnova[]
}

/**
 * Devuelve códigos, no texto: el i18n de la herramienta los traduce.
 * Ordenadas de la causa más probable a la más estructural.
 */
export function recomendacionesDe(e: EntradaRecomendaciones): Recomendacion[] {
  const salida: Recomendacion[] = []
  const pInter = e.anova.find((f) => f.fuente === 'interaccion')?.p ?? 1
  const pOperador = e.anova.find((f) => f.fuente === 'operador')?.p ?? 1

  if (pInter < 0.05) salida.push('interaccion')
  if (pOperador < 0.05) salida.push('reproducibilidad')
  if ((e.pctEv ?? 0) >= (e.pctAv ?? 0)) salida.push('repetibilidad')
  if (e.ndc < NDC_MINIMO) salida.push('pocasPiezas')
  if (e.ensayos < 3) salida.push('pocosEnsayos')
  if (e.ancho === null) salida.push('sinLimites')

  return [...new Set(salida)]
}

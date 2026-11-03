/** Componentes de varianza y sus porcentajes (AIAG). */
import type { AnovaCrudo } from './anova'
import type { Componente, Componentes } from './types'

const seis = (varianza: number) => 6 * Math.sqrt(Math.max(0, varianza))

function componente(varianza: number, total: number, ancho: number | null): Componente {
  const sd = Math.sqrt(Math.max(0, varianza))
  return {
    varianza: Math.max(0, varianza),
    sd,
    seis: seis(varianza),
    pctTolerancia: ancho ? (100 * seis(varianza)) / ancho : null,
    pctContribucion: total > 0 ? (100 * Math.max(0, varianza)) / total : 0,
  }
}

export interface ComponentesCrudo {
  componentes: Componentes
  varGrr: number
  varTotal: number
}

export function calcularComponentes(
  anova: AnovaCrudo, piezas: number, operadores: number, ensayos: number, ancho: number | null,
): ComponentesCrudo {
  const { ms } = anova
  // Efectos aleatorios: se recortan a 0 los componentes negativos (estimaciones
  // por diferencia de medias cuadráticas pueden salir por debajo de cero).
  const varE = ms.error
  const varInter = Math.max(0, (ms.interaccion - ms.error) / ensayos)
  const varOperador = Math.max(0, (ms.operador - ms.interaccion) / (piezas * ensayos))
  const varPieza = Math.max(0, (ms.pieza - ms.interaccion) / (operadores * ensayos))

  const varGrr = varE + varInter + varOperador
  const varTotal = varGrr + varPieza

  const componentes: Componentes = {
    ev: componente(varE, varTotal, ancho),
    av: componente(varOperador, varTotal, ancho),
    interaccion: componente(varInter, varTotal, ancho),
    grr: componente(varGrr, varTotal, ancho),
    parte: componente(varPieza, varTotal, ancho),
    total: { sd: Math.sqrt(varTotal), seis: 6 * Math.sqrt(varTotal) },
  }
  return { componentes, varGrr, varTotal }
}

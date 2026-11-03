/** Orquestador: de la matriz [pieza][operador][ensayo] al resultado del estudio. */
import { calcularAnova } from './anova'
import { calcularComponentes } from './componentes'
import { calcularXbarR } from './xbarR'
import { categoriasDistintas, recomendacionesDe, veredictoDe } from './verdict'
import type {
  CodigoError, Componente, Componentes, EstudioResultado, Limites, XbarR,
} from './types'

const vacio = (): Componente => ({
  varianza: 0, sd: 0, seis: 0, pctTolerancia: null, pctContribucion: 0,
})

const componentesVacios = (): Componentes => ({
  ev: vacio(), av: vacio(), interaccion: vacio(), grr: vacio(), parte: vacio(),
  total: { sd: 0, seis: 0 },
})

/** Salida directa de `aMatriz`: los huecos llegan como null. */
export type Matriz = readonly (readonly (readonly (number | null)[])[])[]

function validar(m: Matriz): CodigoError[] {
  const errores: CodigoError[] = []
  const p = m.length
  const o = m[0]?.length ?? 0
  const r = m[0]?.[0]?.length ?? 0
  if (p < 2 || o < 2 || r < 2) errores.push('pocosDatos')
  for (const fila of m) {
    if (fila.length !== o) { errores.push('desbalanceado'); break }
    if (fila.some((celda) => celda.length !== r)) { errores.push('desbalanceado'); break }
    if (fila.some((celda) => celda.some((v) => !Number.isFinite(v)))) {
      errores.push('valorFaltante')
      break
    }
  }
  if (o < 2) errores.push('pocosOperadores')
  if (r < 2) errores.push('pocosEnsayos')
  if (p * o * r < 10) errores.push('pocosDatos')
  return [...new Set(errores)]
}

export function calcularEstudio(
  matriz: Matriz,
  limites: Limites = {},
): EstudioResultado {
  const p = matriz.length
  const o = matriz[0]?.length ?? 0
  const r = matriz[0]?.[0]?.length ?? 0
  const ambos = Number.isFinite(limites.lsl) && Number.isFinite(limites.usl)
  const ancho = ambos ? Math.abs((limites.usl as number) - (limites.lsl as number)) : null

  const errores = validar(matriz)
  if (errores.length) {
    return {
      ok: false, errores, piezas: p, operadores: o, ensayos: r, anchoTolerancia: ancho,
      anova: [], componentes: componentesVacios(), pctGrrTolerancia: null,
      pctGrrVariacion: 0, ndc: 0, veredicto: 'noAceptable', recomendaciones: [], xbarR: null,
    }
  }

  const m = matriz as unknown as number[][][]
  const anova = calcularAnova(m)
  const { componentes, varGrr, varTotal } = calcularComponentes(anova, p, o, r, ancho)

  if (!(varTotal > 0)) {
    return {
      ok: false, errores: ['sinVariacion'], piezas: p, operadores: o, ensayos: r,
      anchoTolerancia: ancho, anova: anova.filas, componentes,
      pctGrrTolerancia: null, pctGrrVariacion: 0, ndc: 0,
      veredicto: 'noAceptable', recomendaciones: [], xbarR: null,
    }
  }

  const pctGrrTolerancia = ancho ? (100 * 6 * Math.sqrt(varGrr)) / ancho : null
  const pctGrrVariacion = (100 * 6 * Math.sqrt(varGrr)) / (6 * Math.sqrt(varTotal))
  const ndc = categoriasDistintas(6 * Math.sqrt(varTotal - varGrr), 6 * Math.sqrt(varGrr))
  const veredicto = veredictoDe(pctGrrTolerancia ?? pctGrrVariacion)

  const xbarR: XbarR | null = r >= 2 ? calcularXbarR(m, ancho) : null

  const recomendaciones = recomendacionesDe({
    pctEv: componentes.ev.pctTolerancia,
    pctAv: componentes.av.pctTolerancia,
    ndc, ensayos: r, ancho, anova: anova.filas,
  })

  return {
    ok: true, errores: [], piezas: p, operadores: o, ensayos: r, anchoTolerancia: ancho,
    anova: anova.filas, componentes, pctGrrTolerancia, pctGrrVariacion, ndc,
    veredicto, recomendaciones, xbarR,
  }
}
